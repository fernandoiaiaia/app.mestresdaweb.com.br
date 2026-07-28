import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const rateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    // Default bumped to 10000 req/window to prevent false positives from dashboards.
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Never rate-limit health-check probes
        return req.path === "/health" || req.path === "/";
    },
    message: {
        success: false,
        error: {
            code: "RATE_LIMITED",
            message: "Muitas requisições. Tente novamente em alguns minutos.",
        },
    },
});
