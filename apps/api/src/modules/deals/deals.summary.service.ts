import { prisma } from "../../config/database.js";
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PeriodSummaryResult {
    kpis: Array<{ label: string; value: string; change: string; up: boolean; color: string }>;
    weeklyData: Array<{ week: string; propostas: number; deals: number; tarefas: number; leads: number }>;
    dailyRevenue: Array<{ day: string; valor: number }>;
    highlights: {
        melhorAdvisor: string;
        produtoDestaque: string;
        cadenciaTop: string;
    };
}

export const dealsSummaryService = {
    async getPeriodSummary(payload: { userId: string }): Promise<PeriodSummaryResult> {
        const { userId } = payload;
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));

        // 1. Fetch This Month Data
        const curDeals = await prisma.deal.findMany({
            where: { userId, createdAt: { gte: thisMonthStart } },
            include: { consultant: true, funnel: true }
        });
        const curTasks = await prisma.task.findMany({
            where: { userId, createdAt: { gte: thisMonthStart } }
        });

        // 2. Fetch Last Month Data for KPI Delta
        const lastDeals = await prisma.deal.findMany({
            where: { userId, createdAt: { gte: lastMonthStart, lt: thisMonthStart } }
        });
        const lastTasks = await prisma.task.findMany({
            where: { userId, createdAt: { gte: lastMonthStart, lt: thisMonthStart } }
        });

        const formtCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(val);

        // ===================================
        // 3. DAILY REVENUE CUMULATIVE
        // ===================================
        const dailyDict: Record<number, number> = {};
        const daysInMonth = getDate(now); // Max days to plot is 'today'
        
        // Sum values exactly on the day they were won (using updatedAt as close proxy for Won milestone)
        curDeals.forEach(d => {
            if (d.status === "won" && d.updatedAt >= thisMonthStart) {
                const day = getDate(d.updatedAt);
                if (day <= daysInMonth) {
                    dailyDict[day] = (dailyDict[day] || 0) + (d.value || 0);
                }
            }
        });

        const dailyRevenue = [];
        let cumulativeRev = 0;
        for (let i = 1; i <= daysInMonth; i++) {
            cumulativeRev += (dailyDict[i] || 0);
            dailyRevenue.push({ day: i.toString().padStart(2, "0"), valor: cumulativeRev });
        }

        // ===================================
        // 4. WEEKLY ACTIVITY (4 artificial weeks)
        // ===================================
        const weeklyData = [
            { week: "Sem 1", propostas: 0, deals: 0, tarefas: 0, leads: 0 },
            { week: "Sem 2", propostas: 0, deals: 0, tarefas: 0, leads: 0 },
            { week: "Sem 3", propostas: 0, deals: 0, tarefas: 0, leads: 0 },
            { week: "Sem 4", propostas: 0, deals: 0, tarefas: 0, leads: 0 },
        ];

        const assignWeek = (date: Date) => {
            const d = getDate(date);
            if (d <= 7) return 0;
            if (d <= 14) return 1;
            if (d <= 21) return 2;
            return 3;
        };

        curDeals.forEach(d => {
            const wIdx = assignWeek(d.createdAt);
            weeklyData[wIdx].leads++;
            if (d.status !== "lost" && (d.value || 0) > 0) weeklyData[wIdx].propostas++; // Proposta Proxy
            if (d.status === "won") weeklyData[wIdx].deals++;
        });

        curTasks.forEach(t => {
            const wIdx = assignWeek(t.createdAt);
            weeklyData[wIdx].tarefas++;
        });

        // ===================================
        // 5. KPIs & DELTAS Computation
        // ===================================
        const cLeads = curDeals.length;
        const cPropostas = curDeals.filter(d => d.status !== "lost" && (d.value || 0) > 0).length;
        const cWon = curDeals.filter(d => d.status === "won").length;
        const cRev = cumulativeRev;
        const cConv = cLeads > 0 ? (cWon / cLeads) * 100 : 0;
        const cTasks = curTasks.filter(t => t.status === "completed").length;

        const lLeads = lastDeals.length;
        const lPropostas = lastDeals.filter(d => d.status !== "lost" && (d.value || 0) > 0).length;
        const lWon = lastDeals.filter(d => d.status === "won").length;
        const lRev = lastDeals.reduce((acc, d) => acc + (d.status === "won" ? (d.value || 0) : 0), 0);
        const lConv = lLeads > 0 ? (lWon / lLeads) * 100 : 0;
        const lTasks = lastTasks.filter(t => t.status === "completed").length;

        const calculateDelta = (cur: number, last: number, suffix = "%", isRate = false) => {
            if (last === 0) return { str: `+100${suffix}`, up: cur > 0 };
            const diff = isRate ? (cur - last) : ((cur - last) / last) * 100;
            const up = diff >= 0;
            const sign = up ? "+" : "";
            return { str: `${sign}${diff.toFixed(0)}${suffix}`, up };
        };

        const rD = calculateDelta(cRev, lRev);
        const kpis = [
            { label: "Oportunidades Avançadas", value: cPropostas.toString(), change: calculateDelta(cPropostas, lPropostas).str, up: calculateDelta(cPropostas, lPropostas).up, color: "text-blue-400" },
            { label: "Negócios Fechados", value: cWon.toString(), change: calculateDelta(cWon, lWon).str, up: calculateDelta(cWon, lWon).up, color: "text-blue-400" },
            { label: "Receita Nominal", value: formtCurrency(cRev), change: rD.str, up: rD.up, color: "text-blue-400" },
            { label: "Tax. Conversão", value: `${cConv.toFixed(1)}%`, change: calculateDelta(cConv, lConv, "pp", true).str, up: calculateDelta(cConv, lConv, "pp", true).up, color: "text-purple-400" },
            { label: "Leads Base Gerados", value: cLeads.toString(), change: calculateDelta(cLeads, lLeads).str, up: calculateDelta(cLeads, lLeads).up, color: "text-cyan-400" },
            { label: "Tarefas Concluídas", value: cTasks.toString(), change: calculateDelta(cTasks, lTasks).str, up: calculateDelta(cTasks, lTasks).up, color: "text-amber-400" },
        ];

        // ===================================
        // 6. HIGHLIGHTS & AWARDS
        // ===================================
        // Melhor Advisor
        const advMap = new Map<string, { n: string; v: number }>();
        // Produto Destaque (Funnel)
        const funMap = new Map<string, { n: string; count: number }>();
        
        curDeals.forEach(d => {
            if (d.status === "won") {
                if (d.consultant) {
                    const id = d.consultant.id;
                    advMap.set(id, { n: d.consultant.name, v: (advMap.get(id)?.v || 0) + (d.value || 0) });
                }
                if (d.funnel) {
                    const id = d.funnel.id;
                    funMap.set(id, { n: d.funnel.name, count: (funMap.get(id)?.count || 0) + 1 });
                }
            }
        });

        // TouchPoint Destaque
        const tpMap = new Map<string, { s: number; r: number }>();
        curTasks.forEach(t => {
            const tp = t.touchPoint || "Outros / General";
            if (!tpMap.has(tp)) tpMap.set(tp, { s: 0, r: 0 });
            const obj = tpMap.get(tp)!;
            obj.s++;
            if (t.status === "completed") obj.r++;
        });

        const topAdv = Array.from(advMap.values()).sort((a, b) => b.v - a.v)[0];
        const topFun = Array.from(funMap.values()).sort((a, b) => b.count - a.count)[0];
        
        const topTp = Array.from(tpMap.entries()).map(([k, v]) => ({ n: k, rate: v.s > 0 ? (v.r / v.s) * 100 : 0 }))
            .sort((a, b) => b.rate - a.rate)[0];

        return {
            weeklyData,
            dailyRevenue,
            kpis,
            highlights: {
                melhorAdvisor: topAdv ? `${topAdv.n.split(" ")[0]} — ${formtCurrency(topAdv.v)}` : "Sem Faturamento",
                produtoDestaque: topFun ? `${topFun.n} — ${topFun.count} vendas` : "Sem Faturamento",
                cadenciaTop: topTp ? `${topTp.n} — ${topTp.rate.toFixed(1)}% engaj.` : "Vazio"
            }
        };
    }
};
