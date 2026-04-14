import { prisma } from "../../config/database.js";
import { format, subMonths, differenceInDays, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface TeamPerformanceResult {
    metrics: {
        totalAdvisors: number;
        mediaConversao: number;
        receitaTotalEquipe: string;
        cicloMedioEquipe: number;
    };
    consultants: Array<{ name: string; proposals: number; approved: number; revenue: number; conversion: number; avgCycle: number; trend: "up" | "down" }>;
    monthlyByConsultant: Array<Record<string, string | number>>;
    activeConsultantsNames: string[];
}

export const dealsTeamService = {
    async getTeamPerformance(payload: { userId: string }): Promise<TeamPerformanceResult> {
        const { userId } = payload;
        const now = new Date();

        // 1. Fetch all deals that have a consultant assigned
        const teamDeals = await prisma.deal.findMany({
            where: {
                userId,
                consultantId: { not: null }
            },
            include: {
                consultant: { select: { id: true, name: true } }
            }
        });

        // Metrics aggregation variables
        const consultantMap = new Map<string, { id: string; name: string; proposals: number; approved: number; revenue: number; totalCycleDays: number; closedCycles: number; thisMonthRevenue: number; lastMonthRevenue: number }>();
        
        let globalProposals = 0;
        let globalApproved = 0;
        let globalRevenue = 0;
        let globalCycleDays = 0;
        let globalClosedCycles = 0;

        const thisMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));

        for (const d of teamDeals) {
            const cid = d.consultant!.id;
            const cName = d.consultant!.name || "Advisor Oculto";
            
            if (!consultantMap.has(cid)) {
                consultantMap.set(cid, { id: cid, name: cName, proposals: 0, approved: 0, revenue: 0, totalCycleDays: 0, closedCycles: 0, thisMonthRevenue: 0, lastMonthRevenue: 0 });
            }
            
            const stats = consultantMap.get(cid)!;

            // Base tracking
            stats.proposals++;
            globalProposals++;

            // Check Wins
            if (d.status === "won") {
                stats.approved++;
                stats.revenue += (d.value || 0);
                
                globalApproved++;
                globalRevenue += (d.value || 0);

                // Cycle
                const cycle = differenceInDays(d.updatedAt, d.createdAt);
                const safeCycle = cycle > 0 ? cycle : 0;
                stats.totalCycleDays += safeCycle;
                stats.closedCycles++;
                globalCycleDays += safeCycle;
                globalClosedCycles++;

                // Revenue Trend Map
                if (d.updatedAt >= thisMonthStart) {
                    stats.thisMonthRevenue += (d.value || 0);
                } else if (d.updatedAt >= lastMonthStart && d.updatedAt < thisMonthStart) {
                    stats.lastMonthRevenue += (d.value || 0);
                }
            }
        }

        // Generate Detailed Consultant Profile
        const consultants = Array.from(consultantMap.values()).map(c => {
            const conversion = c.proposals > 0 ? Math.round((c.approved / c.proposals) * 100) : 0;
            const avgCycle = c.closedCycles > 0 ? Math.round(c.totalCycleDays / c.closedCycles) : 0;
            const trend = c.thisMonthRevenue >= c.lastMonthRevenue ? "up" : "down";

            return {
                name: c.name,
                proposals: c.proposals,
                approved: c.approved,
                conversion,
                revenue: c.revenue,
                avgCycle,
                trend: trend as "up" | "down"
            };
        }).sort((a, b) => b.revenue - a.revenue);

        // Keep Top 5 names for the chart to avoid overcrowding
        const top5Advisors = consultants.slice(0, 5).map(c => c.name);
        
        // Build Monthly Timeline for Top 5
        const monthsPivot = 3;
        const monthlyByConsultant = [];
        
        for (let i = monthsPivot - 1; i >= 0; i--) {
            const mDate = subMonths(now, i);
            const mDateStart = startOfMonth(mDate);
            const rawLabel = format(mDate, "MMM", { locale: ptBR });
            const mLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
            
            // Build Row
            const row: Record<string, string | number> = { month: mLabel };
            top5Advisors.forEach(a => row[a] = 0);

            // Filter won deals in this month for exactly those consultants
            teamDeals.forEach(d => {
                if (d.status === "won" && d.consultant?.name) {
                    if (top5Advisors.includes(d.consultant.name)) {
                        const dealMonthStart = startOfMonth(d.updatedAt);
                        if (dealMonthStart.getTime() === mDateStart.getTime()) {
                            row[d.consultant.name] = (row[d.consultant.name] as number) + 1;
                        }
                    }
                }
            });

            monthlyByConsultant.push(row);
        }

        const globalConversao = globalProposals > 0 ? Math.round((globalApproved / globalProposals) * 100) : 0;
        const fmtValue = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(globalRevenue);
        const globalCycle = globalClosedCycles > 0 ? Math.round(globalCycleDays / globalClosedCycles) : 0;

        return {
            metrics: {
                totalAdvisors: consultantMap.size,
                mediaConversao: globalConversao,
                receitaTotalEquipe: fmtValue,
                cicloMedioEquipe: globalCycle
            },
            consultants,
            monthlyByConsultant,
            activeConsultantsNames: top5Advisors
        };
    }
};
