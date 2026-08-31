import { Request, Response } from "express";
import { BRAZIL_UTC_OFFSET_MS, reportsService } from "./reports.service.js";

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
    },

    /**
     * Entrada de leads por fonte. Aceita `days` (7, 15, 30…) para as janelas rápidas ou
     * `startDate`/`endDate` para período personalizado; sem parâmetro nenhum, 30 dias.
     */
    async getLeadsBySource(req: Request, res: Response) {
        try {
            const { startDate, endDate } = _resolveDateRange(req.query);
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: "Período inválido. Informe 'days' ou 'startDate' e 'endDate' em datas válidas.",
                });
            }
            if (startDate > endDate) {
                return res.status(400).json({
                    success: false,
                    message: "A data inicial não pode ser posterior à data final.",
                });
            }

            const data = await reportsService.getLeadsBySource(startDate, endDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error("Leads by source error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
};

/**
 * Traduz os filtros de período aceitos pelo relatório num intervalo fechado.
 *
 * As janelas rápidas terminam agora e incluem o dia corrente — "últimos 7 dias" com o
 * dia de hoje truncado deixaria de fora justamente os leads recém-chegados, que são os
 * que a equipe abre o relatório para ver. O período personalizado, ao contrário, vem em
 * datas puras e é esticado até o fim do dia final para não cortar o próprio dia escolhido.
 */
function _resolveDateRange(query: Request["query"]): { startDate: Date | null; endDate: Date | null } {
    const rawStart = query.startDate as string | undefined;
    const rawEnd = query.endDate as string | undefined;

    if (rawStart && rawEnd) {
        const isPlainDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

        // O seletor manda datas puras ("2026-08-30"), que o Date lê como meia-noite UTC —
        // ou seja, 21h do dia anterior no Brasil. Sem deslocar, escolher um único dia
        // devolvia dois dias na série e incluía leads da véspera.
        const startDate = isPlainDate(rawStart)
            ? new Date(Date.parse(`${rawStart}T00:00:00.000Z`) + BRAZIL_UTC_OFFSET_MS)
            : new Date(rawStart);
        const endDate = isPlainDate(rawEnd)
            ? new Date(Date.parse(`${rawEnd}T00:00:00.000Z`) + BRAZIL_UTC_OFFSET_MS + 86_400_000 - 1)
            : new Date(rawEnd);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return { startDate: null, endDate: null };
        }
        return { startDate, endDate };
    }

    const days = Number.parseInt(query.days as string, 10);
    const window = Number.isFinite(days) && days > 0 ? Math.min(days, 366) : 30;

    // "Últimos 7 dias" são 7 dias civis contando hoje, não 168 horas para trás — senão o
    // gráfico ganha uma oitava barra cobrindo só um pedaço do dia mais antigo, que aparece
    // artificialmente fraca ao lado das outras.
    const endDate = new Date();
    const startOfTodayBr = Date.parse(
        `${new Date(Date.now() - BRAZIL_UTC_OFFSET_MS).toISOString().slice(0, 10)}T00:00:00.000Z`,
    ) + BRAZIL_UTC_OFFSET_MS;
    const startDate = new Date(startOfTodayBr - (window - 1) * 86_400_000);
    return { startDate, endDate };
}
