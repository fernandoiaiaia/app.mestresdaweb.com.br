import { Router } from "express";
import { knowledgeBaseController } from "./knowledge-base.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { uploadKbSchema, kbParamsSchema } from "./knowledge-base.schemas.js";

const router: Router = Router();

// Todas as rotas de Knowledge Base exigem autenticação
router.use(authMiddleware);

router.get("/", knowledgeBaseController.list);

router.post("/", validate({ body: uploadKbSchema }), knowledgeBaseController.upload);

router.delete("/:id", validate({ params: kbParamsSchema }), knowledgeBaseController.delete);

export const knowledgeBaseRoutes = router;
