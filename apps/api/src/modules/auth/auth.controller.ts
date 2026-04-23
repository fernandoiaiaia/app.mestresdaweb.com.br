import { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { authRepository } from "./auth.repository.js";
import { securityService } from "../security/security.service.js";

function extractDevice(ua: string | undefined): string {
    if (!ua) return "Desconhecido";
    const parts: string[] = [];
    // Browser
    if (ua.includes("Chrome") && !ua.includes("Edg")) parts.push("Chrome");
    else if (ua.includes("Edg")) parts.push("Edge");
    else if (ua.includes("Firefox")) parts.push("Firefox");
    else if (ua.includes("Safari") && !ua.includes("Chrome")) parts.push("Safari");
    else parts.push("Navegador");
    // OS
    if (ua.includes("Mac OS") || ua.includes("Macintosh")) parts.push("MacOS");
    else if (ua.includes("Windows")) parts.push("Windows");
    else if (ua.includes("Linux")) parts.push("Linux");
    else if (ua.includes("iPhone") || ua.includes("iPad")) parts.push("iOS");
    else if (ua.includes("Android")) parts.push("Android");
    return parts.join(" / ");
}

function extractBrowser(ua: string | undefined): string {
    if (!ua) return "Desconhecido";
    if (ua.includes("Chrome") && !ua.includes("Edg")) {
        const m = ua.match(/Chrome\/(\d+)/);
        return m ? `Chrome ${m[1]}` : "Chrome";
    }
    if (ua.includes("Edg")) {
        const m = ua.match(/Edg\/(\d+)/);
        return m ? `Edge ${m[1]}` : "Edge";
    }
    if (ua.includes("Firefox")) {
        const m = ua.match(/Firefox\/(\d+)/);
        return m ? `Firefox ${m[1]}` : "Firefox";
    }
    if (ua.includes("Safari") && !ua.includes("Chrome")) {
        const m = ua.match(/Version\/(\d+)/);
        return m ? `Safari ${m[1]}` : "Safari";
    }
    return "Navegador";
}

function extractIp(req: Request): string {
    return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "0.0.0.0";
}

async function register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
}

async function login(req: Request, res: Response): Promise<void> {
    const ua = req.headers["user-agent"];
    const ip = extractIp(req);
    const device = extractDevice(ua);

    try {
        const result = await authService.login(req.body);

        if (result.requires2fa) {
            // Don't log yet — will log after 2FA verification
            res.status(200).json({ success: true, data: result });
            return;
        }

        // Login successful — create session + log
        const user = await authRepository.findUserByEmail(req.body.email);
        if (user) {
            const session = await securityService.createSession(user.id, {
                device: extractDevice(ua),
                browser: extractBrowser(ua),
                ip,
            });
            await securityService.logLogin(user.id, ip, device, "success");
            res.status(200).json({ success: true, data: { ...result, sessionId: session.id } });
            return;
        }

        res.status(200).json({ success: true, data: result });
    } catch (err: any) {
        // Login failed — try to log the attempt
        try {
            const user = await authRepository.findUserByEmail(req.body.email);
            if (user) {
                await securityService.logLogin(user.id, ip, device, "failed");
            }
        } catch (_) { /* ignore logging errors */ }
        throw err;
    }
}

async function verify2fa(req: Request, res: Response): Promise<void> {
    const ua = req.headers["user-agent"];
    const ip = extractIp(req);
    const device = extractDevice(ua);

    const result = await authService.verify2fa(req.body);

    // After 2FA verification, create session + log
    try {
        const r = result as any;
        if (r.user) {
            const session = await securityService.createSession(r.user.id, {
                device: extractDevice(ua),
                browser: extractBrowser(ua),
                ip,
            });
            await securityService.logLogin(r.user.id, ip, device, "success");
            res.status(200).json({ success: true, data: { ...result, sessionId: session.id } });
            return;
        }
    } catch (_) { /* ignore session errors */ }

    res.status(200).json({ success: true, data: result });
}

async function googleLogin(req: Request, res: Response): Promise<void> {
    const ua = req.headers["user-agent"];
    const ip = extractIp(req);
    const device = extractDevice(ua);

    const result = await authService.googleLogin(req.body);

    // Google login successful — create session + log
    try {
        const r = result as any;
        if (r.user) {
            const session = await securityService.createSession(r.user.id, {
                device: extractDevice(ua),
                browser: extractBrowser(ua),
                ip,
            });
            await securityService.logLogin(r.user.id, ip, device, "success");
            res.status(200).json({ success: true, data: { ...result, sessionId: session.id } });
            return;
        }
    } catch (_) { /* ignore session errors */ }

    res.status(200).json({ success: true, data: result });
}

async function appleLogin(req: Request, res: Response): Promise<void> {
    const ua = req.headers["user-agent"];
    const ip = extractIp(req);
    const device = extractDevice(ua);

    const result = await authService.appleLogin(req.body);

    try {
        const r = result as any;
        if (r.user) {
            const session = await securityService.createSession(r.user.id, {
                device: extractDevice(ua),
                browser: extractBrowser(ua),
                ip,
            });
            await securityService.logLogin(r.user.id, ip, device, "success");
            res.status(200).json({ success: true, data: { ...result, sessionId: session.id } });
            return;
        }
    } catch (_) { /* ignore errors */ }

    res.status(200).json({ success: true, data: result });
}

async function refresh(req: Request, res: Response): Promise<void> {
    const result = await authService.refresh(req.body.refreshToken);
    res.status(200).json({ success: true, data: result });
}

async function logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req.body.refreshToken);

    // Also revoke session if sessionId header present
    const sessionId = req.headers["x-session-id"] as string | undefined;
    if (sessionId) {
        try {
            const { prisma } = await import("../../config/database.js");
            await prisma.session.delete({ where: { id: sessionId } }).catch(() => null);
        } catch (_) { /* ignore */ }
    }

    res.status(200).json({ success: true, message: "Logout realizado" });
}

async function forgotPassword(req: Request, res: Response): Promise<void> {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json({ success: true, data: result });
}

async function resetPassword(req: Request, res: Response): Promise<void> {
    const result = await authService.resetPassword(req.body);
    res.status(200).json({ success: true, data: result });
}

async function me(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id || (req as any).user?.userId || (req as any).userId;
    if (!userId) {
        res.status(401).json({ success: false, message: "Não autenticado" });
        return;
    }
    const user = await authRepository.findUserById(userId);
    if (!user) {
        res.status(404).json({ success: false, message: "Usuário não encontrado" });
        return;
    }
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

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: phoneNum,
                company: companyName,
                allowedApps: (user as any).allowedApps ?? [],
                permissions,
            },
        },
    });
}

export const authController = {
    register,
    login,
    googleLogin,
    appleLogin,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    verify2fa,
    me,
};
