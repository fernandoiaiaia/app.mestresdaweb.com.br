import { Router } from "express";
import { paymentMethodsController } from "./payment-methods.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/", paymentMethodsController.list);
router.get("/:id", paymentMethodsController.getById);
router.post("/", paymentMethodsController.create);
router.put("/:id", paymentMethodsController.update);
router.delete("/:id", paymentMethodsController.delete);

export { router as paymentMethodsRoutes };
