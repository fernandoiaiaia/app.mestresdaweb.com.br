import { Router } from "express";
import { connechAdvisorsController } from "./connech-advisors.controller.js";

const router: Router = Router();

// Autenticado via Bearer CONNECH_TO_ADVISOR_SECRET (não JWT de sessão) — ver connech-auth.ts.
router.get("/advisors", connechAdvisorsController.handleListAdvisors);

export const connechAdvisorsRoutes: Router = router;
