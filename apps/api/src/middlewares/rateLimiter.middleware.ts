import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const rateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    // Default bumped to 500 req/window (was 100) — dashboards fire many parallel
    // requests on load; 100 was too aggressive for internal use.
    max: env.RATE_LIMIT_MAX,
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
