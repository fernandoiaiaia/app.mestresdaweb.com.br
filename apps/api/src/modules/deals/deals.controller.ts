import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { dealsService } from "./deals.service.js";
import { dealsDashboardService } from "./deals.dashboard.service.js";
import { dealsAnalysisService } from "./deals.analysis.service.js";
import { dealsRevenueService } from "./deals.revenue.service.js";
import { dealsCycleService } from "./deals.cycle.service.js";
import { dealsPortfolioService } from "./deals.portfolio.service.js";
import { dealsLossService } from "./deals.loss.service.js";
import { dealsActivitiesService } from "./deals.activities.service.js";
import { dealsRankingService } from "./deals.ranking.service.js";
import { dealsTeamService } from "./deals.team.service.js";
import { dealsCompareService } from "./deals.compare.service.js";
import { dealsGoalsService } from "./deals.goals.service.js";
import { dealsSdrService } from "./deals.sdr.service.js";
import { dealsFunnelService } from "./deals.funnel.service.js";
import { dealsSummaryService } from "./deals.summary.service.js";
import { prisma } from "../../config/database.js";

// Ensure uploads dir exists
const uploadsDir = path.resolve(process.cwd(), "uploads", "deal-files");
fs.mkdirSync(uploadsDir, { recursive: true });

export const dealsController = {
    async list(req: Request, res: Response) {
        const query = {
            funnelId: typeof req.query.funnelId === 'string' ? req.query.funnelId : undefined,
            search: typeof req.query.search === 'string' ? req.query.search : undefined
        };
        const deals = await dealsService.list(req.user!, query);
        res.json({ success: true, data: deals });
    },

    async dashboardStats(req: Request, res: Response) {
        const isManager = req.user!.role === "OWNER" || req.user!.role === "ADMIN" || req.user!.role === "MANAGER";
        const filterConsultantId = typeof req.query.consultantId === 'string' && req.query.consultantId !== 'all' ? req.query.consultantId : undefined;
        
        try {
            const stats = await dealsDashboardService.getDashboardStats({
                userId: req.user!.userId,
                consultantId: isManager ? filterConsultantId : req.user!.userId, // Força consultant se for vendedor
                isManager
            });
            res.json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro gerando dashboard" });
        }
    },

    async pipelineAnalysis(req: Request, res: Response) {
        try {
            const data = await dealsAnalysisService.getPipelineAnalysis({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro gerando analise do pipeline" });
        }
    },

    async revenueForecast(req: Request, res: Response) {
        try {
            const data = await dealsRevenueService.getRevenueForecast({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro gerando forecast de receita" });
        }
    },

    async salesCycle(req: Request, res: Response) {
        try {
            const data = await dealsCycleService.getSalesCycle({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro gerando ciclo de vendas" });
        }
    },

    async clientsPortfolio(req: Request, res: Response) {
        try {
            const data = await dealsPortfolioService.getPortfolio({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro gerando o cartao de portfólio" });
        }
    },

    async lossAnalysis(req: Request, res: Response) {
        try {
            const data = await dealsLossService.getLossAnalysis({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro analisando as perdas do pipeline" });
        }
    },

    async activitiesReport(req: Request, res: Response) {
        try {
            const data = await dealsActivitiesService.getActivitiesReport({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro analisando rastreio de produtividade" });
        }
    },

    async productsRanking(req: Request, res: Response) {
        try {
            const data = await dealsRankingService.getProductsRanking({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro processando o ranking de funis" });
        }
    },

    async teamPerformance(req: Request, res: Response) {
        try {
            const data = await dealsTeamService.getTeamPerformance({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro processando metricas da equipe" });
        }
    },

    async consultantsComparison(req: Request, res: Response) {
        try {
            const data = await dealsCompareService.getConsultantComparison({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro gerando comparativo de consultores" });
        }
    },

    async goalsTracking(req: Request, res: Response) {
        try {
            const data = await dealsGoalsService.getGoalsTracking({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro monitorando as metas da conta" });
        }
    },

    async sdrPerformance(req: Request, res: Response) {
        try {
            const data = await dealsSdrService.getSdrPerformance({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro resgatando estatísticas de SDR" });
        }
    },

    async conversionFunnel(req: Request, res: Response) {
        try {
            const data = await dealsFunnelService.getConversionFunnel({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro resgatando estatísticas de SDR" });
        }
    },

    async conversionFunnel(req: Request, res: Response) {
        try {
            const data = await dealsFunnelService.getConversionFunnel({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro processando motor cumulativo do funil" });
        }
    },

    async periodSummary(req: Request, res: Response) {
        try {
            const data = await dealsSummaryService.getPeriodSummary({ userId: req.user!.userId });
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: "Erro extraindo sumário consolidado de período" });
        }
    },

    async get(req: Request, res: Response) {
        const id = req.params.id as string;
        try {
            const deal = await dealsService.getById(id, req.user!);
            res.json({ success: true, data: deal });
        } catch (error: any) {
            res.status(404).json({ success: false, error: error.message || "Não encontrado" });
        }
    },

    async create(req: Request, res: Response) {
        const deal = await dealsService.create(req.body, req.user!);
        res.status(201).json({ success: true, data: deal });
    },

    async update(req: Request, res: Response) {
        const id = req.params.id as string;
        const deal = await dealsService.update(id, req.body, req.user!);
        res.json({ success: true, data: deal });
    },

    async updateStage(req: Request, res: Response) {
        const id = req.params.id as string;
        const stageId = req.body.stageId as string;
        const deal = await dealsService.updateStage(id, stageId, req.user!);
        res.json({ success: true, data: deal });
    },

    async changeFunnel(req: Request, res: Response) {
        const id = req.params.id as string;
        const funnelId = req.body.funnelId as string;
        try {
            const deal = await dealsService.changeFunnel(id, funnelId, req.user!);
            res.json({ success: true, data: deal });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    async getNotes(req: Request, res: Response) {
        const id = req.params.id as string;
        try {
            const notes = await dealsService.getNotes(id, req.user!);
            res.json({ success: true, data: notes });
        } catch (error: any) {
            res.status(404).json({ success: false, error: error.message });
        }
    },

    async addNote(req: Request, res: Response) {
        const id = req.params.id as string;
        try {
            const note = await dealsService.addNote(id, req.body, req.user!);
            res.status(201).json({ success: true, data: note });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id as string;
        await dealsService.delete(id, req.user!);
        res.json({ success: true, message: "Negócio deletado com sucesso" });
    },

    // ═══ File CRUD ═══
    async listFiles(req: Request, res: Response) {
        const dealId = req.params.id as string;
        const files = await prisma.dealFile.findMany({
            where: { dealId },
            orderBy: { createdAt: "desc" },
            select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true },
        });
        res.json({ success: true, data: files });
    },

    async uploadFile(req: Request, res: Response) {
        const dealId = req.params.id as string;
        const file = (req as any).file;
        if (!file) {
            res.status(400).json({ success: false, error: "Nenhum arquivo enviado" });
            return;
        }
        const record = await prisma.dealFile.create({
            data: {
                dealId,
                userId: req.user!.userId,
                originalName: file.originalname,
                storedName: file.filename,
                mimeType: file.mimetype,
                size: file.size,
            },
            select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true },
        });
        res.status(201).json({ success: true, data: record });
    },

    async deleteFile(req: Request, res: Response) {
        const fileId = req.params.fileId as string;
        const file = await prisma.dealFile.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ success: false, error: "Arquivo não encontrado" });
            return;
        }
        // Delete physical file
        const filePath = path.join(uploadsDir, file.storedName);
        try { fs.unlinkSync(filePath); } catch { }
        await prisma.dealFile.delete({ where: { id: fileId } });
        res.json({ success: true, message: "Arquivo excluído" });
    },

    async downloadFile(req: Request, res: Response) {
        const fileId = req.params.fileId as string;
        const file = await prisma.dealFile.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ success: false, error: "Arquivo não encontrado" });
            return;
        }
        const filePath = path.join(uploadsDir, file.storedName);
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, error: "Arquivo físico não encontrado" });
            return;
        }
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`);
        res.setHeader("Content-Type", file.mimeType);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    },
};
