import { Router } from "express";
import { segmentsController } from "./segments.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createSegmentSchema, updateSegmentSchema, idParamSchema } from "./segments.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/", segmentsController.list);
router.post("/", validate({ body: createSegmentSchema }), segmentsController.create);
router.put("/:id", validate({ params: idParamSchema, body: updateSegmentSchema }), segmentsController.update);
router.patch("/:id/toggle", validate({ params: idParamSchema }), segmentsController.toggleActive);
router.delete("/:id", validate({ params: idParamSchema }), segmentsController.delete);

export const segmentsRoutes = router;
