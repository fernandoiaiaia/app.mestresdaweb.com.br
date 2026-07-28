import { Request, Response } from "express";
import { contractsService } from "./contracts.service.js";

export const contractsController = {
    async list(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 30;
            const search = req.query.search as string;

            const result = await contractsService.listContracts(page, limit, search);
            res.json({ success: true, ...result });
        } catch (error: any) {
            console.error("List contracts error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async stats(req: Request, res: Response) {
        try {
            const stats = await contractsService.getStats();
            res.json({ success: true, data: stats });
        } catch (error: any) {
            console.error("Contracts stats error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await contractsService.createContract(req.body, req.user!);
            res.status(201).json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    async searchDeals(req: Request, res: Response) {
        try {
            const query = req.query.q as string;
            const data = await contractsService.searchDeals(query);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    async uploadAttachment(req: Request, res: Response) {
        try {
            if (!req.file) {
                res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Nenhum arquivo enviado" } });
                return;
            }
            const data = await contractsService.addAttachment(req.params.id as string, req.file, req.user!);
            res.status(201).json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    }
};
