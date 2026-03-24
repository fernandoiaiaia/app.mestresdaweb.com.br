import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    lazyConnect: true,
});

redis.on("connect", () => {
    logger.info("✅ Redis connected");
});

redis.on("error", (err) => {
    logger.error({ err }, "❌ Redis connection error");
});

export async function connectRedis(): Promise<void> {
    await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
    await redis.quit();
}
