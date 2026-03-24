import { Request, Response } from "express";
import { segmentsService } from "./segments.service.js";

export const segmentsController = {
    async list(req: Request, res: Response) {
        const data = await segmentsService.list(req.user!);
        res.json({ success: true, data });
    },

    async create(req: Request, res: Response) {
        const data = await segmentsService.create(req.body, req.user!);
        res.status(201).json({ success: true, data });
    },

    async update(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await segmentsService.update(id, req.body, req.user!);
        res.json({ success: true, data });
    },

    async toggleActive(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await segmentsService.toggleActive(id, req.user!);
        res.json({ success: true, data });
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id as string;
        await segmentsService.delete(id, req.user!);
        res.json({ success: true, message: "Segmento excluído" });
    },
};
