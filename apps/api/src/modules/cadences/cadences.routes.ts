import { Router } from "express";
import { cadencesController } from "./cadences.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createCadenceSchema,
    updateCadenceSchema,
    updateCadenceStatusSchema,
    addStepSchema,
    cadenceParamsSchema,
    stepParamsSchema
} from "./cadences.schemas.js";

const router: Router = Router();

// Requer autenticação
router.use(authMiddleware);

// ═══ Cadences Routes ═══
router.get("/", cadencesController.list);

router.post(
    "/",
    validate({ body: createCadenceSchema }),
    cadencesController.create
);

router.put(
    "/:id",
    validate({ params: cadenceParamsSchema, body: updateCadenceSchema }),
    cadencesController.update
);

router.put(
    "/:id/status",
    validate({ params: cadenceParamsSchema, body: updateCadenceStatusSchema }),
    cadencesController.updateStatus
);

router.delete(
    "/:id",
    validate({ params: cadenceParamsSchema }),
    cadencesController.delete
);

// ═══ Cadence Steps Routes ═══
router.post(
    "/:id/steps",
    validate({ params: cadenceParamsSchema, body: addStepSchema }),
    cadencesController.addStep
);

router.delete(
    "/:id/steps/:stepId",
    validate({ params: stepParamsSchema }),
    cadencesController.deleteStep
);

export const cadencesRoutes = router;
