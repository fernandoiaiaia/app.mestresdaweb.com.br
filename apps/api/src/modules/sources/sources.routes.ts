import { Router } from "express";
import { sourcesController } from "./sources.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
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

// ═══ Source Types ═══
router.get("/types", sourcesController.listTypes);
router.post("/types", validate({ body: createSourceTypeSchema }), sourcesController.createType);
router.put("/types/:id", validate({ params: idParamSchema, body: updateSourceTypeSchema }), sourcesController.updateType);
router.delete("/types/:id", validate({ params: idParamSchema }), sourcesController.deleteType);

// ═══ Sources ═══
router.get("/", sourcesController.listSources);
router.post("/", validate({ body: createSourceSchema }), sourcesController.createSource);
router.put("/:id", validate({ params: idParamSchema, body: updateSourceSchema }), sourcesController.updateSource);
router.patch("/:id/toggle", validate({ params: idParamSchema }), sourcesController.toggleSource);
router.delete("/:id", validate({ params: idParamSchema }), sourcesController.deleteSource);

// ═══ Campaigns (nested under source) ═══
router.post("/:id/campaigns", validate({ params: idParamSchema, body: createCampaignSchema }), sourcesController.createCampaign);
router.put("/:id/campaigns/:campaignId", validate({ params: campaignParamsSchema, body: updateCampaignSchema }), sourcesController.updateCampaign);
router.patch("/:id/campaigns/:campaignId/toggle", validate({ params: campaignParamsSchema }), sourcesController.toggleCampaign);
router.delete("/:id/campaigns/:campaignId", validate({ params: campaignParamsSchema }), sourcesController.deleteCampaign);

export const sourcesRoutes = router;
