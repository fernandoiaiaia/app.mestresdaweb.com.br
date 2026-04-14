import { prisma } from "../../config/database.js";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface LossAnalysisResult {
    metrics: {
        totalPerdidas: number;
        valorPerdido: string;
        principalMotivo: string;
        taxaDePerda: number;
    };
    reasons: Array<{ name: string; value: number; color: string }>;
    objections: Array<{ objection: string; count: number }>;
    lostByMonth: Array<{ month: string; perdas: number }>;
}

const REASONS_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#14b8a6", "#ec4899", "#64748b"];

export const dealsLossService = {
    async getLossAnalysis(payload: { userId: string }): Promise<LossAnalysisResult> {
        const { userId } = payload;
        const now = new Date();
        const numMonthsToLookBack = 6;
        const cutoffDate = startOfMonth(subMonths(now, numMonthsToLookBack));

        // Get total won vs total lost for Win Rate / Loss Rate calculations
        const allDealsCounts = await prisma.deal.groupBy({
            by: ['status'],
            where: { userId },
            _count: true
        });

        const totalWon = allDealsCounts.find(d => d.status === "won")?._count || 0;
        const totalLost = allDealsCounts.find(d => d.status === "lost")?._count || 0;
        const globalTax = (totalWon + totalLost) > 0 ? ((totalLost / (totalWon + totalLost)) * 100) : 0;

        // Fetch lost deals from the last 6 months for chronology and details
        const lostDeals = await prisma.deal.findMany({
            where: {
                userId,
                status: "lost",
            },
            include: {
                lossReason: { select: { name: true } },
                stage: { select: { name: true } }
            }
        });

        const monthsOrder: string[] = [];
        for (let i = numMonthsToLookBack; i >= 0; i--) {
            const d = subMonths(now, i);
            const rawLabel = format(d, "MMM", { locale: ptBR });
            monthsOrder.push(rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1));
        }

        const monthlyStats = new Map<string, number>();
        monthsOrder.forEach(m => monthlyStats.set(m, 0));

        const reasonMap = new Map<string, number>();
        const stageEvasionMap = new Map<string, number>();

        let valorMvpPerdido = 0;

        for (const deal of lostDeals) {
            valorMvpPerdido += deal.value || 0;

            const mLabelRaw = format(deal.updatedAt, "MMM", { locale: ptBR });
            const mLabel = mLabelRaw.charAt(0).toUpperCase() + mLabelRaw.slice(1);

            if (monthlyStats.has(mLabel)) {
                monthlyStats.set(mLabel, monthlyStats.get(mLabel)! + 1);
            }

            // Reason Map
            const rName = deal.lossReason?.name || "Sem Motivo";
            reasonMap.set(rName, (reasonMap.get(rName) || 0) + 1);

            // Stage Drop-Off Map (Replacing Objections)
            const sName = deal.stage?.name || "Desconhecida";
            stageEvasionMap.set(sName, (stageEvasionMap.get(sName) || 0) + 1);
        }

        // Aggregate Reasons
        const reasonsRaw = Array.from(reasonMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const principalMotivo = reasonsRaw.length > 0 ? reasonsRaw[0].name : "Nenhum";
        
        let reasons = [];
        if (reasonsRaw.length > 0) {
            // Transform counts to percentages for the PieChart
            const totalReasonsCount = reasonsRaw.reduce((sum, item) => sum + item.count, 0) || 1;
            reasons = reasonsRaw.map((item, index) => ({
                name: item.name,
                value: Number(((item.count / totalReasonsCount) * 100).toFixed(1)),
                color: REASONS_COLORS[index % REASONS_COLORS.length]
            }));
        }

        // Aggregate Stage Evasions (Objections Array format)
        const objections = Array.from(stageEvasionMap.entries())
            .map(([objection, count]) => ({ objection, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // top 5 worst stages

        const lostByMonth = monthsOrder.map(m => ({
            month: m,
            perdas: monthlyStats.get(m)!
        }));

        const fmtValue = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(valorMvpPerdido);

        return {
            metrics: {
                totalPerdidas: lostDeals.length,
                valorPerdido: fmtValue,
                principalMotivo: principalMotivo.length > 15 ? principalMotivo.substring(0, 15) + "..." : principalMotivo,
                taxaDePerda: Math.round(globalTax)
            },
            reasons,
            objections,
            lostByMonth
        };
    }
};
