import { Router } from "express";
import { paymentController } from "./payment.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createPaymentConditionSchema, updatePaymentConditionSchema, idParamSchema } from "./payment.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/", paymentController.list);
router.post("/", validate({ body: createPaymentConditionSchema }), paymentController.create);
router.put("/:id", validate({ params: idParamSchema, body: updatePaymentConditionSchema }), paymentController.update);
router.patch("/:id/toggle", validate({ params: idParamSchema }), paymentController.toggleActive);
router.post("/:id/duplicate", validate({ params: idParamSchema }), paymentController.duplicate);
router.delete("/:id", validate({ params: idParamSchema }), paymentController.delete);

export const paymentRoutes = router;
