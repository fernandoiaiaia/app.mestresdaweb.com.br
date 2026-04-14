import { prisma } from "../../config/database.js";

export interface ConversionFunnelResult {
    funnelSteps: Array<{ name: string; value: number; color: string; rate: string }>;
    stats: {
        totalConversion: string;
        bestConversionStage: string;
        worstConversionStage: string;
    };
}

export const dealsFunnelService = {
    async getConversionFunnel(payload: { userId: string }): Promise<ConversionFunnelResult> {
        const { userId } = payload;

        // 1. Grab the Default Funnel or the primary one
        let funnel = await prisma.funnel.findFirst({
            where: { userId, isDefault: true },
            include: { stages: { orderBy: { orderIndex: "asc" } } }
        });

        if (!funnel) {
            funnel = await prisma.funnel.findFirst({
                where: { userId },
                include: { stages: { orderBy: { orderIndex: "asc" } } }
            });
        }

        if (!funnel || funnel.stages.length === 0) {
            return {
                funnelSteps: [],
                stats: { totalConversion: "0%", bestConversionStage: "N/A", worstConversionStage: "N/A" }
            };
        }

        // 2. Load all Deals attached to this primary Funnel
        const deals = await prisma.deal.findMany({
            where: { userId, funnelId: funnel.id },
            include: { stage: true }
        });

        // 3. Mathematical Cumulative Funnel Distribution
        const colorsBase = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#06b6d4"];
        const funnelSteps: Array<{ name: string; value: number; color: string; rate: string }> = [];

        funnel.stages.forEach((stage, idx) => {
            let reachedStageCount = 0;
            
            deals.forEach(d => {
                // To have reached this stage: Deal must be Won OR its current parked stage logic must be greater or equal to this stage
                const currentParkedOrder = d.stage?.orderIndex ?? -1;
                if (d.status === "won" || currentParkedOrder >= stage.orderIndex) {
                    reachedStageCount++;
                }
            });

            funnelSteps.push({
                name: stage.name,
                value: reachedStageCount,
                color: colorsBase[idx % colorsBase.length],
                rate: "100%" // Temporary proxy placeholder, we recalculate rates at the end relative to the block above it
            });
        });

        // Add the Final Global Step: "Negócios Fechados" mapping pure "Won" entries!
        const totalWon = deals.filter(d => d.status === "won").length;
        funnelSteps.push({
            name: "Negócios Fechados",
            value: totalWon,
            color: "#16a34a",
            rate: "100%"
        });

        // 4. Calculate Sequential Rate (Drop-offs)
        let maxDropPct = -1;
        let worstStageString = "N/A";
        
        let minDropPct = 101; 
        let bestStageString = "N/A";

        const topVolume = funnelSteps[0]?.value || 0;

        for (let i = 0; i < funnelSteps.length; i++) {
            if (i === 0) {
                funnelSteps[i].rate = "100%";
            } else {
                const currentVal = funnelSteps[i].value;
                const prevVal = funnelSteps[i - 1].value;
                const conversionPct = prevVal > 0 ? (currentVal / prevVal) * 100 : 0;
                funnelSteps[i].rate = `${conversionPct.toFixed(0)}%`;

                // Calculate bottleneck logic
                const dropPct = 100 - conversionPct;
                if (prevVal > 0) {
                    if (dropPct > maxDropPct) {
                        maxDropPct = dropPct;
                        worstStageString = `${funnelSteps[i - 1].name} → ${funnelSteps[i].name} (${conversionPct.toFixed(0)}%)`;
                    }
                    if (dropPct < minDropPct) {
                        minDropPct = dropPct;
                        bestStageString = `${funnelSteps[i - 1].name} → ${funnelSteps[i].name} (${conversionPct.toFixed(0)}%)`;
                    }
                }
            }
        }

        const e2eConversion = topVolume > 0 ? (totalWon / topVolume) * 100 : 0;

        return {
            funnelSteps,
            stats: {
                totalConversion: `${e2eConversion.toFixed(1)}%`,
                bestConversionStage: topVolume > 0 && totalWon > 0 ? bestStageString : "Volume Insuficiente",
                worstConversionStage: topVolume > 0 && totalWon > 0 ? worstStageString : "Volume Insuficiente"
            }
        };
    }
};
