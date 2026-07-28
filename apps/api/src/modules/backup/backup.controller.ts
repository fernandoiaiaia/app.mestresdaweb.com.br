import { Request, Response } from "express";
import { backupService } from "./backup.service.js";

export const backupController = {

    // ═══ Settings ═══
    async getSettings(req: Request, res: Response) {
        const data = await backupService.getSettings(req.user!);
        res.json({ success: true, data });
    },

    async upsertSettings(req: Request, res: Response) {
        const data = await backupService.upsertSettings(req.body, req.user!);
        res.json({ success: true, data });
    },

    // ═══ Stats ═══
    async getStats(req: Request, res: Response) {
        const data = await backupService.getStats(req.user!);
        res.json({ success: true, data });
    },

    // ═══ History ═══
    async listHistory(req: Request, res: Response) {
        const data = await backupService.listHistory(req.user!);
        res.json({ success: true, data });
    },

    async deleteEntry(req: Request, res: Response) {
        await backupService.deleteEntry(String(req.params.id), req.user!);
        res.json({ success: true, message: "Backup removido" });
    },

    // ═══ Create Backup ═══
    async createBackup(req: Request, res: Response) {
        const data = await backupService.createBackup(req.user!);
        res.json({ success: true, data });
    },

    // ═══ Download ═══
    async downloadBackup(req: Request, res: Response) {
        const file = await backupService.getBackupFile(String(req.params.id), req.user!);
        if (!file) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Arquivo não encontrado" } });
            return;
        }
        res.download(file.filePath, file.filename);
    },

    // ═══ Restore ═══
    async restoreBackup(req: Request, res: Response) {
        const result = await backupService.restoreBackup(String(req.params.id), req.user!);
        res.json({ success: true, data: result });
    },

    // ═══ Export ═══
    async exportData(req: Request, res: Response) {
        const { format, proposals, clients, config } = req.body;
        const result = await backupService.exportData(
            format || "json",
            { proposals, clients, config },
            req.user!,
        );
        res.setHeader("Content-Type", result.contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
        res.send(result.content);
    },

    // ═══ Delete Data (LGPD) ═══
    async deleteData(req: Request, res: Response) {
        const { proposals, clients, backupHistory } = req.body;
        const result = await backupService.deleteData({ proposals, clients, backupHistory }, req.user!);
        res.json({ success: true, data: result });
    },
};
