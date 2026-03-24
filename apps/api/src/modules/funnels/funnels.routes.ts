import { Router } from "express";
import { funnelsController } from "./funnels.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createFunnelSchema,
    updateFunnelSchema,
    addStageSchema,
    updateStageSchema,
    reorderStagesSchema,
    reorderFunnelsSchema,
    funnelParamsSchema,
    stageParamsSchema
} from "./funnels.schemas.js";

const router: Router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// ═══ Rotas de Funil ═══
router.get("/", funnelsController.list);

router.post(
    "/",
    validate({ body: createFunnelSchema }),
    funnelsController.create
);

router.put(
    "/reorder",
    validate({ body: reorderFunnelsSchema }),
    funnelsController.reorderFunnels
);

router.put(
    "/:id",
    validate({ params: funnelParamsSchema, body: updateFunnelSchema }),
    funnelsController.update
);

router.delete(
    "/:id",
    validate({ params: funnelParamsSchema }),
    funnelsController.delete
);

// ═══ Rotas de Etapas (Stages) ═══
router.post(
    "/:id/stages",
    validate({ params: funnelParamsSchema, body: addStageSchema }),
    funnelsController.addStage
);

router.put(
    "/:id/stages/reorder",
    validate({ params: funnelParamsSchema, body: reorderStagesSchema }),
    funnelsController.reorderStages
);

router.put(
    "/:id/stages/:stageId",
    validate({ params: stageParamsSchema, body: updateStageSchema }),
    funnelsController.updateStage
);

router.delete(
    "/:id/stages/:stageId",
    validate({ params: stageParamsSchema }),
    funnelsController.deleteStage
);

export const funnelsRoutes = router;
