import { Router } from "express";
import { inboundWebhooksController } from "./inbound-webhooks.controller.js";

const router = Router();

// Endpoint único não necessita de middleware de sessão pois a auth é o prório Bearer Token no cabeçalho
router.post("/inbound", inboundWebhooksController.handleInbound);

export const inboundWebhooksRoutes: Router = router;
