import { Router } from "express";
import { professionalsController } from "./professionals.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

const requireView = requirePermission("settings.professionals", "view");
const requireManage = requirePermission("settings.professionals", "manage");

router.get("/", requireView, professionalsController.list);
router.get("/active-roles", requireView, professionalsController.activeRoles);
router.post("/", requireManage, professionalsController.create);
router.patch("/:id", requireManage, professionalsController.update);
router.delete("/:id", requireManage, professionalsController.delete);

export const professionalsRoutes: Router = router;
