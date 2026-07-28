import { Router } from "express";
import { sourcesController } from "./sources.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createSourceTypeSchema,
    updateSourceTypeSchema,
    createSourceSchema,
    updateSourceSchema,
    createCampaignSchema,
    updateCampaignSchema,
    idParamSchema,
    campaignParamsSchema,
} from "./sources.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

const requireManage = requirePermission("settings.sources", "manage");

// ═══ Source Types ═══
router.get("/types", sourcesController.listTypes);
router.post("/types",
    requireManage, validate({ body: createSourceTypeSchema }), sourcesController.createType);
router.put("/types/:id",
    requireManage, validate({ params: idParamSchema, body: updateSourceTypeSchema }), sourcesController.updateType);
router.delete("/types/:id",
    requireManage, validate({ params: idParamSchema }), sourcesController.deleteType);

// ═══ Sources ═══
router.get("/", sourcesController.listSources);
router.post("/",
    requireManage, validate({ body: createSourceSchema }), sourcesController.createSource);
router.put("/:id",
    requireManage, validate({ params: idParamSchema, body: updateSourceSchema }), sourcesController.updateSource);
router.patch("/:id/toggle",
    requireManage, validate({ params: idParamSchema }), sourcesController.toggleSource);
router.delete("/:id",
    requireManage, validate({ params: idParamSchema }), sourcesController.deleteSource);

// ═══ Campaigns (nested under source) ═══
router.post("/:id/campaigns",
    requireManage, validate({ params: idParamSchema, body: createCampaignSchema }), sourcesController.createCampaign);
router.put("/:id/campaigns/:campaignId",
    requireManage, validate({ params: campaignParamsSchema, body: updateCampaignSchema }), sourcesController.updateCampaign);
router.patch("/:id/campaigns/:campaignId/toggle",
    requireManage, validate({ params: campaignParamsSchema }), sourcesController.toggleCampaign);
router.delete("/:id/campaigns/:campaignId",
    requireManage, validate({ params: campaignParamsSchema }), sourcesController.deleteCampaign);

export const sourcesRoutes = router;
