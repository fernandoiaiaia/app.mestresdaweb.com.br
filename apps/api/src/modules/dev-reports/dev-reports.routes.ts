import { Router } from "express";
import { devReportsController } from "./dev-reports.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Reports Routes
// ═══════════════════════════════════════

const router: Router = Router();

router.use(authMiddleware);

router.get("/team", devReportsController.teamReport);

export default router;
