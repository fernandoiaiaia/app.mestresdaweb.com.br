import { prisma } from "../../config/database.js";
import { format, subMonths, differenceInDays, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface SalesCycleResult {
    metrics: {
        cicloMedioAtual: number;
        melhorMes: { month: string; dias: number };
        piorMes: { month: string; dias: number };
        reducao: number;
    };
    cycleData: Array<{ month: string; dias: number }>;
    bySegment: Array<{ segment: string; dias: number }>;
    byFunnel: Array<{ product: string; dias: number }>;
}

export const dealsCycleService = {
    async getSalesCycle(payload: { userId: string }): Promise<SalesCycleResult> {
        const { userId } = payload;
        const now = new Date();
        const numMonthsToLookBack = 6;
        const cutoffDate = startOfMonth(subMonths(now, numMonthsToLookBack));

        // Only "won" deals are closed, meaning their cycle is complete
        const closedDeals = await prisma.deal.findMany({
            where: {
                userId,
                status: "won",
                updatedAt: { gte: cutoffDate }
            },
            include: {
                client: { select: { segment: true } },
                funnel: { select: { name: true } }
            }
        });

        const monthsOrder: string[] = [];
        for (let i = numMonthsToLookBack; i >= 0; i--) {
            const d = subMonths(now, i);
            const rawLabel = format(d, "MMM", { locale: ptBR });
            monthsOrder.push(rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1));
        }

        const monthlyStats = new Map<string, { totalDays: number; count: number }>();
        monthsOrder.forEach(m => monthlyStats.set(m, { totalDays: 0, count: 0 }));

        const segmentStats = new Map<string, { totalDays: number; count: number }>();
        const funnelStats = new Map<string, { totalDays: number; count: number }>();

        let overallDays = 0;
        let overallCount = 0;

        for (const deal of closedDeals) {
            // Delta in days from lead created to deal won
            const daysToClose = Math.max(1, differenceInDays(deal.updatedAt, deal.createdAt));

            const mLabelRaw = format(deal.updatedAt, "MMM", { locale: ptBR });
            const mLabel = mLabelRaw.charAt(0).toUpperCase() + mLabelRaw.slice(1);

            if (monthlyStats.has(mLabel)) {
                const stat = monthlyStats.get(mLabel)!;
                stat.totalDays += daysToClose;
                stat.count += 1;
            }

            overallDays += daysToClose;
            overallCount += 1;

            const segmentName = deal.client?.segment || "Outros";
            if (!segmentStats.has(segmentName)) segmentStats.set(segmentName, { totalDays: 0, count: 0 });
            const segStat = segmentStats.get(segmentName)!;
            segStat.totalDays += daysToClose;
            segStat.count += 1;

            const funnelName = deal.funnel?.name || "Desconhecido";
            if (!funnelStats.has(funnelName)) funnelStats.set(funnelName, { totalDays: 0, count: 0 });
            const funStat = funnelStats.get(funnelName)!;
            funStat.totalDays += daysToClose;
            funStat.count += 1;
        }

        const cycleData = monthsOrder.map(m => {
            const stat = monthlyStats.get(m)!;
            return {
                month: m,
                dias: stat.count > 0 ? Math.round(stat.totalDays / stat.count) : 0
            };
        });

        const activeMonths = cycleData.filter(c => c.dias > 0);
        
        let melhorMes = { month: "-", dias: 0 };
        let piorMes = { month: "-", dias: 0 };
        let reducao = 0;

        if (activeMonths.length > 0) {
            melhorMes = activeMonths.reduce((prev, curr) => (prev.dias < curr.dias ? prev : curr));
            piorMes = activeMonths.reduce((prev, curr) => (prev.dias > curr.dias ? prev : curr));
            
            const firstActive = activeMonths[0].dias;
            const lastActive = activeMonths[activeMonths.length - 1].dias;
            if (firstActive > 0) {
                // negative means reduction in cycle (good thing!)
                reducao = Math.round(((lastActive - firstActive) / firstActive) * 100);
            }
        }

        const bySegment = Array.from(segmentStats.entries())
            .map(([segment, stats]) => ({
                segment,
                dias: Math.round(stats.totalDays / stats.count)
            }))
            .sort((a, b) => b.dias - a.dias); // Descending

        const byFunnel = Array.from(funnelStats.entries())
            .map(([product, stats]) => ({
                product,
                dias: Math.round(stats.totalDays / stats.count)
            }))
            .sort((a, b) => b.dias - a.dias);

        return {
            metrics: {
                cicloMedioAtual: overallCount > 0 ? Math.round(overallDays / overallCount) : 0,
                melhorMes,
                piorMes,
                reducao
            },
            cycleData,
            bySegment,
            byFunnel
        };
    }
};
