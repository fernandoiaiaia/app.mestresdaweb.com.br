import { prisma } from "../../config/database.js";
import { endOfMonth, startOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Custom type for explicit returned stats payload
export interface DashboardStatsResult {
    stats: {
        emAndamento: number;
        aguardando: number;
        enviadas: number;
        aprovadas: number;
        recusadas: number;
        pipeline: number;
        expiradas: number;
    };
    proposals: Array<{
        id: string;
        client: string;
        title: string;
        status: string;
        value: string;
        numValue: number;
        date: string;
        consultant: string;
        expired: boolean;
    }>;
    consultantRanking: Array<{
        name: string;
        proposals: number;
        approved: number;
        conversion: number;
        revenue: number;
        avatar: string;
        trend: "up" | "down";
    }>;
    pieData: Array<{ name: string; value: number; color: string }>;
    chartData: Array<{ name: string; enviadas: number; aprovadas: number }>;
}

export const dealsDashboardService = {
    async getDashboardStats(payload: {
        userId: string;
        consultantId?: string; // Limit to specific consultant if defined
        isManager: boolean;
    }): Promise<DashboardStatsResult> {
        const { userId, consultantId, isManager } = payload;
        const now = new Date();

        // 1. Base Query filter (Managers see everything in the account, Sellers see only their deals)
        const baseWhere = {
            userId,
            ...(isManager && consultantId && consultantId !== "all" ? { consultantId } : {}),
            ...(!isManager && consultantId ? { consultantId } : {}),
        };

        // 2. Fetch all raw active and recently completed deals (Limit query to last 12 months for scale constraint)
        const twelveMonthsAgo = subMonths(now, 12);
        
        const allDeals = await prisma.deal.findMany({
            where: {
                ...baseWhere,
                createdAt: { gte: twelveMonthsAgo }
            },
            include: {
                client: { select: { name: true } },
                stage: { select: { name: true } },
                consultant: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // 3. Compute mapped statuses
        let emAndamento = 0, aguardando = 0, enviadas = 0, aprovadas = 0, recusadas = 0, expiradas = 0, pipeline = 0;
        
        const mappedDeals = allDeals.map((deal) => {
            const stageLower = deal.stage.name.toLowerCase();
            let uiStatus = "Em Andamento";
            
            // Map status
            if (deal.status === "won") {
                uiStatus = "Aprovada";
                aprovadas++;
            } else if (deal.status === "lost") {
                uiStatus = "Recusada";
                recusadas++;
            } else {
                pipeline += deal.value || 0;
                // Try inferring open status from stage nomenclature
                if (stageLower.includes("enviad") || stageLower.includes("apresentad")) {
                    uiStatus = "Enviada";
                    enviadas++;
                } else if (stageLower.includes("aguard") || stageLower.includes("aprova")) {
                    uiStatus = "Aguardando Aprovação";
                    aguardando++;
                } else {
                    uiStatus = "Em Andamento";
                    emAndamento++;
                }
                
                // Expiradas
                if (deal.expectedClose && deal.expectedClose < now) {
                    expiradas++;
                }
            }

            return {
                id: deal.id,
                client: deal.client.name,
                title: deal.title,
                status: uiStatus,
                value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(deal.value || 0),
                numValue: deal.value || 0,
                date: format(deal.createdAt, "dd MMM yyyy", { locale: ptBR }),
                consultant: deal.consultant?.name || "Sem Responsável",
                expired: deal.status === "open" && deal.expectedClose ? deal.expectedClose < now : false,
                rawDate: deal.createdAt, // used for ranking/charts
                rawStatus: deal.status
            };
        });

        // 4. Consultant Ranking
        const consultantMap = new Map();
        for (const deal of mappedDeals) {
            const name = deal.consultant;
            if (!consultantMap.has(name)) {
                consultantMap.set(name, { proposals: 0, approved: 0, revenue: 0 });
            }
            const cstat = consultantMap.get(name);
            cstat.proposals++;
            if (deal.rawStatus === "won") {
                cstat.approved++;
                cstat.revenue += deal.numValue;
            }
        }
        
        const consultantRanking = Array.from(consultantMap.entries()).map(([name, stats]) => {
            const initial = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
            return {
                name,
                proposals: stats.proposals,
                approved: stats.approved,
                conversion: stats.proposals > 0 ? Math.round((stats.approved / stats.proposals) * 100) : 0,
                revenue: stats.revenue,
                avatar: initial,
                trend: "up" as "up" | "down", // Can be calculated based on previous month, forcing up for MVP
            };
        }).sort((a, b) => b.revenue - a.revenue); // sort by revenue

        // 5. Pie chart Data
        const pieData = [
            { name: "Aprovadas", value: aprovadas, color: "#22c55e" },
            { name: "Enviadas", value: enviadas, color: "#3b82f6" },
            { name: "Em Andamento", value: emAndamento, color: "#64748b" },
            { name: "Aguardando", value: aguardando, color: "#f59e0b" },
            { name: "Recusadas", value: recusadas, color: "#ef4444" },
        ].filter(p => p.value > 0); // Omit empty slices

        // 6. Chart Data (Last 6 Months)
        const chartDataMap = new Map<string, { enviadas: number, aprovadas: number }>();
        for (let i = 5; i >= 0; i--) {
            const targetDate = subMonths(now, i);
            const monthLabel = format(targetDate, "MMM", { locale: ptBR });
            // capitalize first letter
            const label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
            chartDataMap.set(label, { enviadas: 0, aprovadas: 0 });
        }
        
        for (const deal of mappedDeals) {
            // only interested in last 6 months
            const diffMonths = (now.getFullYear() - deal.rawDate.getFullYear()) * 12 + (now.getMonth() - deal.rawDate.getMonth());
            if (diffMonths >= 0 && diffMonths <= 5) {
                const monthLabel = format(deal.rawDate, "MMM", { locale: ptBR });
                const label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
                
                if (chartDataMap.has(label)) {
                    const row = chartDataMap.get(label)!;
                    if (deal.rawStatus === "won") {
                        row.aprovadas++;
                    }
                    // Em envios (Considerando tudo que foi criado no mês e não foi perdido para representar funil ou podemos considerar open)
                    // Para o chart de enviados x aprovados
                    // Consideraremos enviadas qualquer proposta (tentativa) e aprovadas (ganhas)
                    row.enviadas++; 
                }
            }
        }
        
        const chartData = Array.from(chartDataMap.entries()).map(([name, data]) => ({
            name,
            enviadas: data.enviadas,
            aprovadas: data.aprovadas
        }));

        return {
            stats: {
                emAndamento,
                aguardando,
                enviadas,
                aprovadas,
                recusadas,
                pipeline,
                expiradas
            },
            proposals: mappedDeals.map(({ rawDate, rawStatus, ...rest }) => rest).slice(0, 15), // top 15 recent
            consultantRanking,
            pieData,
            chartData
        };
    }
};
