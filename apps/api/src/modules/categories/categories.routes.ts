import { Router } from "express";
import { categoriesController } from "./categories.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/", categoriesController.list);
router.get("/:id", categoriesController.getById);
router.post("/", categoriesController.create);
router.put("/:id", categoriesController.update);
router.delete("/:id", categoriesController.delete);

export { router as categoriesRoutes };
