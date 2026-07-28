import { Request, Response } from "express";
import { funnelsService } from "./funnels.service.js";

export const funnelsController = {
    async list(req: Request, res: Response) {
        const funnels = await funnelsService.list(req.user!);
        res.json({ success: true, data: funnels });
    },

    async create(req: Request, res: Response) {
        const funnel = await funnelsService.create(req.body, req.user!);
        res.status(201).json({ success: true, data: funnel });
    },

    async update(req: Request, res: Response) {
        const id = req.params.id as string;
        const funnel = await funnelsService.update(id, req.body, req.user!);
        res.json({ success: true, data: funnel });
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id as string;
        await funnelsService.delete(id, req.user!);
        res.json({ success: true, message: "Funil deletado com sucesso" });
    },

    async addStage(req: Request, res: Response) {
        const id = req.params.id as string;
        const stage = await funnelsService.addStage(id, req.body, req.user!);
        res.status(201).json({ success: true, data: stage });
    },

    async updateStage(req: Request, res: Response) {
        const id = req.params.id as string;
        const stageId = req.params.stageId as string;
        const stage = await funnelsService.updateStage(id, stageId, req.body, req.user!);
        res.json({ success: true, data: stage });
    },

    async deleteStage(req: Request, res: Response) {
        const id = req.params.id as string;
        const stageId = req.params.stageId as string;
        await funnelsService.deleteStage(id, stageId, req.user!);
        res.json({ success: true, message: "Etapa deletada com sucesso" });
    },

    async reorderStages(req: Request, res: Response) {
        const id = req.params.id as string;
        await funnelsService.reorderStages(id, req.body, req.user!);
        res.json({ success: true, message: "Etapas reordenadas com sucesso" });
    },

    async reorderFunnels(req: Request, res: Response) {
        await funnelsService.reorderFunnels(req.body, req.user!);
        res.json({ success: true, message: "Funis reordenados com sucesso" });
    }
};
