import { Request, Response } from "express";
import { notificationsService } from "./notifications.service.js";

export const notificationsController = {
    async getSettings(req: Request, res: Response) {
        const data = await notificationsService.getSettings(req.user!);
        res.json({ success: true, data });
    },

    async upsertSettings(req: Request, res: Response) {
        const data = await notificationsService.upsertSettings(req.body, req.user!);
        res.json({ success: true, data });
    },

    async getPreferences(req: Request, res: Response) {
        const data = await notificationsService.getPreferences(req.user!);
        res.json({ success: true, data });
    },

    async bulkUpsertPreferences(req: Request, res: Response) {
        const data = await notificationsService.bulkUpsertPreferences(req.body.preferences, req.user!);
        res.json({ success: true, data });
    },
};
