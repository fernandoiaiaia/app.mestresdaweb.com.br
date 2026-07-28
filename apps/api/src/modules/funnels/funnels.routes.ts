import { Router } from "express";
import { funnelsController } from "./funnels.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";
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

router.use(authMiddleware);

const requireView = requirePermission("settings.funnels", "view");
const requireManage = requirePermission("settings.funnels", "manage");

// ═══ Rotas de Funil ═══
// List is open to any authenticated user; service filters by ownership/assignment/allowedFunnels
router.get("/", funnelsController.list);

router.post(
    "/",
    requireManage,
    validate({ body: createFunnelSchema }),
    funnelsController.create
);

router.put(
    "/reorder",
    requireManage,
    validate({ body: reorderFunnelsSchema }),
    funnelsController.reorderFunnels
);

router.put(
    "/:id",
    requireManage,
    validate({ params: funnelParamsSchema, body: updateFunnelSchema }),
    funnelsController.update
);

router.delete(
    "/:id",
    requireManage,
    validate({ params: funnelParamsSchema }),
    funnelsController.delete
);

// ═══ Rotas de Etapas (Stages) ═══
router.post(
    "/:id/stages",
    requireManage,
    validate({ params: funnelParamsSchema, body: addStageSchema }),
    funnelsController.addStage
);

router.put(
    "/:id/stages/reorder",
    requireManage,
    validate({ params: funnelParamsSchema, body: reorderStagesSchema }),
    funnelsController.reorderStages
);

router.put(
    "/:id/stages/:stageId",
    requireManage,
    validate({ params: stageParamsSchema, body: updateStageSchema }),
    funnelsController.updateStage
);

router.delete(
    "/:id/stages/:stageId",
    requireManage,
    validate({ params: stageParamsSchema }),
    funnelsController.deleteStage
);

export const funnelsRoutes = router;
