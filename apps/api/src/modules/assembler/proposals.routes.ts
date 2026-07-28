import { Router } from "express";
import { assemblerController } from "./assembler.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();

// Todas as rotas de propostas exigem autenticação (do cliente no portal)
router.use(authMiddleware);

// Rotas específicas para o portal do cliente
router.get("/client/mine", assemblerController.listClientProposals);
router.get("/client/a/:id", assemblerController.getClientProposal);

// ── Fila de Aprovação (Gestão) ──
router.get("/queue", assemblerController.getQueue);
router.post("/:id/review", assemblerController.reviewProposal);

// Rotas para buscar dados do DONO da proposta (equipe + condições de pagamento)
// O cliente logado não tem acesso direto a /api/professionals ou /api/payment-conditions
router.get("/client/a/:id/team", assemblerController.getProposalTeam);
router.get("/client/a/:id/payments", assemblerController.getProposalPayments);

// ── Screen Feedback (Client → Consultant) ──
router.get("/client/a/:id/feedback", assemblerController.getScreenFeedback);
router.post("/client/a/:id/feedback", assemblerController.postScreenFeedback);

export const proposalsRoutes = router;
