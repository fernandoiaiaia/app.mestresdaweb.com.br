import { Router } from "express";
import { assemblerController } from "./assembler.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { generateScopeSchema } from "./assembler.schemas.js";

const router: Router = Router();

// Todas as rotas do Assembler exigem autenticação
router.use(authMiddleware);

// Rota de Geração SSE (Server-Sent Events)
router.post("/generate", validate({ body: generateScopeSchema }), assemblerController.generate);

// Rotas de listagem/gerenciamento das propostas assambladas salvas no banco
router.get("/proposals", assemblerController.listProposals);
router.get("/proposals/:id", assemblerController.getProposal);
router.get("/proposals/:id/feedback", assemblerController.getProposalFeedback);
router.patch("/proposals/:id/feedback/read", assemblerController.markFeedbackRead);
router.post("/proposals", assemblerController.saveProposal); // Cria ou atualiza uma existente
router.delete("/proposals/:id", assemblerController.deleteProposal);

export const assemblerRoutes = router;
