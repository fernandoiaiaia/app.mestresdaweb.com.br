import { Request, Response, NextFunction } from "express";
import { costCentersService } from "./cost-centers.service.js";

export const costCentersController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const costCenters = await costCentersService.list(user.userId);
            res.json({ success: true, data: costCenters });
        } catch (error) {
            next(error);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const id = req.params.id as string;
            const costCenter = await costCentersService.getById(id, user.userId);
            res.json({ success: true, data: costCenter });
        } catch (error) {
            next(error);
        }
    },

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const costCenter = await costCentersService.create(user.userId, req.body);
            res.status(201).json({ success: true, data: costCenter });
        } catch (error) {
            next(error);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const id = req.params.id as string;
            const costCenter = await costCentersService.update(id, user.userId, req.body);
            res.json({ success: true, data: costCenter });
        } catch (error) {
            next(error);
        }
    },

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const id = req.params.id as string;
            await costCentersService.delete(id, user.userId);
            res.json({ success: true, message: "Centro de custo excluído com sucesso." });
        } catch (error) {
            next(error);
        }
    },
};
