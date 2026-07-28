import { Request, Response } from "express";
import { inboundWebhooksService } from "./inbound-webhooks.service.js";
import { logger } from "../../lib/logger.js";

export const inboundWebhooksController = {
    async handleInbound(req: Request, res: Response) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: "Acesso negado. Token 'Bearer' não fornecido ou formato inválido."
                    }
                });
            }

            const token = authHeader.replace("Bearer ", "").trim();

            const result = await inboundWebhooksService.processIncoming(token, req.body);
            return res.status(201).json(result);
            
        } catch (err: any) {
            logger.error({ err, body: req.body }, "[Inbound Webhook] Error processing lead");
            
            // Se o erro vier das nossas validações de throw new Error("..."), mandamos 400
            if (err.message && err.message.includes("inválido")) {
                return res.status(401).json({ success: false, error: { message: err.message } });
            }
            if (err.message && err.message.includes("obrigatório")) {
                return res.status(400).json({ success: false, error: { message: err.message } });
            }

            return res.status(500).json({
                success: false,
                error: { message: "Erro interno ao processar o Webhook." }
            });
        }
    }
};
