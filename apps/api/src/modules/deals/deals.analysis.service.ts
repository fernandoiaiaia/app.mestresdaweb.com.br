import { prisma } from "../../config/database.js";
import { subDays, differenceInDays } from "date-fns";

export interface PipelineAnalysisResult {
    metrics: {
        totalPipeline: number;
        totalValue: string;
        avgDays: number;
        stagnatedCount: number;
        funnelRate: number;
    };
    funnelData: Array<{
        name: string;
        value: number;
        fill: string;
    }>;
    stageTimeData: Array<{
        stage: string;
        dias: number;
    }>;
    stagnatedDeals: Array<{
        id: string;
        name: string;
        stage: string;
        days: number;
        value: string;
        consultant: string;
    }>;
}

export const dealsAnalysisService = {
    async getPipelineAnalysis(payload: { userId: string }): Promise<PipelineAnalysisResult> {
        const { userId } = payload;
        const now = new Date();

        // Fetches all open deals to do accurate pipeline calculations
        const openDeals = await prisma.deal.findMany({
            where: {
                userId,
                status: "open",
            },
            include: {
                stage: { select: { id: true, name: true, color: true, orderIndex: true } },
                consultant: { select: { name: true } },
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        // Fetches ALL deals to compute Funnel Rate (win rate)
        const allDealsCount = await prisma.deal.count({ where: { userId } });
        const wonDealsCount = await prisma.deal.count({ where: { userId, status: "won" } });
        const funnelRate = allDealsCount > 0 ? Math.round((wonDealsCount / allDealsCount) * 100) : 0;

        // Metrics calculations
        let totalPipeline = openDeals.length;
        let numTotalValue = 0;
        let totalActiveDays = 0;
        
        // Stage metrics grouping
        const stageMap = new Map<string, { name: string; color: string; order: number; count: number; totalDaysInStage: number }>();

        // Stagnated check (> 7 days in current stage)
        const stagnatedThreshold = subDays(now, 7);
        const stagnatedDealsRaw = [];

        for (const deal of openDeals) {
            numTotalValue += deal.value || 0;
            totalActiveDays += differenceInDays(now, deal.createdAt);

            // Mapping stage data
            if (deal.stage) {
                if (!stageMap.has(deal.stage.id)) {
                    stageMap.set(deal.stage.id, {
                        name: deal.stage.name,
                        color: deal.stage.color || "#3b82f6",
                        order: deal.stage.orderIndex,
                        count: 0,
                        totalDaysInStage: 0
                    });
                }
                const sMap = stageMap.get(deal.stage.id)!;
                sMap.count += 1;
                
                const daysInCurrentStage = differenceInDays(now, deal.stageEnteredAt);
                sMap.totalDaysInStage += daysInCurrentStage;

                // Check stagnation
                if (deal.stageEnteredAt < stagnatedThreshold) {
                    stagnatedDealsRaw.push({
                        id: deal.id,
                        name: deal.title,
                        stage: deal.stage.name,
                        days: daysInCurrentStage,
                        valueNum: deal.value || 0,
                        consultant: deal.consultant?.name || "Sem Responsável",
                        stageEnteredAt: deal.stageEnteredAt
                    });
                }
            }
        }

        const avgDays = totalPipeline > 0 ? Math.round(totalActiveDays / totalPipeline) : 0;
        const totalValue = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numTotalValue);

        // Sort Stagnated Deals (Most days first) 
        stagnatedDealsRaw.sort((a, b) => b.days - a.days);
        
        const stagnatedDeals = stagnatedDealsRaw.map(d => ({
            id: d.id,
            name: d.name,
            stage: d.stage,
            days: d.days,
            value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(d.valueNum),
            consultant: d.consultant
        }));

        // Build arrays and sort by Order Index
        const stagesArray = Array.from(stageMap.values()).sort((a, b) => a.order - b.order);

        const funnelData = stagesArray.map(s => ({
            name: s.name,
            value: s.count,
            fill: s.color.startsWith("#") ? s.color : `#${s.color.replace(/[^0-9a-f]/gi, '6')}` // Fallback if color is textual
        }));

        const stageTimeData = stagesArray.map(s => ({
            stage: s.name,
            dias: s.count > 0 ? Math.round(s.totalDaysInStage / s.count) : 0
        }));

        return {
            metrics: {
                totalPipeline,
                totalValue,
                avgDays,
                stagnatedCount: stagnatedDeals.length,
                funnelRate
            },
            funnelData,
            stageTimeData,
            stagnatedDeals: stagnatedDeals.slice(0, 50) // Paginate or limit to 50
        };
    }
};
