import { Router } from "express";
import { companyBranchesController } from "./company-branches.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { companyBranchSchema } from "./company-branches.schemas.js";

const router: Router = Router();
const requireAdmin = requireRole("OWNER", "ADMIN");

router.use(authMiddleware);

router.get("/", requireAdmin, companyBranchesController.list);
router.get("/:id", requireAdmin, companyBranchesController.getById);
router.post("/", requireAdmin, validate({ body: companyBranchSchema }), companyBranchesController.create);
router.put("/:id", requireAdmin, validate({ body: companyBranchSchema }), companyBranchesController.update);
router.delete("/:id", requireAdmin, companyBranchesController.delete);

export const companyBranchesRoutes = router;
