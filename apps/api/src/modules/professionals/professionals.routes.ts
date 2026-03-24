import { Router } from "express";
import { professionalsController } from "./professionals.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", professionalsController.list);
router.get("/active-roles", professionalsController.activeRoles);
router.post("/", professionalsController.create);
router.patch("/:id", professionalsController.update);
router.delete("/:id", professionalsController.delete);

export const professionalsRoutes: Router = router;
