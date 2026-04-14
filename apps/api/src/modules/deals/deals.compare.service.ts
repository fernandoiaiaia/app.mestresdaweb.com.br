import { prisma } from "../../config/database.js";
import { differenceInDays } from "date-fns";

export interface ConsultantComparisonResult {
    consultants: string[];
    radarData: Array<Record<string, string | number>>;
    comparisonData: Array<{ name: string; conversão: number; volume: number; receita: number }>;
}

export const dealsCompareService = {
    async getConsultantComparison(payload: { userId: string }): Promise<ConsultantComparisonResult> {
        const { userId } = payload;
        
        // Fetch base deals holding consultants
        const teamDeals = await prisma.deal.findMany({
            where: {
                userId,
                consultantId: { not: null }
            },
            include: {
                consultant: { select: { id: true, name: true } },
                tasks: { select: { id: true } }
            }
        });

        const cMap = new Map<string, { name: string; firstName: string; proposals: number; won: number; revenue: number; cycleDays: number; closedCycles: number; tasksCount: number }>();
        
        for (const d of teamDeals) {
            const cid = d.consultant!.id;
            const fullName = d.consultant!.name || "Advisor Oculto";
            const fName = fullName.split(" ")[0];

            if (!cMap.has(cid)) {
                cMap.set(cid, { name: fullName, firstName: fName, proposals: 0, won: 0, revenue: 0, cycleDays: 0, closedCycles: 0, tasksCount: 0 });
            }

            const stats = cMap.get(cid)!;
            stats.proposals++;
            stats.tasksCount += d.tasks.length;

            if (d.status === "won") {
                stats.won++;
                stats.revenue += (d.value || 0);

                const cycle = differenceInDays(d.updatedAt, d.createdAt);
                if (cycle >= 0) {
                    stats.cycleDays += cycle;
                    stats.closedCycles++;
                }
            }
        }

        const rawList = Array.from(cMap.values());
        
        // Base absolute data
        const comparisonData = rawList.map(c => {
            const conversao = c.proposals > 0 ? Math.round((c.won / c.proposals) * 100) : 0;
            return {
                name: c.firstName,
                conversão: conversao,
                volume: c.won,
                receita: Number((c.revenue / 1000).toFixed(1)) // Keep dummy notation: 485 representing 485k for the chart display UI constraints
            };
        }).sort((a, b) => b.receita - a.receita);

        // Prepare Top 5 strictly for layout constraints
        const top5Raw = rawList.sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        // Generate full names array for the header dropdowns
        const consultants = top5Raw.map(c => c.name);

        // Find Maximums for Normalization (Radar requires 0-100 scale to draw symmetrically)
        let maxVol = 1, maxRev = 1, maxTasks = 1;
        let minCycle = 99999;

        top5Raw.forEach(c => {
            if (c.won > maxVol) maxVol = c.won;
            if (c.revenue > maxRev) maxRev = c.revenue;
            if (c.tasksCount > maxTasks) maxTasks = c.tasksCount;
            
            const cCycle = c.closedCycles > 0 ? Math.round(c.cycleDays / c.closedCycles) : 999;
            if (cCycle < minCycle && cCycle > 0) minCycle = cCycle;
        });

        if (minCycle === 99999) minCycle = 1; // Fallback

        // Building Radar Rows (Each object is a corner of the Pentagon: { metric: "Conversão", Maria: 70, Joao: 80 } )
        const radarConversao: Record<string, string | number> = { metric: "Conversão" };
        const radarVolume: Record<string, string | number> = { metric: "Volume" };
        const radarReceita: Record<string, string | number> = { metric: "Receita" };
        const radarVelocidade: Record<string, string | number> = { metric: "Velocidade" };
        const radarEngajamento: Record<string, string | number> = { metric: "Engajamento" };

        top5Raw.forEach(c => {
            // Conversão is already 0-100%
            const cRatio = c.proposals > 0 ? Math.round((c.won / c.proposals) * 100) : 0;
            radarConversao[c.firstName] = cRatio;
            
            // Volume logic scale
            radarVolume[c.firstName] = Math.round((c.won / maxVol) * 100);

            // Revenue scale
            radarReceita[c.firstName] = Math.round((c.revenue / maxRev) * 100);
            
            // Velocidade (Cycle)
            // Faster is closer to 100. Lower cycle = higher score.
            let cycleVal = c.closedCycles > 0 ? Math.round(c.cycleDays / c.closedCycles) : 999;
            let cycleScore = 0;
            if (cycleVal !== 999 && cycleVal > 0) {
                cycleScore = Math.round((minCycle / cycleVal) * 100); 
            }
            radarVelocidade[c.firstName] = cycleScore;

            // Engajamento (Tasks usage scale)
            radarEngajamento[c.firstName] = Math.round((c.tasksCount / maxTasks) * 100);
        });

        // Pack the Radar pentagon
        const radarData = [
            radarConversao,
            radarVolume,
            radarReceita,
            radarVelocidade,
            radarEngajamento
        ];

        return {
            consultants,
            comparisonData,
            radarData
        };
    }
};
