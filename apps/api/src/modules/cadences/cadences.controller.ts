import { Request, Response } from "express";
import { cadencesService } from "./cadences.service.js";

export const cadencesController = {
    async list(req: Request, res: Response) {
        const cadences = await cadencesService.list(req.user!);
        res.json({ success: true, data: cadences });
    },

    async create(req: Request, res: Response) {
        const cadence = await cadencesService.create(req.body, req.user!);
        res.status(201).json({ success: true, data: cadence });
    },

    async update(req: Request, res: Response) {
        const id = req.params.id as string;
        const cadence = await cadencesService.update(id, req.body, req.user!);
        res.json({ success: true, data: cadence });
    },

    async updateStatus(req: Request, res: Response) {
        const id = req.params.id as string;
        const status = req.body.status as string;
        const cadence = await cadencesService.updateStatus(id, status, req.user!);
        res.json({ success: true, data: cadence });
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id as string;
        await cadencesService.delete(id, req.user!);
        res.json({ success: true, message: "Cadência deletada com sucesso" });
    },

    async addStep(req: Request, res: Response) {
        const id = req.params.id as string;
        const step = await cadencesService.addStep(id, req.body, req.user!);
        res.status(201).json({ success: true, data: step });
    },

    async deleteStep(req: Request, res: Response) {
        const id = req.params.id as string;
        const stepId = req.params.stepId as string;
        await cadencesService.deleteStep(id, stepId, req.user!);
        res.json({ success: true, message: "Passo deletado com sucesso" });
    }
};
