import { Request, Response } from "express";
import { transactionTypesService } from "./transaction-types.service.js";
import { AppError } from "../../lib/errors.js";

export const transactionTypesController = {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const items = await transactionTypesService.list(userId);
            res.status(200).json({ success: true, data: items });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const { id } = req.params;
            const item = await transactionTypesService.getById(id as string, userId);
            res.status(200).json({ success: true, data: item });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const item = await transactionTypesService.create(userId, req.body);
            res.status(201).json({ success: true, data: item });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const { id } = req.params;
            const item = await transactionTypesService.update(id as string, userId, req.body);
            res.status(200).json({ success: true, data: item });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const { id } = req.params;
            await transactionTypesService.delete(id as string, userId);
            res.status(200).json({ success: true, message: "Tipo de Lançamento removido com sucesso" });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },
};
