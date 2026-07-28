import { prisma } from "../../config/database.js";
import type { User, RefreshToken, VerificationCode } from "@prisma/client";

export const authRepository = {
    // ═══ USER ═══
    async findUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    },

    async findUserById(id: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { id } });
    },

    async findUserByGoogleId(googleId: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { googleId } });
    },

    async findUserByAppleId(appleId: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { appleId } });
    },

    async createUser(data: {
        name: string;
        email: string;
        password: string;
        googleId?: string;
        appleId?: string;
    }): Promise<User> {
        return prisma.user.create({ data });
    },

    async updateUserPassword(userId: string, hashedPassword: string): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    },

    async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { googleId },
        });
    },

    async linkAppleAccount(userId: string, appleId: string): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { appleId },
        });
    },

    // ═══ PERMISSIONS ═══
    async findPermissionsByUserId(userId: string) {
        return prisma.permission.findMany({
            where: { userId },
            select: { module: true, action: true, dataScope: true },
        });
    },

    // ═══ REFRESH TOKENS ═══
    async createRefreshToken(data: {
        token: string;
        userId: string;
        expiresAt: Date;
    }): Promise<RefreshToken> {
        return prisma.refreshToken.create({ data });
    },

    async findRefreshToken(token: string): Promise<RefreshToken | null> {
        return prisma.refreshToken.findUnique({ where: { token } });
    },

    async revokeRefreshToken(token: string): Promise<void> {
        await prisma.refreshToken.update({
            where: { token },
            data: { revoked: true },
        });
    },

    async revokeAllUserTokens(userId: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { userId, revoked: false },
            data: { revoked: true },
        });
    },

    async deleteExpiredTokens(): Promise<void> {
        await prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
    },

    // ═══ VERIFICATION CODES (2FA) ═══
    async createVerificationCode(data: {
        userId: string;
        code: string;
        type: string;
        expiresAt: Date;
    }): Promise<VerificationCode> {
        // Invalidate old unused codes of same type
        await prisma.verificationCode.updateMany({
            where: { userId: data.userId, type: data.type, used: false },
            data: { used: true },
        });
        return prisma.verificationCode.create({ data });
    },

    async findValidCode(userId: string, code: string, type: string): Promise<VerificationCode | null> {
        return prisma.verificationCode.findFirst({
            where: {
                userId,
                code,
                type,
                used: false,
                expiresAt: { gt: new Date() },
            },
        });
    },

    async markCodeUsed(id: string): Promise<void> {
        await prisma.verificationCode.update({
            where: { id },
            data: { used: true },
        });
    },
};
