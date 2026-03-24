import { Request, Response } from "express";
import { lossReasonsService } from "./loss-reasons.service.js";

export const lossReasonsController = {
    // ═══ Categories ═══

    async listCategories(req: Request, res: Response) {
        const categories = await lossReasonsService.listCategories(req.user!);
        res.json({ success: true, data: categories });
    },

    async createCategory(req: Request, res: Response) {
        const category = await lossReasonsService.createCategory(req.body, req.user!);
        res.status(201).json({ success: true, data: category });
    },

    async updateCategory(req: Request, res: Response) {
        const id = req.params.id as string;
        const category = await lossReasonsService.updateCategory(id, req.body, req.user!);
        res.json({ success: true, data: category });
    },

    async deleteCategory(req: Request, res: Response) {
        const id = req.params.id as string;
        await lossReasonsService.deleteCategory(id, req.user!);
        res.json({ success: true, message: "Categoria excluída" });
    },

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
