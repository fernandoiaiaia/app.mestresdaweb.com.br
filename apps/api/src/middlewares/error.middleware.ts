import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

export function errorMiddleware(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Operational errors (expected)
    if (err instanceof ValidationError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                errors: err.errors,
            },
        });
        return;
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
        return;
    }

    // Unexpected errors
    logger.error({ err, path: req.path, method: req.method }, "Unhandled error");

    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message:
                env.NODE_ENV === "production"
                    ? "Erro interno do servidor"
                    : err.message,
            ...(env.NODE_ENV !== "production" && { stack: err.stack }),
        },
    });
}
