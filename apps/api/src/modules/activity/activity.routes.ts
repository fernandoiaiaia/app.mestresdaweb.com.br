import { Router } from "express";
import { activityController } from "./activity.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();
router.use(authMiddleware);

router.get("/logs", activityController.listLogs);
router.get("/stats", activityController.getStats);
router.get("/users", activityController.getUsers);
router.get("/export", activityController.exportLogs);
router.post("/seed", activityController.seedLogs);

export const activityRoutes = router;
