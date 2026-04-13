import { Router } from "express";
import { lossReasonsController } from "./loss-reasons.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createReasonSchema,
    updateReasonSchema,
    reasonParamsSchema,
} from "./loss-reasons.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

// ═══ Reasons ═══
router.get("/", lossReasonsController.listReasons);

router.post(
    "/",
    validate({ body: createReasonSchema }),
    lossReasonsController.createReason
);

router.put(
    "/:id",
    validate({ params: reasonParamsSchema, body: updateReasonSchema }),
    lossReasonsController.updateReason
);

router.delete(
    "/:id",
    validate({ params: reasonParamsSchema }),
    lossReasonsController.deleteReason
);

export const lossReasonsRoutes = router;
