import { Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { redis } from "../../config/redis.js";

async function check(_req: Request, res: Response): Promise<void> {
    const checks: Record<string, string> = {};

    // Database check
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = "ok";
    } catch {
        checks.database = "error";
    }

    // Redis check
    try {
        await redis.ping();
        checks.redis = "ok";
    } catch {
        checks.redis = "error";
    }

    const allOk = Object.values(checks).every((v) => v === "ok");

    res.status(allOk ? 200 : 503).json({
        status: allOk ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks,
    });
}

export const healthController = { check };
