import { Router } from "express";
import { lossReasonsController } from "./loss-reasons.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createCategorySchema,
    updateCategorySchema,
    categoryParamsSchema,
    createReasonSchema,
    updateReasonSchema,
    reasonParamsSchema,
} from "./loss-reasons.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

// ═══ Categories ═══
router.get("/categories", lossReasonsController.listCategories);

router.post(
    "/categories",
    validate({ body: createCategorySchema }),
    lossReasonsController.createCategory
);

router.put(
    "/categories/:id",
    validate({ params: categoryParamsSchema, body: updateCategorySchema }),
    lossReasonsController.updateCategory
);

router.delete(
    "/categories/:id",
    validate({ params: categoryParamsSchema }),
    lossReasonsController.deleteCategory
);

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
