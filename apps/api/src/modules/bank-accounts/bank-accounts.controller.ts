import { Request, Response } from "express";
import { bankAccountsService } from "./bank-accounts.service.js";

export const bankAccountsController = {
    async list(req: Request, res: Response) {
        const userId = req.user!.userId;
        const result = await bankAccountsService.list(userId);
        res.json({ success: true, data: result });
    },

    async getById(req: Request, res: Response) {
        const userId = req.user!.userId;
        const id = req.params.id as string;
        const result = await bankAccountsService.getById(userId, id);
        res.json({ success: true, data: result });
    },

    async create(req: Request, res: Response) {
        const userId = req.user!.userId;
        const result = await bankAccountsService.create(userId, req.body);
        res.status(201).json({ success: true, data: result });
    },

    async update(req: Request, res: Response) {
        const userId = req.user!.userId;
        const id = req.params.id as string;
        const result = await bankAccountsService.update(userId, id, req.body);
        res.json({ success: true, data: result });
    },

    async delete(req: Request, res: Response) {
        const userId = req.user!.userId;
        const id = req.params.id as string;
        await bankAccountsService.delete(userId, id);
        res.json({ success: true });
    }
};
