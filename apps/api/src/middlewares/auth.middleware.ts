import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { UnauthorizedError, ForbiddenError } from "../lib/errors.js";
import { prisma } from "../config/database.js";

function parseCookies(cookieHeader?: string): Record<string, string> {
    if (!cookieHeader) return {};
    return cookieHeader.split(';').reduce((res, c) => {
        const parts = c.split('=');
        const key = parts[0]?.trim();
        const val = parts.slice(1).join('=').trim();
        if (!key) return res;
        res[key] = decodeURIComponent(val);
        return res;
    }, {} as Record<string, string>);
}

export function authMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    let token = "";
    const header = req.headers.authorization;

    if (header && header.startsWith("Bearer ")) {
        token = header.slice(7);
    } else if (req.query.token && typeof req.query.token === "string" && req.path.includes("/sse")) {
        // Permitido apenas para Server-Sent Events (SSE) que não suportam Headers HTTP
        token = req.query.token;
    }

    // Tentar ler dos cookies caso não tenha vindo no Header/URL
    if (!token) {
        const cookies = parseCookies(req.headers.cookie);
        if (cookies.accessToken) {
            token = cookies.accessToken;
        }
    }

    if (!token) {
        throw new UnauthorizedError("Token não fornecido");
    }

    try {
        const payload = verifyAccessToken(token);
        req.user = { userId: payload.userId, role: (payload as any).role || "USER" };
        next();
    } catch {
        throw new UnauthorizedError("Token inválido ou expirado");
    }
}

export function requireRole(...roles: string[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new UnauthorizedError("Não autenticado");
        }

        if (!roles.includes(req.user.role)) {
            throw new ForbiddenError("Permissão insuficiente");
        }

        next();
    };
}

/**
 * Check if a user has a specific permission.
 * OWNER and ADMIN always pass.
 */
export async function userHasPermission(
    userId: string,
    role: string,
    module: string,
    action: string
): Promise<boolean> {
    if (role === "OWNER" || role === "ADMIN") return true;

    const permission = await prisma.permission.findFirst({
        where: { userId, module, action },
    });

    return !!permission;
}

/**
 * Middleware factory: require a granular permission.
 * Super-admins (OWNER/ADMIN) bypass.
 */
export function requirePermission(module: string, action: string) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            throw new UnauthorizedError("Não autenticado");
        }

        const has = await userHasPermission(req.user.userId, req.user.role, module, action);
        if (!has) {
            throw new ForbiddenError("Permissão insuficiente");
        }

        next();
    };
}

/**
 * Middleware factory: require any of the listed granular permissions.
 */
export function requireAnyPermission(...permissions: Array<{ module: string; action: string }>) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            throw new UnauthorizedError("Não autenticado");
        }

        if (req.user.role === "OWNER" || req.user.role === "ADMIN") {
            return next();
        }

        const hasAny = await prisma.permission.findFirst({
            where: {
                userId: req.user.userId,
                OR: permissions.map((p) => ({ module: p.module, action: p.action })),
            },
        });

        if (!hasAny) {
            throw new ForbiddenError("Permissão insuficiente");
        }

        next();
    };
}
