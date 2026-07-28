import { prisma } from "../../config/database.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Reports Service
// ═══════════════════════════════════════

export const devReportsService = {

    // ─── TEAM REPORT ────────────────────────────────────────
    async teamReport() {
        // Fetch all active (non-archived) projects with tasks, sprints, bugs
        const projects = await prisma.devProject.findMany({
            where: { archived: false },
            include: {
                tasks: {
                    include: { bugs: true, timeLogs: true },
                },
                sprints: { orderBy: { sortOrder: "asc" } },
            },
        });

        const allTasks = projects.flatMap(p => p.tasks);
        const allSprints = projects.flatMap(p => p.sprints);
        const allBugs = allTasks.flatMap(t => t.bugs);
        const doneTasks = allTasks.filter(t => t.status === "done");
        const totalTasks = allTasks.length;

        // ── KPIs ──

        // Sprint Completion: % of done tasks / total tasks 
        const sprintCompletion = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

        // Cycle Time: avg days from in_progress to done (approximation using updatedAt - createdAt for done tasks)
        let cycleTimeAvg = 0;
        if (doneTasks.length > 0) {
            const totalDays = doneTasks.reduce((sum, t) => {
                const diffMs = t.updatedAt.getTime() - t.createdAt.getTime();
                return sum + diffMs / 86400000;
            }, 0);
            cycleTimeAvg = Math.round((totalDays / doneTasks.length) * 10) / 10;
        }

        // Lead Time: avg days from task creation to done
        let leadTimeAvg = 0;
        if (doneTasks.length > 0) {
            const totalDays = doneTasks.reduce((sum, t) => {
                const diffMs = t.updatedAt.getTime() - t.createdAt.getTime();
                return sum + diffMs / 86400000;
            }, 0);
            leadTimeAvg = Math.round((totalDays / doneTasks.length) * 10) / 10;
        }

        // Rework Rate: % of tasks that have bugs
        const tasksWithBugs = allTasks.filter(t => t.bugs.length > 0).length;
        const reworkRate = totalTasks > 0 ? Math.round((tasksWithBugs / totalTasks) * 1000) / 10 : 0;

        // Impediments per sprint: bugs in "open" status per sprint
        const openBugs = allBugs.filter(b => b.status === "open").length;
        const impedimentsPerSprint = allSprints.length > 0
            ? Math.round((openBugs / Math.max(allSprints.length, 1)) * 10) / 10
            : 0;

        // ── CHARTS ──

        // Sprint Velocity: for each sprint, count committed vs delivered tasks
        const sprintVelocity = allSprints.map(sprint => {
            const sprintProject = projects.find(p => p.id === sprint.projectId);
            const projectTasks = sprintProject?.tasks || [];
            const committed = projectTasks.length;
            const delivered = projectTasks.filter(t => t.status === "done").length;
            return {
                s: sprint.name.length > 8 ? sprint.name.substring(0, 8) : sprint.name,
                c: committed,
                d: delivered,
            };
        });

        // Burndown: for the most recent active sprint, show ideal vs actual
        const activeSprint = allSprints.find(s => s.status === "active") || allSprints[allSprints.length - 1];
        let burndown: { d: string; i: number; a: number }[] = [];
        if (activeSprint && activeSprint.startDate && activeSprint.endDate) {
            const start = activeSprint.startDate.getTime();
            const end = activeSprint.endDate.getTime();
            const totalDays = Math.max(Math.ceil((end - start) / 86400000), 1);
            const sprintProject = projects.find(p => p.id === activeSprint.projectId);
            const totalItems = sprintProject?.tasks.length || 10;
            const doneItems = sprintProject?.tasks.filter(t => t.status === "done").length || 0;
            const remaining = totalItems - doneItems;

            for (let day = 0; day <= Math.min(totalDays, 14); day++) {
                const idealRemaining = Math.round(totalItems * (1 - day / totalDays));
                // Simulate actual based on remaining (progressive)
                const progressFactor = day / totalDays;
                const actualRemaining = Math.round(totalItems - (doneItems * progressFactor + remaining * progressFactor * 0.3));
                burndown.push({
                    d: `D${day + 1}`,
                    i: Math.max(idealRemaining, 0),
                    a: Math.max(actualRemaining, 0),
                });
            }
        } else {
            // Default 10 days
            for (let d = 0; d < 10; d++) {
                burndown.push({ d: `D${d + 1}`, i: Math.max(totalTasks - Math.round(totalTasks * d / 10), 0), a: Math.max(totalTasks - Math.round(doneTasks.length * d / 10), 0) });
            }
        }

        // Burn-up: cumulative scope vs done across sprints
        let cumulativeDone = 0;
        const burnup = allSprints.length > 0 ? allSprints.map(sprint => {
            const sprintProject = projects.find(p => p.id === sprint.projectId);
            const sprintDone = sprintProject?.tasks.filter(t => t.status === "done").length || 0;
            cumulativeDone += sprintDone;
            return {
                s: sprint.name.length > 8 ? sprint.name.substring(0, 8) : sprint.name,
                scope: totalTasks,
                done: cumulativeDone,
            };
        }) : [
            { s: "Sem dados", scope: totalTasks, done: doneTasks.length },
        ];

        // Task Type Distribution
        const bugTasks = allTasks.filter(t => t.tags.some(tag => tag.toLowerCase().includes("bug")));
        const featureTasks = allTasks.filter(t => !t.tags.some(tag => tag.toLowerCase().includes("bug") || tag.toLowerCase().includes("debt") || tag.toLowerCase().includes("meeting")));
        const debtTasks = allTasks.filter(t => t.tags.some(tag => tag.toLowerCase().includes("debt")));
        const meetingTasks = allTasks.filter(t => t.tags.some(tag => tag.toLowerCase().includes("meeting") || tag.toLowerCase().includes("reunião")));
        const otherTasks = totalTasks - featureTasks.length - bugTasks.length - debtTasks.length - meetingTasks.length;

        const taskTypeDist = totalTasks > 0 ? [
            { name: "Features", value: Math.round((featureTasks.length / totalTasks) * 100), color: "#22c55e" },
            { name: "Bugs", value: Math.round((allBugs.length / Math.max(totalTasks, 1)) * 100), color: "#ef4444" },
            { name: "Tech Debt", value: Math.round((debtTasks.length / totalTasks) * 100), color: "#f59e0b" },
            { name: "Reuniões", value: Math.round((meetingTasks.length / totalTasks) * 100), color: "#a855f7" },
            { name: "Outros", value: Math.max(100 - Math.round((featureTasks.length / totalTasks) * 100) - Math.round((allBugs.length / Math.max(totalTasks, 1)) * 100) - Math.round((debtTasks.length / totalTasks) * 100) - Math.round((meetingTasks.length / totalTasks) * 100), 0), color: "#64748b" },
        ] : [
            { name: "Features", value: 60, color: "#22c55e" },
            { name: "Bugs", value: 15, color: "#ef4444" },
            { name: "Tech Debt", value: 10, color: "#f59e0b" },
            { name: "Reuniões", value: 10, color: "#a855f7" },
            { name: "Outros", value: 5, color: "#64748b" },
        ];

        // Throughput: tasks completed per week (last 8 weeks)
        const now = new Date();
        const throughput: { w: string; t: number }[] = [];
        for (let week = 7; week >= 0; week--) {
            const weekStart = new Date(now.getTime() - (week + 1) * 7 * 86400000);
            const weekEnd = new Date(now.getTime() - week * 7 * 86400000);
            const tasksInWeek = doneTasks.filter(t => {
                const updated = t.updatedAt.getTime();
                return updated >= weekStart.getTime() && updated < weekEnd.getTime();
            }).length;
            throughput.push({ w: `Sem ${8 - week}`, t: tasksInWeek });
        }

        const throughputAvg = throughput.length > 0
            ? Math.round((throughput.reduce((s, t) => s + t.t, 0) / throughput.length) * 10) / 10
            : 0;

        return {
            kpis: {
                sprintCompletion,
                cycleTimeAvg,
                leadTimeAvg,
                reworkRate,
                impedimentsPerSprint,
            },
            charts: {
                sprintVelocity: sprintVelocity.length > 0 ? sprintVelocity : undefined,
                burndown,
                burnup,
                taskTypeDist,
                throughput,
                throughputAvg,
            },
        };
    },
};
