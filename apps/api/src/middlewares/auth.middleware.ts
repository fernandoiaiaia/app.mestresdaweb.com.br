import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { UnauthorizedError, ForbiddenError } from "../lib/errors.js";

export function authMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        throw new UnauthorizedError("Token não fornecido");
    }

    const token = header.slice(7);

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
