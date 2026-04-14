import { prisma } from "../../config/database.js";
import { format, subMonths, isSameMonth, isAfter, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface RevenueForecastResult {
    metrics: {
        receitaTotal: number;
        forecastMesAtual: number;
        receitaMediaMes: number;
        crescimentoMoM: number;
    };
    revenueData: Array<{ month: string; realizado: number; forecast: number }>;
    cumulativeData: Array<{ month: string; acumulado: number; meta: number }>;
    bySegment: Array<{ segment: string; valor: number }>;
}

export const dealsRevenueService = {
    async getRevenueForecast(payload: { userId: string }): Promise<RevenueForecastResult> {
        const { userId } = payload;
        const now = new Date();
        const numMonthsToLookBack = 6;
        const cutoffDate = startOfMonth(subMonths(now, numMonthsToLookBack));

        // 1. Fetch won and currently open deals for metrics
        const relevantDeals = await prisma.deal.findMany({
            where: {
                userId,
                OR: [
                    { status: "won" },
                    { status: "open", expectedClose: { gte: startOfMonth(now) } }
                ]
            },
            include: {
                client: { select: { segment: true } }
            }
        });

        const monthsOrder: string[] = [];
        for (let i = numMonthsToLookBack; i >= 0; i--) {
            const d = subMonths(now, i);
            const rawLabel = format(d, "MMM", { locale: ptBR });
            monthsOrder.push(rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1));
        }

        // Initialize maps
        const revenueMap = new Map<string, { realizado: number; forecast: number }>();
        const cumulativeMap = new Map<string, { acumulado: number; meta: number }>();
        monthsOrder.forEach(m => {
            revenueMap.set(m, { realizado: 0, forecast: 0 });
            cumulativeMap.set(m, { acumulado: 0, meta: 0 });
        });

        const segmentMap = new Map<string, number>();

        let currentMonthPipelineWeighted = 0;
        let lastMonthRevenue = 0;
        let currentMonthRevenue = 0;
        let totalRevenueSum = 0;
        let totalMonthsWithRevenue = 0; // for true average

        const currentMonthLabel = monthsOrder[monthsOrder.length - 1];
        const lastMonthLabel = monthsOrder[monthsOrder.length - 2];

        // Ensure we calculate cumulative strictly by date order
        const timeSeriesWins = [];

        for (const deal of relevantDeals) {
            const amt = deal.value || 0;

            if (deal.status === "won") {
                timeSeriesWins.push({ date: deal.updatedAt, amount: amt });
                
                // Segments
                const seg = deal.client?.segment || "Outros";
                segmentMap.set(seg, (segmentMap.get(seg) || 0) + amt);

                const mLabelRaw = format(deal.updatedAt, "MMM", { locale: ptBR });
                const mLabel = mLabelRaw.charAt(0).toUpperCase() + mLabelRaw.slice(1);

                if (revenueMap.has(mLabel)) {
                    revenueMap.get(mLabel)!.realizado += amt;
                    totalRevenueSum += amt;
                }

                if (mLabel === currentMonthLabel) {
                    currentMonthRevenue += amt;
                }
                if (mLabel === lastMonthLabel) {
                    lastMonthRevenue += amt;
                }

            } else if (deal.status === "open" && deal.expectedClose && isSameMonth(deal.expectedClose, now)) {
                // Future open deals in this month -> Weighted pipeline for forecast
                const probability = deal.probability || 0;
                currentMonthPipelineWeighted += amt * (probability / 100);
            }
        }

        // Compute metrics logic linearly
        let rollingCumulative = 0;
        let metaBaseline = 0;

        monthsOrder.forEach((mLabel, i) => {
            const rev = revenueMap.get(mLabel)!;
            const cumula = cumulativeMap.get(mLabel)!;
            
            // Forecast algorithm: previous months = realized * 1.15 mock goals. 
            // Current month = realized + weighted current pipeline.
            if (i < monthsOrder.length - 1) {
                rev.forecast = Math.round(rev.realizado * 1.15); 
            } else {
                rev.forecast = rev.realizado + currentMonthPipelineWeighted;
                if (rev.forecast < rev.realizado) rev.forecast = Math.round(rev.realizado * 1.15); // Baseline projection buffer
            }

            // Cumulative Algorithm
            rollingCumulative += rev.realizado;
            metaBaseline += rev.forecast;
            
            cumula.acumulado = rollingCumulative;
            cumula.meta = metaBaseline;
            
            if (rev.realizado > 0) totalMonthsWithRevenue++;
        });

        // KPI calculations
        const avgRev = totalMonthsWithRevenue > 0 ? (totalRevenueSum / totalMonthsWithRevenue) : 0;
        let momGrowth = 0;
        if (lastMonthRevenue > 0) {
            momGrowth = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
        } else if (currentMonthRevenue > 0) {
            momGrowth = 100;
        }

        const bySegmentArray = Array.from(segmentMap.entries()).map(([segment, valor]) => ({ segment, valor }));

        return {
            metrics: {
                receitaTotal: totalRevenueSum,
                forecastMesAtual: currentMonthRevenue + currentMonthPipelineWeighted,
                receitaMediaMes: Math.round(avgRev),
                crescimentoMoM: Math.round(momGrowth)
            },
            revenueData: monthsOrder.map(m => ({ month: m, ...revenueMap.get(m)! })),
            cumulativeData: monthsOrder.map(m => ({ month: m, ...cumulativeMap.get(m)! })),
            bySegment: bySegmentArray.sort((a, b) => b.valor - a.valor)
        };
    }
};
