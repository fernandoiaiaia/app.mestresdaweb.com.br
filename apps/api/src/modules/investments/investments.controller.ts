import { Request, Response } from "express";
import { investmentsService } from "./investments.service.js";

export const investmentsController = {
    async list(req: Request, res: Response) {
        try {
            const data = await investmentsService.list(req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const data = await investmentsService.getById(req.params.id as string, req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(404).json({ success: false, message: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await investmentsService.create(req.body, req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async updateBalance(req: Request, res: Response) {
        try {
            const { newBalance, notes } = req.body;
            const data = await investmentsService.updateBalance(req.params.id as string, newBalance, notes, req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
