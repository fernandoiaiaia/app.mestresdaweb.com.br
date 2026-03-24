import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const rateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: "RATE_LIMITED",
            message: "Muitas requisições. Tente novamente em alguns minutos.",
        },
    },
});
