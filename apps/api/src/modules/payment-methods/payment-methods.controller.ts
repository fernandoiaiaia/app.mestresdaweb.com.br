import { Request, Response } from "express";
import { paymentMethodsService } from "./payment-methods.service.js";
import { AppError } from "../../lib/errors.js";

export const paymentMethodsController = {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const items = await paymentMethodsService.list(userId);
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
            const item = await paymentMethodsService.getById(id, userId);
            res.status(200).json({ success: true, data: item });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new AppError("Não autenticado", 401);

            const item = await paymentMethodsService.create(userId, req.body);
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
            const item = await paymentMethodsService.update(id, userId, req.body);
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
            await paymentMethodsService.delete(id, userId);
            res.status(200).json({ success: true, message: "Forma de pagamento removida com sucesso" });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    },
};
