import { Router } from "express";
import { devSprintsController } from "./dev-sprints.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Sprints Routes
// ═══════════════════════════════════════

const router: Router = Router();

router.use(authMiddleware);

// ── Project-scoped routes ──
router.get("/project/:projectId", devSprintsController.listByProject);
router.post("/project/:projectId", devSprintsController.create);

// ── Sprint-specific routes ──
router.patch("/:id", devSprintsController.update);
router.delete("/:id", devSprintsController.delete);

export default router;
