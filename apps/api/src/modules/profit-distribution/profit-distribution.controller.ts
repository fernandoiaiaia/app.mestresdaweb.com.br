import { Request, Response } from "express";
import { profitDistributionService } from "./profit-distribution.service.js";

export const profitDistributionController = {
    async list(req: Request, res: Response) {
        try {
            const data = await profitDistributionService.list(req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async simulate(req: Request, res: Response) {
        try {
            const { month, year, companyId } = req.query;
            if (!month || !year) {
                return res.status(400).json({ success: false, message: "Mês e ano são obrigatórios" });
            }
            const data = await profitDistributionService.simulate(month as string, year as string, req.user!, (companyId as string) || 'matriz');
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async execute(req: Request, res: Response) {
        try {
            const data = await profitDistributionService.execute(req.body, req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
