import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

interface TokenPayload {
    userId: string;
    [key: string]: unknown;
}

export function signAccessToken(payload: TokenPayload, customExpiry?: string): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: (customExpiry || env.JWT_ACCESS_EXPIRES_IN) as SignOptions["expiresIn"],
    });
}

export function signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    });
}

export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
