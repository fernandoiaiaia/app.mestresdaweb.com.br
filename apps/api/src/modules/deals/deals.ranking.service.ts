import { prisma } from "../../config/database.js";

export interface ProductsRankingResult {
    rankingData: Array<{ product: string; vendas: number; revenue: number; ticket: number }>;
    shareData: Array<{ name: string; value: number; color: string }>;
    ticketData: Array<{ product: string; ticket: number }>;
}

const SHARE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#ef4444", "#64748b"];

export const dealsRankingService = {
    async getProductsRanking(payload: { userId: string }): Promise<ProductsRankingResult> {
        const { userId } = payload;
        
        // Fetch all won deals dynamically to rank funnels
        const closedDeals = await prisma.deal.findMany({
            where: {
                userId,
                status: "won",
            },
            include: {
                funnel: { select: { name: true } }
            }
        });

        // Grouping variables
        const statsMap = new Map<string, { vendas: number; revenue: number }>();
        let overallRevenue = 0;

        for (const deal of closedDeals) {
            const fName = deal.funnel?.name || "Outros";
            const dVal = deal.value || 0;
            
            if (!statsMap.has(fName)) {
                statsMap.set(fName, { vendas: 0, revenue: 0 });
            }
            
            const stats = statsMap.get(fName)!;
            stats.vendas += 1;
            stats.revenue += dVal;

            overallRevenue += dVal;
        }

        // Prepare rankingData (sort descending by revenue)
        const rankingRaw = Array.from(statsMap.entries()).map(([product, stats]) => {
            return {
                product,
                vendas: stats.vendas,
                revenue: stats.revenue,
                ticket: stats.vendas > 0 ? stats.revenue / stats.vendas : 0
            };
        }).sort((a, b) => b.revenue - a.revenue);

        // Prepare ticketData (sort descending by ticket)
        const ticketData = [...rankingRaw].sort((a, b) => b.ticket - a.ticket).map(item => ({
            product: item.product.length > 15 ? item.product.substring(0, 15) + "..." : item.product,
            ticket: item.ticket
        })).slice(0, 8); // Display Top 8 tickets securely

        // Prepare shareData (percentages of total revenue)
        const totalValidRev = overallRevenue > 0 ? overallRevenue : 1;
        const shareData = rankingRaw.map((item, index) => ({
            name: item.product.length > 15 ? item.product.substring(0, 15) + "..." : item.product,
            value: Number(((item.revenue / totalValidRev) * 100).toFixed(1)),
            color: SHARE_COLORS[index % SHARE_COLORS.length]
        })).filter(item => item.value > 0);

        return {
            rankingData,
            shareData,
            ticketData
        };
    }
};
