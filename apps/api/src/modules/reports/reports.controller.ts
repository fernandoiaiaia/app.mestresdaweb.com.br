import { Request, Response } from "express";
import { reportsService } from "./reports.service.js";

export const reportsController = {
    async getDRE(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            const mode = (req.query.mode as string) === 'competencia' ? 'competencia' : 'caixa';
            
            const dre = await reportsService.getDRE(year, mode);
            res.json({ success: true, data: dre });
        } catch (error: any) {
            console.error("DRE error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getCashFlow(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const cashFlow = await reportsService.getCashFlow(year);
            res.json({ success: true, data: cashFlow });
        } catch (error: any) {
            console.error("Cash Flow error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getProfitability(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const profitability = await reportsService.getProfitability(year);
            res.json({ success: true, data: profitability });
        } catch (error: any) {
            console.error("Profitability error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getSalesFunnel(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            const funnelId = req.query.funnelId as string | undefined;
            
            const salesFunnel = await reportsService.getSalesFunnel(year, funnelId);
            res.json({ success: true, data: salesFunnel });
        } catch (error: any) {
            console.error("Sales Funnel error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getConsultantPerformance(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const performance = await reportsService.getConsultantPerformance(year);
            res.json({ success: true, data: performance });
        } catch (error: any) {
            console.error("Consultant Performance error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getAcquisitionROI(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const roi = await reportsService.getAcquisitionROI(year);
            res.json({ success: true, data: roi });
        } catch (error: any) {
            console.error("Acquisition ROI error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getProjectProfitability(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const projectsProfitability = await reportsService.getProjectProfitability(year);
            res.json({ success: true, data: projectsProfitability });
        } catch (error: any) {
            console.error("Project Profitability error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getProjectVelocity(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const velocity = await reportsService.getProjectVelocity(year);
            res.json({ success: true, data: velocity });
        } catch (error: any) {
            console.error("Project Velocity error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getContractsMRR(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const mrrData = await reportsService.getContractsMRR(year);
            res.json({ success: true, data: mrrData });
        } catch (error: any) {
            console.error("Contracts MRR error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getContractsAging(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const agingData = await reportsService.getContractsAging(year);
            res.json({ success: true, data: agingData });
        } catch (error: any) {
            console.error("Contracts Aging error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getChatbotMetrics(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const metrics = await reportsService.getChatbotMetrics(year);
            res.json({ success: true, data: metrics });
        } catch (error: any) {
            console.error("Chatbot Metrics error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getSupportVolume(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const volumeData = await reportsService.getSupportVolume(year);
            res.json({ success: true, data: volumeData });
        } catch (error: any) {
            console.error("Support Volume error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getExecutiveSummary(req: Request, res: Response) {
        try {
            const summaryData = await reportsService.getExecutiveSummary();
            res.json({ success: true, data: summaryData });
        } catch (error: any) {
            console.error("Executive Summary error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
