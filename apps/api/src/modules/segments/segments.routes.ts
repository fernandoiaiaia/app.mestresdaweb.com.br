import { Router } from "express";
import { segmentsController } from "./segments.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createSegmentSchema, updateSegmentSchema, idParamSchema } from "./segments.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

const requireManage = requirePermission("settings.segments", "manage");

router.get("/", segmentsController.list);
router.post("/",
    requireManage, validate({ body: createSegmentSchema }), segmentsController.create);
router.put("/:id",
    requireManage, validate({ params: idParamSchema, body: updateSegmentSchema }), segmentsController.update);
router.patch("/:id/toggle",
    requireManage, validate({ params: idParamSchema }), segmentsController.toggleActive);
router.delete("/:id",
    requireManage, validate({ params: idParamSchema }), segmentsController.delete);

export const segmentsRoutes = router;
