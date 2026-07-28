import { Request, Response } from "express";
import { categoriesService } from "./categories.service.js";
import { AppError } from "../../lib/errors.js";

export const categoriesController = {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const items = await categoriesService.list(userId);
            res.status(200).json({ success: true, data: items });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const id = req.params.id as string;
            const item = await categoriesService.getById(id, userId);
            res.status(200).json({ success: true, data: item });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const item = await categoriesService.create(userId, req.body);
            res.status(201).json({ success: true, data: item });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const id = req.params.id as string;
            const item = await categoriesService.update(id, userId, req.body);
            res.status(200).json({ success: true, data: item });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const id = req.params.id as string;
            await categoriesService.delete(id, userId);
            res.status(200).json({ success: true, message: "Categoria removida com sucesso" });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },
};
