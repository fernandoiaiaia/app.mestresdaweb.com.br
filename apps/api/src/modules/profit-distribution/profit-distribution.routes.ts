import { Router } from "express";
import { profitDistributionController } from "./profit-distribution.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { executeDistributionSchema } from "./profit-distribution.schemas.js";

const router: Router = Router();
const requireAdmin = requireRole("OWNER", "ADMIN");

router.use(authMiddleware);

router.get("/", requireAdmin, profitDistributionController.list);
router.get("/simulate", requireAdmin, profitDistributionController.simulate);
router.post("/", requireAdmin, validate({ body: executeDistributionSchema }), profitDistributionController.execute);

export const profitDistributionRoutes = router;
