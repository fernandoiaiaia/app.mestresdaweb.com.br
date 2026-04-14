import { prisma } from "../../config/database.js";
import { format, subDays, startOfWeek, endOfWeek, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ActivitiesResult {
    metrics: {
        totalAtividades: number;
        concluidas: number;
        emAndamento: number;
        atrasadas: number;
        produtividade: number;
    };
    dailyActivity: Array<{ day: string; atividades: number }>;
    weeklyTrend: Array<{ week: string; criadas: number; concluidas: number }>;
    byType: Array<{ tipo: string; count: number }>;
}

export const dealsActivitiesService = {
    async getActivitiesReport(payload: { userId: string }): Promise<ActivitiesResult> {
        const { userId } = payload;
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);

        // Fetch Tasks
        // We fetch tasks from the last 30 days to build the active trend, 
        // but we can compute metrics natively over this period to show the current pipeline status.
        const tasks = await prisma.task.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo }
            }
        });

        let totalAtividades = tasks.length;
        let concluidas = 0;
        let emAndamento = 0;
        let atrasadas = 0;

        const touchPointMap = new Map<string, number>();

        // Days of week format
        const dailyMap = new Map<string, number>([
            ["Dom", 0], ["Seg", 0], ["Ter", 0], ["Qua", 0], ["Qui", 0], ["Sex", 0], ["Sáb", 0]
        ]);

        const weeksPivot = [
            { start: startOfWeek(subDays(now, 21), { weekStartsOn: 0 }), end: endOfWeek(subDays(now, 21), { weekStartsOn: 0 }), label: "Sem 1", criadas: 0, concluidas: 0 },
            { start: startOfWeek(subDays(now, 14), { weekStartsOn: 0 }), end: endOfWeek(subDays(now, 14), { weekStartsOn: 0 }), label: "Sem 2", criadas: 0, concluidas: 0 },
            { start: startOfWeek(subDays(now, 7), { weekStartsOn: 0 }), end: endOfWeek(subDays(now, 7), { weekStartsOn: 0 }), label: "Sem 3", criadas: 0, concluidas: 0 },
            { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }), label: "Sem 4", criadas: 0, concluidas: 0 }
        ];

        for (const t of tasks) {
            // Metrics
            if (t.status === "completed") {
                concluidas++;
            } else {
                emAndamento++;
                if (isBefore(t.date, now)) {
                    atrasadas++;
                }
            }

            // Types
            const tType = t.touchPoint || "Outros";
            touchPointMap.set(tType, (touchPointMap.get(tType) || 0) + 1);

            // Daily Map (Based on the due date of task)
            const dayOfWeekLabel = format(t.date, "eee", { locale: ptBR });
            const capLabel = dayOfWeekLabel.charAt(0).toUpperCase() + dayOfWeekLabel.slice(1, 3);
            if (dailyMap.has(capLabel)) {
                dailyMap.set(capLabel, dailyMap.get(capLabel)! + 1);
            }

            // Weekly Trends
            for (const w of weeksPivot) {
                if (t.createdAt >= w.start && t.createdAt <= w.end) {
                    w.criadas++;
                }
                // Completed tracking based on completion status in that timeframe
                // using updatedAt as proxy for completion time
                if (t.status === "completed" && t.updatedAt >= w.start && t.updatedAt <= w.end) {
                    w.concluidas++;
                }
            }
        }

        // Prepare outputs
        const byType = Array.from(touchPointMap.entries())
            .map(([tipo, count]) => ({ tipo, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Map daily activity preserving the chronological week order
        const dailyActivity = Array.from(dailyMap.entries()).map(([day, atividades]) => ({ day, atividades }));

        const weeklyTrend = weeksPivot.map(w => ({
            week: w.label,
            criadas: w.criadas,
            concluidas: w.concluidas
        }));

        let produtividade = totalAtividades > 0 ? Math.round((concluidas / totalAtividades) * 100) : 0;

        return {
            metrics: {
                totalAtividades,
                concluidas,
                emAndamento,
                atrasadas,
                produtividade
            },
            dailyActivity,
            weeklyTrend,
            byType
        };
    }
};
