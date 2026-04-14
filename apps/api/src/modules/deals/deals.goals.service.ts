import { prisma } from "../../config/database.js";
import { format, subMonths, startOfMonth, differenceInDays } from "date-fns";

export interface GoalsResult {
    goals: Array<{ name: string; target: string; current: string; progress: number; color: string }>;
    individualGoals: Array<{ name: string; target: string; current: string; progress: number }>;
}

export const dealsGoalsService = {
    async getGoalsTracking(payload: { userId: string }): Promise<GoalsResult> {
        const { userId } = payload;
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));

        // 1. Fetch current month deals
        const currentDeals = await prisma.deal.findMany({
            where: {
                userId,
                createdAt: { gte: thisMonthStart }
            },
            include: {
                consultant: { select: { id: true, name: true } },
                client: { select: { id: true } }
            }
        });

        // 2. Fetch last month deals to act as the baseline 'target' predictor
        const lastDeals = await prisma.deal.findMany({
            where: {
                userId,
                createdAt: { gte: lastMonthStart, lt: thisMonthStart }
            }
        });

        // Current Aggregations
        let curPropostas = currentDeals.length;
        let curReceita = 0;
        let curWonDeals = 0;
        let curClients = new Set();
        let curCycleDays = 0;
        let curClosedCycles = 0;

        currentDeals.forEach(d => {
            if (d.clientId) curClients.add(d.clientId);
            if (d.status === "won") {
                curReceita += (d.value || 0);
                curWonDeals++;
                const cycle = differenceInDays(d.updatedAt, d.createdAt);
                if (cycle >= 0) {
                    curCycleDays += cycle;
                    curClosedCycles++;
                }
            }
        });

        const curConversaoRate = curPropostas > 0 ? (curWonDeals / curPropostas) : 0;
        const curCycle = curClosedCycles > 0 ? (curCycleDays / curClosedCycles) : 0;

        // Last Month Aggregations (To build targets)
        let lastReceita = 0;
        let lastPropostas = lastDeals.length;
        lastDeals.forEach(d => {
            if (d.status === "won") lastReceita += (d.value || 0);
        });

        // Goal Logic Engine
        const GROWTH_FACTOR = 1.2; // We demand 20% more than last month to represent a healthy goal
        const targetReceita = lastReceita > 0 ? lastReceita * GROWTH_FACTOR : 50000; // Flat 50k fallback if no past
        const targetPropostas = lastPropostas > 0 ? Math.round(lastPropostas * GROWTH_FACTOR) : 10;
        const targetConversao = 0.5; // Always demanding at least 50% core conversion
        const targetNovosClientes = 5; // Fixed small benchmark for MVP
        const targetCicloVendas = 7; // Goal to close stuff in 7 days or less

        const safeProg = (actual: number, expected: number) => {
            if (expected === 0) return 0;
            const res = Math.round((actual / expected) * 100);
            return res > 100 ? 100 : res;
        };
        const reverseProg = (actual: number, expected: number) => { // For cycles, smaller is better.
            if (actual === 0) return 100;
            const res = Math.round((expected / actual) * 100);
            return res > 100 ? 100 : res;
        };

        const formtCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(val);

        const goals = [
            { name: "Receita Mensal", target: formtCurrency(targetReceita), current: formtCurrency(curReceita), progress: safeProg(curReceita, targetReceita), color: "#22c55e" },
            { name: "Propostas Abertas", target: targetPropostas.toString(), current: curPropostas.toString(), progress: safeProg(curPropostas, targetPropostas), color: "#3b82f6" },
            { name: "Taxa de Conversão", target: `${Math.round(targetConversao * 100)}%`, current: `${Math.round(curConversaoRate * 100)}%`, progress: safeProg(curConversaoRate, targetConversao), color: "#8b5cf6" },
            { name: "Cobertura de Clientes", target: targetNovosClientes.toString(), current: curClients.size.toString(), progress: safeProg(curClients.size, targetNovosClientes), color: "#06b6d4" },
            { name: "Ciclo de Vendas", target: `${targetCicloVendas} dias`, current: `${Math.round(curCycle)} dias`, progress: reverseProg(curCycle, targetCicloVendas), color: "#f59e0b" },
        ];


        // 3. Individual Goals Aggregation
        const cMap = new Map<string, { name: string; curReceita: number; lastReceita: number }>();
        const fullDeals = await prisma.deal.findMany({
            where: { userId, consultantId: { not: null } },
            include: { consultant: { select: { id: true, name: true } } }
        });

        // Determine this month vs last month per consultant
        fullDeals.forEach(d => {
            const cid = d.consultant!.id;
            const cName = d.consultant!.name || "Advisor Oculto";
            if (!cMap.has(cid)) cMap.set(cid, { name: cName, curReceita: 0, lastReceita: 0 });
            
            const stats = cMap.get(cid)!;
            if (d.status === "won") {
                if (d.updatedAt >= thisMonthStart) stats.curReceita += (d.value || 0);
                else if (d.updatedAt >= lastMonthStart && d.updatedAt < thisMonthStart) stats.lastReceita += (d.value || 0);
            }
        });

        const rawIndiv = Array.from(cMap.values());
        
        const individualGoals = rawIndiv.map(c => {
            const indivTarget = c.lastReceita > 0 ? c.lastReceita * GROWTH_FACTOR : 15000; // Demands at least 15k if previous month was unexisting
            return {
                name: c.name,
                target: formtCurrency(indivTarget),
                current: formtCurrency(c.curReceita),
                progress: safeProg(c.curReceita, indivTarget)
            };
        }).sort((a, b) => b.progress - a.progress); // Sort by highest achievers

        return { goals, individualGoals };
    }
};
