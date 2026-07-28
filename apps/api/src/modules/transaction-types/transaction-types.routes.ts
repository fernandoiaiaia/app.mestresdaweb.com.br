import { Router } from "express";
import { transactionTypesController } from "./transaction-types.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/", transactionTypesController.list);
router.get("/:id", transactionTypesController.getById);
router.post("/", transactionTypesController.create);
router.put("/:id", transactionTypesController.update);
router.delete("/:id", transactionTypesController.delete);

export { router as transactionTypesRoutes };
