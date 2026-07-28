import { Router } from "express";
import { reportsController } from "./reports.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";

const router = Router();
const requireAdmin = requireRole("OWNER", "ADMIN");

router.use(authMiddleware);

router.get("/dre", requireAdmin, reportsController.getDRE);
router.get("/cash-flow", requireAdmin, reportsController.getCashFlow);
router.get("/profitability", requireAdmin, reportsController.getProfitability);
router.get("/sales-funnel", requireAdmin, reportsController.getSalesFunnel);
router.get("/consultant-performance", requireAdmin, reportsController.getConsultantPerformance);
router.get("/acquisition-roi", requireAdmin, reportsController.getAcquisitionROI);
router.get("/project-profitability", requireAdmin, reportsController.getProjectProfitability);
router.get("/project-velocity", requireAdmin, reportsController.getProjectVelocity);
router.get("/contracts-mrr", requireAdmin, reportsController.getContractsMRR);
router.get("/contracts-aging", requireAdmin, reportsController.getContractsAging);
router.get("/support-chatbot", requireAdmin, reportsController.getChatbotMetrics);
router.get("/support-volume", requireAdmin, reportsController.getSupportVolume);
router.get("/executive-summary", requireAdmin, reportsController.getExecutiveSummary);

export const reportsRoutes: Router = router;
