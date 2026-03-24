import { Request, Response } from "express";
import { notificationFeedService } from "./notification-feed.service.js";

export const notificationFeedController = {

    // GET /api/notifications/feed
    async list(req: Request, res: Response) {
        const { type, read, search, page, limit } = req.query;
        const result = await notificationFeedService.list(req.user!, {
            type: type as string,
            read: read as string,
            search: search as string,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json({ success: true, ...result });
    },

    // GET /api/notifications/feed/unread-count
    async unreadCount(req: Request, res: Response) {
        const data = await notificationFeedService.getUnreadCount(req.user!);
        res.json({ success: true, data });
    },

    // PATCH /api/notifications/feed/read-all
    async markAllAsRead(req: Request, res: Response) {
        await notificationFeedService.markAllAsRead(req.user!);
        res.json({ success: true, message: "Todas marcadas como lidas" });
    },

    // PATCH /api/notifications/feed/:id/read
    async markAsRead(req: Request, res: Response) {
        await notificationFeedService.markAsRead(String(req.params.id), req.user!);
        res.json({ success: true, message: "Marcada como lida" });
    },

    // DELETE /api/notifications/feed/:id
    async delete(req: Request, res: Response) {
        await notificationFeedService.delete(String(req.params.id), req.user!);
        res.json({ success: true, message: "Notificação removida" });
    },

    // DELETE /api/notifications/feed
    async deleteAll(req: Request, res: Response) {
        await notificationFeedService.deleteAll(req.user!);
        res.json({ success: true, message: "Todas as notificações removidas" });
    },
};
