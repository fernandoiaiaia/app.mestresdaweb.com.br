import { Router } from "express";
import { paymentController } from "./payment.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createPaymentConditionSchema, updatePaymentConditionSchema, idParamSchema } from "./payment.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

const requireView = requirePermission("settings.payment-conditions", "view");
const requireManage = requirePermission("settings.payment-conditions", "manage");

router.get("/", requireView, paymentController.list);
router.post("/",
    requireManage, validate({ body: createPaymentConditionSchema }), paymentController.create);
router.put("/:id",
    requireManage, validate({ params: idParamSchema, body: updatePaymentConditionSchema }), paymentController.update);
router.patch("/:id/toggle",
    requireManage, validate({ params: idParamSchema }), paymentController.toggleActive);
router.post("/:id/duplicate",
    requireManage, validate({ params: idParamSchema }), paymentController.duplicate);
router.delete("/:id",
    requireManage, validate({ params: idParamSchema }), paymentController.delete);

export const paymentRoutes = router;
