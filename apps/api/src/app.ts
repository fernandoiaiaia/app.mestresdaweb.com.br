// Express 5 handles async errors natively — no need for express-async-errors
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import path from "path";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { rateLimiter } from "./middlewares/rateLimiter.middleware.js";
import { requestIdMiddleware } from "./middlewares/requestId.middleware.js";

// Routes
import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { clientsRoutes } from "./modules/clients/clients.routes.js";
import { funnelsRoutes } from "./modules/funnels/funnels.routes.js";
import { cadencesRoutes } from "./modules/cadences/cadences.routes.js";
import { dealsRoutes } from "./modules/deals/deals.routes.js";
import { tasksRoutes } from "./modules/tasks/tasks.routes.js";
import { companiesRoutes } from "./modules/companies/companies.routes.js";
import { sdrRoutes } from "./modules/sdr/sdr.routes.js";
import { webhooksRoutes } from "./modules/sdr/webhooks.routes.js";
import { integrationsRoutes } from "./modules/integrations/integrations.routes.js";
import { salesCadenceRoutes } from "./modules/sales-cadence/sales-cadence.routes.js";
import { professionalsRoutes } from "./modules/professionals/professionals.routes.js";
import { lossReasonsRoutes } from "./modules/loss-reasons/loss-reasons.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { sourcesRoutes } from "./modules/sources/sources.routes.js";
import { segmentsRoutes } from "./modules/segments/segments.routes.js";
import { objectionsRoutes } from "./modules/objections/objections.routes.js";
import { institutionalRoutes } from "./modules/institutional/institutional.routes.js";
import { paymentRoutes } from "./modules/payment/payment.routes.js";
import { checklistRoutes } from "./modules/checklist/checklist.routes.js";
import { securityRoutes } from "./modules/security/security.routes.js";
import { notificationsSettingsRoutes } from "./modules/notifications/notifications.routes.js";

import { backupRoutes } from "./modules/backup/backup.routes.js";
import { domainRoutes } from "./modules/domain/domain.routes.js";
import { activityRoutes } from "./modules/activity/activity.routes.js";
import { devProjectsRoutes } from "./modules/dev-projects/dev-projects.routes.js";
import devDocumentsRoutes from "./modules/dev-documents/dev-documents.routes.js";
import devSprintsRoutes from "./modules/dev-sprints/dev-sprints.routes.js";
import devReportsRoutes from "./modules/dev-reports/dev-reports.routes.js";
import { devSettingsRoutes } from "./modules/dev-settings/dev-settings.routes.js";
import { leadsRoutes } from "./modules/leads/leads.routes.js";
import { proposalsRoutes } from "./modules/proposals/proposals.routes.js";




const app: ReturnType<typeof express> = express();

// ═══ Global Middlewares ═══
app.use(helmet());
app.use(
    cors({
        origin: env.CORS_ORIGIN.split(","),
        credentials: true,
    })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(
    pinoHttp({
        logger,
        customLogLevel(_req, res) {
            if (res.statusCode >= 500) return "error";
            if (res.statusCode >= 400) return "warn";
            return "info";
        },
        customSuccessMessage(_req, res) {
            return `${res.statusCode}`;
        },
    })
);
app.use(rateLimiter);

// ═══ Static Files (uploads) — allow cross-origin loading for media elements ═══
app.use("/uploads", (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(path.resolve(process.cwd(), "storage", "uploads")));

// ═══ Routes ═══
app.use("/", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/funnels", funnelsRoutes);
app.use("/api/cadences", cadencesRoutes);
app.use("/api/deals", dealsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/sdr", sdrRoutes);
app.use("/api/webhooks", webhooksRoutes);
integrationsRoutes(app);
app.use("/api/sales-cadences", salesCadenceRoutes);
app.use("/api/professionals", professionalsRoutes);
app.use("/api/loss-reasons", lossReasonsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/sources", sourcesRoutes);
app.use("/api/segments", segmentsRoutes);
app.use("/api/objections", objectionsRoutes);
app.use("/api/institutional", institutionalRoutes);
app.use("/api/payment-conditions", paymentRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/notifications", notificationsSettingsRoutes);

app.use("/api/backup", backupRoutes);
app.use("/api/domain", domainRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/dev-projects", devProjectsRoutes);
app.use("/api/dev-documents", devDocumentsRoutes);
app.use("/api/dev-sprints", devSprintsRoutes);
app.use("/api/dev-reports", devReportsRoutes);
app.use("/api/dev-settings", devSettingsRoutes);
app.use("/api/leads", leadsRoutes);
proposalsRoutes(app as any);



// ═══ 404 ═══
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Rota não encontrada" },
    });
});

// ═══ Error Handler (must be last) ═══
app.use(errorMiddleware);

export { app };  
