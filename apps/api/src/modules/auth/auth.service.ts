import { v4 as uuidv4 } from "uuid";
import { authRepository } from "./auth.repository.js";
import { hashPassword, comparePassword } from "../../lib/hash.js";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "../../lib/jwt.js";
import { ConflictError, UnauthorizedError, NotFoundError } from "../../lib/errors.js";
import { send2faEmail } from "./email-2fa.service.js";
import { sendPasswordResetEmail } from "./email-reset.service.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import jwt from "jsonwebtoken";
import type { RegisterInput, LoginInput, Verify2faInput, GoogleLoginInput, AppleLoginInput, ForgotPasswordInput, ResetPasswordInput } from "./auth.schemas.js";

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════

function getRefreshExpiry(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
}

function generate2faCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Temp token = signed JWT with short expiry, used to tie 2FA to a login attempt */
function signTempToken(userId: string): string {
    return signAccessToken({ userId, purpose: "2fa" }, "10m");
}

function verifyTempToken(token: string): { userId: string } {
    try {
        const payload = verifyAccessToken(token) as any;
        if (!payload?.userId) throw new Error("Invalid temp token");
        return { userId: payload.userId };
    } catch {
        throw new UnauthorizedError("Token temporário inválido ou expirado");
    }
}

async function buildUserResponse(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user || !user.active) throw new UnauthorizedError("Usuário não encontrado ou desativado");

    const permissions = await authRepository.findPermissionsByUserId(userId);

    let companyName = "Empresa Não Informada";
    let phoneNum = user.phone;

    try {
        const { prisma } = await import("../../config/database.js");
        
        // 1. Try InstitutionalProfile (Admin/Owner)
        const instProfile = await prisma.institutionalProfile.findUnique({
            where: { userId: user.id }
        });

        if (instProfile) {
            if (instProfile.companyName) companyName = instProfile.companyName;
            if (instProfile.phone) phoneNum = instProfile.phone;
        } else {
            // 2. Try Client
            const clientRec = await prisma.client.findFirst({
                where: { email: user.email }
            });
            if (clientRec) {
                if (clientRec.company) companyName = clientRec.company;
                else if (clientRec.name) companyName = clientRec.name;
                if (clientRec.phone && !phoneNum) phoneNum = clientRec.phone;
            }
        }
    } catch(err) {}

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: phoneNum,
        company: companyName,
        allowedApps: (user as any).allowedApps ?? [],
        permissions,
    };
}

async function issueTokens(userId: string, role: string) {
    const accessToken = signAccessToken({ userId, role });
    const refreshTokenValue = uuidv4();
    await authRepository.createRefreshToken({
        token: refreshTokenValue,
        userId,
        expiresAt: getRefreshExpiry(),
    });
    return { accessToken, refreshToken: refreshTokenValue };
}

async function trigger2fa(userId: string, email: string, name: string): Promise<string> {
    const code = generate2faCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min

    await authRepository.createVerificationCode({
        userId,
        code,
        type: "login_2fa",
        expiresAt,
    });

    // Send email (async — don't block response)
    send2faEmail(email, code, name).catch((err) => {
        logger.error({ err }, "Failed to send 2FA email");
    });

    return signTempToken(userId);
}

// ═══════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════

export const authService = {
    async register(input: RegisterInput) {
        const existing = await authRepository.findUserByEmail(input.email);
        if (existing) throw new ConflictError("E-mail já cadastrado");

        const hashedPassword = await hashPassword(input.password);
        const user = await authRepository.createUser({
            name: input.name,
            email: input.email,
            password: hashedPassword,
        });

        // On register, issue tokens directly (no 2FA on first registration)
        const tokens = await issueTokens(user.id, user.role);
        const permissions = await authRepository.findPermissionsByUserId(user.id);

        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions },
            ...tokens,
        };
    },

    async login(input: LoginInput) {
        const user = await authRepository.findUserByEmail(input.email);
        if (!user) throw new UnauthorizedError("E-mail ou senha inválidos");
        if (!user.active) throw new UnauthorizedError("Conta desativada");

        const validPassword = await comparePassword(input.password, user.password);
        if (!validPassword) throw new UnauthorizedError("E-mail ou senha inválidos");

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            const tempToken = await trigger2fa(user.id, user.email, user.name);
            return { requires2fa: true, tempToken };
        }

        // No 2FA — issue tokens directly
        const tokens = await issueTokens(user.id, user.role);
        const userResponse = await buildUserResponse(user.id);
        return { requires2fa: false, user: userResponse, ...tokens };
    },

    async verify2fa(input: Verify2faInput) {
        const { userId } = verifyTempToken(input.tempToken);

        const code = await authRepository.findValidCode(userId, input.code, "login_2fa");
        if (!code) throw new UnauthorizedError("Código inválido ou expirado");

        await authRepository.markCodeUsed(code.id);

        const user = await authRepository.findUserById(userId);
        if (!user || !user.active) throw new UnauthorizedError("Usuário não encontrado ou desativado");

        const tokens = await issueTokens(user.id, user.role);
        const userResponse = await buildUserResponse(user.id);

        return { user: userResponse, ...tokens };
    },

    async googleLogin(input: GoogleLoginInput) {
        // Validate Google ID token
        const googleUser = await validateGoogleToken(input.credential);
        if (!googleUser) throw new UnauthorizedError("Token Google inválido");

        // Check if user exists by googleId or email
        let user = await authRepository.findUserByGoogleId(googleUser.sub);

        if (!user) {
            // Try to find by email and link
            user = await authRepository.findUserByEmail(googleUser.email);
            if (user) {
                await authRepository.linkGoogleAccount(user.id, googleUser.sub);
            } else {
                // Create new user (random password since they use Google)
                const hashedPassword = await hashPassword(uuidv4());
                user = await authRepository.createUser({
                    name: googleUser.name,
                    email: googleUser.email,
                    password: hashedPassword,
                    googleId: googleUser.sub,
                });
            }
        }

        if (!user.active) throw new UnauthorizedError("Conta desativada");

        // 2FA for Google users too
        if (user.twoFactorEnabled) {
            const tempToken = await trigger2fa(user.id, user.email, user.name);
            return { requires2fa: true, tempToken };
        }

        const tokens = await issueTokens(user.id, user.role);
        const userResponse = await buildUserResponse(user.id);
        return { requires2fa: false, user: userResponse, ...tokens };
    },

    async appleLogin(input: AppleLoginInput) {
        // Decode identityToken (header.payload.signature)
        const decoded = jwt.decode(input.identityToken) as any;
        if (!decoded || !decoded.sub || !decoded.email) {
            throw new UnauthorizedError("Identity Token da Apple inválido ou sem e-mail");
        }

        const appleId = decoded.sub; // The unique user ID from Apple
        const email = decoded.email;

        // Verify if user exists by appleId first
        let user = await authRepository.findUserByAppleId(appleId);

        if (!user) {
            // Check if user exists by email to link account
            user = await authRepository.findUserByEmail(email);
            if (user) {
                await authRepository.linkAppleAccount(user.id, appleId);
            } else {
                // Create new user
                const hashedPassword = await hashPassword(uuidv4());
                user = await authRepository.createUser({
                    name: input.fullName || "Usuário da Apple",
                    email: email,
                    password: hashedPassword,
                    appleId: appleId,
                });
            }
        }

        if (!user.active) throw new UnauthorizedError("Conta desativada");

        if (user.twoFactorEnabled) {
            const tempToken = await trigger2fa(user.id, user.email, user.name);
            return { requires2fa: true, tempToken };
        }

        const tokens = await issueTokens(user.id, user.role);
        const userResponse = await buildUserResponse(user.id);
        return { requires2fa: false, user: userResponse, ...tokens };
    },

    async refresh(refreshTokenValue: string) {
        const storedToken = await authRepository.findRefreshToken(refreshTokenValue);
        if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
            throw new UnauthorizedError("Refresh token inválido ou expirado");
        }

        await authRepository.revokeRefreshToken(refreshTokenValue);

        const user = await authRepository.findUserById(storedToken.userId);
        if (!user || !user.active) throw new UnauthorizedError("Usuário não encontrado ou desativado");

        const tokens = await issueTokens(user.id, user.role);
        return tokens;
    },

    async logout(refreshTokenValue: string) {
        const storedToken = await authRepository.findRefreshToken(refreshTokenValue);
        if (storedToken) {
            await authRepository.revokeRefreshToken(refreshTokenValue);
        }
    },

    async forgotPassword(input: ForgotPasswordInput) {
        const user = await authRepository.findUserByEmail(input.email);

        // For security, always return success even if user not found
        if (!user || !user.active) {
            return { message: "Se o e-mail existir, enviaremos um link de recuperação." };
        }

        // Generate a password_reset code and a reset token
        const code = generate2faCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 min

        await authRepository.createVerificationCode({
            userId: user.id,
            code,
            type: "password_reset",
            expiresAt,
        });

        // Sign a temp token with the code embedded (so the reset link is self-contained)
        const resetToken = signAccessToken(
            { userId: user.id, purpose: "password_reset", code },
            "30m"
        );

        // Send email (async — don't block response)
        sendPasswordResetEmail(user.email, resetToken, user.name).catch((err) => {
            logger.error({ err }, "Failed to send password reset email");
        });

        return { message: "Se o e-mail existir, enviaremos um link de recuperação." };
    },

    async resetPassword(input: ResetPasswordInput) {
        // Verify the reset token
        let payload: any;
        try {
            payload = verifyAccessToken(input.token);
            if (payload?.purpose !== "password_reset" || !payload?.userId || !payload?.code) {
                throw new Error("Invalid token");
            }
        } catch {
            throw new UnauthorizedError("Token de redefinição inválido ou expirado");
        }

        const { userId, code } = payload;

        // Validate the code in DB
        const storedCode = await authRepository.findValidCode(userId, code, "password_reset");
        if (!storedCode) {
            throw new UnauthorizedError("Token de redefinição inválido ou expirado");
        }

        // Mark code as used
        await authRepository.markCodeUsed(storedCode.id);

        // Hash new password and update
        const hashedPassword = await hashPassword(input.newPassword);
        await authRepository.updateUserPassword(userId, hashedPassword);

        // Revoke all refresh tokens to force re-login everywhere
        await authRepository.revokeAllUserTokens(userId);

        return { message: "Senha redefinida com sucesso" };
    },
};

// ═══════════════════════════════════════
// GOOGLE TOKEN VALIDATION
// ═══════════════════════════════════════

interface GoogleUserInfo {
    sub: string;       // Google user ID
    email: string;
    name: string;
    picture?: string;
    email_verified?: boolean;
}

async function validateGoogleToken(credential: string): Promise<GoogleUserInfo | null> {
    try {
        // Validate the ID token via Google's tokeninfo endpoint
        const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
        );

        if (!response.ok) {
            logger.warn({ status: response.status }, "Google token validation failed");
            return null;
        }

        const payload = (await response.json()) as any;

        // Verify audience matches our client ID
        const clientId = env.GOOGLE_AUTH_CLIENT_ID;
        if (clientId && payload.aud !== clientId) {
            logger.warn("Google token audience mismatch");
            return null;
        }

        if (!payload.email || !payload.sub) {
            logger.warn("Google token missing email or sub");
            return null;
        }

        return {
            sub: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split("@")[0],
            picture: payload.picture,
            email_verified: payload.email_verified === "true",
        };
    } catch (err) {
        logger.error({ err }, "Error validating Google token");
        return null;
    }
}
