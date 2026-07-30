import { timingSafeEqual } from "crypto";
import { Request, Response } from "express";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { connechScopeEditRequestSchema } from "./connech-scope-edit.schemas.js";
import {
    DealNotFoundError,
    ProposalNotFoundError,
    recordConnechScopeEditRequest,
} from "./connech-scope-edit.service.js";

function isAuthorized(authHeader: string | undefined): boolean {
    if (!env.CONNECH_TO_ADVISOR_SECRET || !authHeader?.startsWith("Bearer ")) return false;

    const token = Buffer.from(authHeader.slice("Bearer ".length).trim());
    const secret = Buffer.from(env.CONNECH_TO_ADVISOR_SECRET);
    if (token.length !== secret.length) return false;
    return timingSafeEqual(token, secret);
}

export const connechScopeEditController = {
    async handleScopeEditRequest(req: Request, res: Response) {
        if (!isAuthorized(req.headers.authorization)) {
            return res.status(401).json({ success: false, error: { message: "Token inválido." } });
        }

        const parsed = connechScopeEditRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({
                success: false,
                error: { message: "Payload inválido.", issues: parsed.error.issues },
            });
        }

        const dealId = req.params.dealId as string | undefined;
        if (!dealId) {
            return res.status(400).json({ success: false, error: { message: "dealId é obrigatório." } });
        }

        try {
            const result = await recordConnechScopeEditRequest(dealId, parsed.data);
            return res.status(200).json({ success: true, data: { taskId: result.taskId } });
        } catch (err) {
            if (err instanceof DealNotFoundError) {
                return res.status(404).json({ success: false, error: { message: err.message } });
            }
            if (err instanceof ProposalNotFoundError) {
                return res.status(404).json({ success: false, error: { message: err.message } });
            }
            logger.error({ err, dealId }, "[Connech Scope Edit] Falha ao registrar solicitação");
            return res.status(500).json({ success: false, error: { message: "Erro interno." } });
        }
    },
};
