import { Request, Response } from "express";
import { securityService } from "./security.service.js";

export const securityController = {
    async getSettings(req: Request, res: Response) {
        const data = await securityService.getSettings(req.user!);
        res.json({ success: true, data });
    },

    async upsertSettings(req: Request, res: Response) {
        const data = await securityService.upsertSettings(req.body, req.user!);
        res.json({ success: true, data });
    },

    async changePassword(req: Request, res: Response) {
        try {
            await securityService.changePassword(req.body.currentPassword, req.body.newPassword, req.user!);
            res.json({ success: true, message: "Senha alterada com sucesso" });
        } catch (err: any) {
            const message = err?.message || "Erro ao alterar senha";
            const status = message === "Senha atual incorreta" ? 400 : 500;
            res.status(status).json({ success: false, error: message });
        }
    },

    // ═══ Sessions ═══

    async listSessions(req: Request, res: Response) {
        const data = await securityService.listSessions(req.user!);
        res.json({ success: true, data });
    },

    async revokeSession(req: Request, res: Response) {
        await securityService.revokeSession(req.params.id as string, req.user!);
        res.json({ success: true, message: "Sessão encerrada" });
    },

    async revokeAllOther(req: Request, res: Response) {
        const rawSessionId = req.headers["x-session-id"];
        const currentSessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
        await securityService.revokeAllOtherSessions(currentSessionId, req.user!);
        res.json({ success: true, message: "Todas as outras sessões encerradas" });
    },

    // ═══ Login History ═══

    async listLoginHistory(req: Request, res: Response) {
        const data = await securityService.listLoginHistory(req.user!);
        res.json({ success: true, data });
    },
};
