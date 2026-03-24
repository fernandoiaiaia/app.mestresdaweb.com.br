import { Request, Response } from "express";
import { activityService } from "./activity.service.js";

export const activityController = {

    async listLogs(req: Request, res: Response) {
        const { search, category, userName, limit, offset } = req.query;
        const data = await activityService.listLogs({
            search: search as string,
            category: category as string,
            userName: userName as string,
            limit: limit ? Number(limit) : 100,
            offset: offset ? Number(offset) : 0,
        });
        res.json({ success: true, data });
    },

    async getStats(req: Request, res: Response) {
        const data = await activityService.getStats();
        res.json({ success: true, data });
    },

    async getUsers(req: Request, res: Response) {
        const data = await activityService.getUsers();
        res.json({ success: true, data });
    },

    async exportLogs(req: Request, res: Response) {
        const { category, userName } = req.query;
        const csv = await activityService.exportLogs({
            category: category as string,
            userName: userName as string,
        });
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", "attachment; filename=activity_logs.csv");
        res.send(csv);
    },

    async seedLogs(req: Request, res: Response) {
        await activityService.seedIfEmpty(req.user!.userId);
        res.json({ success: true, message: "Seed complete" });
    },
};
