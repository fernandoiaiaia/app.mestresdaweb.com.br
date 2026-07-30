import { Request, Response } from "express";
import { logger } from "../../lib/logger.js";
import { isAuthorizedConnechRequest } from "./connech-auth.js";
import { connechScopeEditRequestSchema } from "./connech-scope-edit.schemas.js";
import {
    DealNotFoundError,
    ProposalNotFoundError,
    recordConnechScopeEditRequest,
} from "./connech-scope-edit.service.js";

export const connechScopeEditController = {
    async handleScopeEditRequest(req: Request, res: Response) {
        if (!isAuthorizedConnechRequest(req.headers.authorization)) {
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
