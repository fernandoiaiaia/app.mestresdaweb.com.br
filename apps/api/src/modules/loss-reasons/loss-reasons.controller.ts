import { Request, Response } from "express";
import { lossReasonsService } from "./loss-reasons.service.js";

export const lossReasonsController = {
    // ═══ Loss Reasons ═══

    async listReasons(req: Request, res: Response) {
        const reasons = await lossReasonsService.listReasons(req.user!);
        res.json({ success: true, data: reasons });
    },

    async createReason(req: Request, res: Response) {
        const reason = await lossReasonsService.createReason(req.body, req.user!);
        res.status(201).json({ success: true, data: reason });
    },

    async updateReason(req: Request, res: Response) {
        const id = req.params.id as string;
        const reason = await lossReasonsService.updateReason(id, req.body, req.user!);
        res.json({ success: true, data: reason });
    },

    async deleteReason(req: Request, res: Response) {
        const id = req.params.id as string;
        await lossReasonsService.deleteReason(id, req.user!);
        res.json({ success: true, message: "Motivo excluído" });
    },
};
