import { prisma } from "../../config/database.js";
import { subDays, differenceInDays } from "date-fns";

export interface ClientsPortfolioResult {
    metrics: {
        totalClientes: number;
        ativos: number;
        novos: number;
        inativos: number;
    };
    bySegment: Array<{ name: string; value: number; color: string }>;
    bySource: Array<{ source: string; clientes: number }>;
    byValue: Array<{ faixa: string; clientes: number }>;
    topClients: Array<{ name: string; segment: string; proposals: number; revenue: string; lastContact: string }>;
}

const SEGMENT_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#ec4899", "#64748b"];

export const dealsPortfolioService = {
    async getPortfolio(payload: { userId: string }): Promise<ClientsPortfolioResult> {
        const { userId } = payload;
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);

        const clients = await prisma.client.findMany({
            where: { userId },
            include: {
                _count: { select: { proposals: true } }
            }
        });

        let totais = 0;
        let ativos = 0;
        let inativos = 0;
        let novos = 0;

        const segmentMap = new Map<string, number>();
        const sourceMap = new Map<string, number>();
        
        let valueTiers = {
            "Até R$10k": 0,
            "R$10k-50k": 0,
            "R$50k-100k": 0,
            "R$100k+": 0
        };

        for (const c of clients) {
            // Metrics
            totais++;
            if (c.status === "inactive") inativos++;
            else ativos++;

            if (c.createdAt >= thirtyDaysAgo) novos++;

            // Sources
            const src = c.source || "Desconhecido";
            sourceMap.set(src, (sourceMap.get(src) || 0) + 1);

            // Segments
            const seg = c.segment || "Outros";
            segmentMap.set(seg, (segmentMap.get(seg) || 0) + 1);

            // Value Brackets
            const rev = c.totalRevenue || 0;
            if (rev <= 10000) valueTiers["Até R$10k"]++;
            else if (rev <= 50000) valueTiers["R$10k-50k"]++;
            else if (rev <= 100000) valueTiers["R$50k-100k"]++;
            else valueTiers["R$100k+"]++;
        }

        // Prepare bySegment as percentages
        const bySegmentRaw = Array.from(segmentMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const validClientsCount = bySegmentRaw.reduce((sum, item) => sum + item.count, 0) || 1;
        const bySegment = bySegmentRaw.map((item, index) => ({
            name: item.name,
            value: Number(((item.count / validClientsCount) * 100).toFixed(1)),
            color: SEGMENT_COLORS[index % SEGMENT_COLORS.length]
        }));

        // Prepare bySource
        const bySource = Array.from(sourceMap.entries())
            .map(([source, clientes]) => ({ source, clientes }))
            .sort((a, b) => b.clientes - a.clientes)
            .slice(0, 8); // top 8 sources

        // Prepare byValue array
        const byValue = [
            { faixa: "Até R$10k", clientes: valueTiers["Até R$10k"] },
            { faixa: "R$10k-50k", clientes: valueTiers["R$10k-50k"] },
            { faixa: "R$50k-100k", clientes: valueTiers["R$50k-100k"] },
            { faixa: "R$100k+", clientes: valueTiers["R$100k+"] }
        ];

        // Format and sort Top Clients
        const topClientsRaw = [...clients].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)).slice(0, 5);
        const topClients = topClientsRaw.map(c => {
            const rev = c.totalRevenue || 0;
            const revFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(rev);
            
            let lastContactStr = "-";
            if (c.lastContact) {
                const diff = differenceInDays(now, c.lastContact);
                if (diff === 0) lastContactStr = "Hoje";
                else if (diff === 1) lastContactStr = "Ontem";
                else lastContactStr = `${diff} dias`;
            }

            return {
                name: c.name,
                segment: c.segment || "Outros",
                proposals: c._count.proposals,
                revenue: revFmt,
                lastContact: lastContactStr
            };
        });

        return {
            metrics: {
                totalClientes: totais,
                ativos,
                novos,
                inativos
            },
            bySegment,
            bySource,
            byValue,
            topClients
        };
    }
};
