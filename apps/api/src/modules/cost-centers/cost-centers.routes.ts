import { Router } from "express";
import { costCentersController } from "./cost-centers.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/", costCentersController.list);
router.get("/:id", costCentersController.getById);
router.post("/", costCentersController.create);
router.put("/:id", costCentersController.update);
router.delete("/:id", costCentersController.delete);

export const costCentersRoutes = router;
