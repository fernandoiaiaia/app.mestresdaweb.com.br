import { Request, Response } from "express";
import { logger } from "../../lib/logger.js";
import { isAuthorizedConnechRequest } from "./connech-auth.js";
import { listAdvisors } from "./connech-advisors.service.js";

export const connechAdvisorsController = {
    async handleListAdvisors(req: Request, res: Response) {
        if (!isAuthorizedConnechRequest(req.headers.authorization)) {
            return res.status(401).json({ success: false, error: { message: "Token inválido." } });
        }
        try {
            const advisors = await listAdvisors();
            return res.status(200).json({ success: true, data: advisors });
        } catch (err) {
            logger.error({ err }, "[Connech Advisors] Falha ao listar advisors");
            return res.status(500).json({ success: false, error: { message: "Erro interno." } });
        }
    },
};
