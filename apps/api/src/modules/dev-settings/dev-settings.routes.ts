import { Router } from "express";
import { devSettingsController } from "./dev-settings.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Project Settings Routes
// ═══════════════════════════════════════

const router: Router = Router();

router.use(authMiddleware);

router.get("/", devSettingsController.get);
router.put("/", devSettingsController.upsert);

export const devSettingsRoutes = router;
