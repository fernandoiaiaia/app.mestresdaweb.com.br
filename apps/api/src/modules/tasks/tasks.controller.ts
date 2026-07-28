import { Request, Response, NextFunction } from "express";
import { tasksService } from "./tasks.service.js";

class TasksController {
    // ═══════════════════════════════════════
    // Core Handlers
    // ═══════════════════════════════════════

    list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const { clientId, startDate, endDate } = req.query;

            const filters: any = {};
            if (clientId) filters.clientId = String(clientId);
            if (startDate) filters.startDate = new Date(String(startDate));
            if (endDate) filters.endDate = new Date(String(endDate));

            const data = await tasksService.findMany(userId, filters);

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const id = req.params.id as string;
            const data = await tasksService.findById(userId, id);

            if (!data) {
                return res.status(404).json({ success: false, message: "Tarefa não encontrada" });
            }

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const data = await tasksService.create(userId, req.body);
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const id = req.params.id as string;
            const data = await tasksService.update(userId, id, req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const id = req.params.id as string;
            await tasksService.delete(userId, id);
            res.status(200).json({ success: true, data: { deleted: true } });
        } catch (error) {
            next(error);
        }
    };
}

export const tasksController = new TasksController();
