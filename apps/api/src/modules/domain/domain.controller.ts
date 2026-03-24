import { Request, Response } from "express";
import { domainService } from "./domain.service.js";

export const domainController = {

    async getSettings(req: Request, res: Response) {
        const data = await domainService.getSettings(req.user!);
        res.json({ success: true, data });
    },

    async upsertSettings(req: Request, res: Response) {
        const data = await domainService.upsertSettings(req.body, req.user!);
        res.json({ success: true, data });
    },

    async checkSubdomain(req: Request, res: Response) {
        const { subdomain } = req.body;
        const data = await domainService.checkSubdomain(subdomain, req.user!);
        res.json({ success: true, data });
    },

    async verifyDomain(req: Request, res: Response) {
        const data = await domainService.verifyDomain(req.user!);
        res.json({ success: true, data });
    },

    async removeDomain(req: Request, res: Response) {
        await domainService.removeDomain(req.user!);
        res.json({ success: true, message: "Domínio removido" });
    },

    async uploadFile(req: Request, res: Response) {
        const type = req.params.type as "logo" | "favicon";
        if (!req.file) {
            res.status(400).json({ success: false, error: { message: "Nenhum arquivo enviado" } });
            return;
        }
        const filePath = await domainService.uploadFile(req.file, type, req.user!);
        res.json({ success: true, data: { filePath } });
    },

    async removeFile(req: Request, res: Response) {
        const type = req.params.type as "logo" | "favicon";
        await domainService.removeFile(type, req.user!);
        res.json({ success: true, message: "Arquivo removido" });
    },
};
