import { Request, Response } from "express";
import { paymentService } from "./payment.service.js";

export const paymentController = {
    async list(req: Request, res: Response) {
        const data = await paymentService.list(req.user!);
        res.json({ success: true, data });
    },

    async create(req: Request, res: Response) {
        const data = await paymentService.create(req.body, req.user!);
        res.status(201).json({ success: true, data });
    },

    async update(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await paymentService.update(id, req.body, req.user!);
        res.json({ success: true, data });
    },

    async toggleActive(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await paymentService.toggleActive(id, req.user!);
        res.json({ success: true, data });
    },

    async duplicate(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await paymentService.duplicate(id, req.user!);
        res.json({ success: true, data });
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id as string;
        await paymentService.delete(id, req.user!);
        res.json({ success: true, message: "Condição excluída" });
    },
};
