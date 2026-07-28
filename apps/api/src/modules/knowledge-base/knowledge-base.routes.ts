import { Router } from "express";
import { knowledgeBaseController } from "./knowledge-base.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { uploadKbSchema, kbParamsSchema } from "./knowledge-base.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

const requireView = requirePermission("settings.knowledge-base", "view");
const requireManage = requirePermission("settings.knowledge-base", "manage");

router.get("/", requireView, knowledgeBaseController.list);

router.post("/", requireManage, validate({ body: uploadKbSchema }), knowledgeBaseController.upload);

router.delete("/:id", requireManage, validate({ params: kbParamsSchema }), knowledgeBaseController.delete);

export const knowledgeBaseRoutes = router;
