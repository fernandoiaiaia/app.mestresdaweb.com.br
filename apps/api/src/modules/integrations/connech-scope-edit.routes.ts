import { Router } from "express";
import { connechScopeEditController } from "./connech-scope-edit.controller.js";

const router: Router = Router();

// Autenticado via Bearer CONNECH_TO_ADVISOR_SECRET (não JWT de sessão) — ver controller.
router.post("/deals/:dealId/scope-edit-requests", connechScopeEditController.handleScopeEditRequest);

export const connechScopeEditRoutes: Router = router;
