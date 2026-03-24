import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { cadenceEngine } from "./modules/sdr/cadence-engine.service.js";
import { schedulingService } from "./modules/sdr/scheduling.service.js";
import { voiceService } from "./modules/sdr/voice.service.js";

async function bootstrap() {
    // Connect to services
    await connectDatabase();
    logger.info("✅ PostgreSQL connected");

    try {
        await connectRedis();
    } catch (err) {
        logger.warn("⚠️  Redis not available — running without cache");
    }

    // ═══ SDR Cron Jobs ═══
    try {
        const cron = await import("node-cron");

        // Motor da cadência — a cada 5 minutos
        cron.default.schedule(env.SDR_CRON_INTERVAL, async () => {
            try {
                await cadenceEngine.processQueue();
            } catch (err) {
                logger.error({ err }, "Cadence engine cron error");
            }
        });
        logger.info(`🤖 SDR Cadence Engine — cron: ${env.SDR_CRON_INTERVAL}`);

        // Lembretes de reunião — a cada hora
        cron.default.schedule("0 * * * *", async () => {
            try {
                await schedulingService.sendReminders();
            } catch (err) {
                logger.error({ err }, "Reminders cron error");
            }
        });
        logger.info("📅 Meeting Reminders — cron: 0 * * * *");

        // Cleanup de gravações — meia-noite
        cron.default.schedule("0 0 * * *", async () => {
            try {
                await voiceService.cleanupExpiredRecordings(90);
            } catch (err) {
                logger.error({ err }, "Cleanup cron error");
            }
        });
        logger.info("🧹 Recording Cleanup — cron: 0 0 * * *");

        // Sales Cadence Engine — a cada 5 minutos
        const { salesCadenceService } = await import("./modules/sales-cadence/sales-cadence.service.js");
        cron.default.schedule("*/5 * * * *", async () => {
            try {
                await salesCadenceService.processPendingExecutions();
            } catch (err) {
                logger.error({ err }, "Sales cadence cron error");
            }
        });
        logger.info("📬 Sales Cadence Engine — cron: */5 * * * *");
    } catch {
        logger.warn("⚠️  node-cron not installed — SDR crons disabled. Run: npm install node-cron");
    }

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
        logger.info(`🚀 API running on http://localhost:${env.PORT}`);
        logger.info(`📊 Health: http://localhost:${env.PORT}/health`);
        logger.info(`🔐 Auth: http://localhost:${env.PORT}/api/auth`);
        logger.info(`👤 Users: http://localhost:${env.PORT}/api/users`);
        logger.info(`🤖 SDR: http://localhost:${env.PORT}/api/sdr`);
        logger.info(`⚙️  Environment: ${env.NODE_ENV}`);
    });

    // Aumentar timeout do servidor para 360s (geração de escopo Opus 4.6 pode levar até 5 minutos)
    server.timeout = 360_000;
    server.requestTimeout = 360_000;

    // ═══ Graceful Shutdown ═══
    const shutdown = async (signal: string) => {
        logger.info(`\n${signal} received — shutting down gracefully...`);

        server.close(async () => {
            logger.info("🔌 HTTP server closed");
            await disconnectDatabase();
            logger.info("🔌 PostgreSQL disconnected");
            try {
                await disconnectRedis();
                logger.info("🔌 Redis disconnected");
            } catch {
                // Redis might not be connected
            }
            logger.info("👋 Goodbye!");
            process.exit(0);
        });

        // Force exit after 10s
        setTimeout(() => {
            logger.error("⚠️  Forced shutdown after timeout");
            process.exit(1);
        }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
    logger.fatal({ err }, "❌ Failed to start server");
    process.exit(1);
});
