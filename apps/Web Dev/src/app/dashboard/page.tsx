"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import {
    FolderKanban, Clock, AlertTriangle, CheckCircle2, TrendingUp, Users,
    ArrowRight, ExternalLink, ListTodo, BarChart3, Target, Zap, Calendar,
    Timer, Activity, Layers, ArrowUpRight, ArrowDownRight, Flame,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
    AreaChart, Area, CartesianGrid, RadialBarChart, RadialBar, Legend,
} from "recharts";

const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.5 } });

const PHASE_LABELS: Record<string, string> = {
    requirements: "Requisitos", discovery: "Discovery", development: "Desenvolvimento",
    testing: "Testes", documentation: "Documentação", delivery: "Entrega",
};

const CHART_TOOLTIP_STYLE = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };
const DONUT_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#64748b"];
const PRIORITY_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#64748b"];
const PHASE_COLORS = ["#6366f1", "#8b5cf6", "#22c55e", "#f59e0b", "#3b82f6", "#14b8a6"];

function getHealthColor(h: string) { return h === "on_track" ? "text-blue-400" : h === "at_risk" ? "text-amber-400" : "text-red-400"; }
function getHealthBg(h: string) { return h === "on_track" ? "bg-blue-500/10 border-blue-500/20" : h === "at_risk" ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"; }
function getHealthLabel(h: string) { return h === "on_track" ? "No Prazo" : h === "at_risk" ? "Em Risco" : "Atrasado"; }

// ═══════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════
export default function DashboardPage() {
    const { user } = useAuthStore();
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [projRes, taskRes] = await Promise.all([
            api<any[]>("/api/dev-projects?archived=false"),
            api<any[]>("/api/dev-projects/tasks/all"),
        ]);
        if (projRes.success && projRes.data) setProjects(projRes.data);
        if (taskRes.success && taskRes.data) setTasks(taskRes.data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Computed Stats ──
    const totalProjects = projects.length;
    const onTrack = projects.filter(p => p.health === "on_track").length;
    const atRisk = projects.filter(p => p.health === "at_risk").length;
    const delayed = projects.filter(p => p.health === "delayed").length;

    const totalTasks = tasks.length;
    const tasksByStatus = useMemo(() => {
        const m: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
        tasks.forEach(t => { m[t.status] = (m[t.status] || 0) + 1; });
        return m;
    }, [tasks]);
    const tasksByPriority = useMemo(() => {
        const m: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
        tasks.forEach(t => { m[t.priority] = (m[t.priority] || 0) + 1; });
        return m;
    }, [tasks]);

    const totalHoursEstimated = projects.reduce((s, p) => s + (p.hoursEstimated || 0), 0);
    const totalHoursUsed = projects.reduce((s, p) => s + (p.hoursUsed || 0), 0);
    const hoursEfficiency = totalHoursEstimated > 0 ? Math.round((totalHoursUsed / totalHoursEstimated) * 100) : 0;
    const avgProgress = totalProjects > 0 ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / totalProjects) : 0;

    // Chart data
    const hoursByProject = useMemo(() =>
        projects.map(p => ({
            name: p.name && p.name.length > 18 ? p.name.substring(0, 18) + "…" : (p.name || "—"),
            estimadas: p.hoursEstimated || 0,
            usadas: p.hoursUsed || 0,
        })),
    [projects]);

    const phaseDistribution = useMemo(() =>
        Object.entries(PHASE_LABELS).map(([key, label]) => ({
            name: label,
            value: projects.filter(p => p.phase === key).length,
        })).filter(d => d.value > 0),
    [projects]);

    const statusChartData = useMemo(() => [
        { name: "Concluídas", value: tasksByStatus.done, fill: "#22c55e" },
        { name: "Em Andamento", value: tasksByStatus.in_progress, fill: "#3b82f6" },
        { name: "Revisão", value: tasksByStatus.review, fill: "#f59e0b" },
        { name: "A Fazer", value: tasksByStatus.todo, fill: "#64748b" },
    ], [tasksByStatus]);

    const priorityChartData = useMemo(() => [
        { name: "Crítica", value: tasksByPriority.critical, fill: "#ef4444" },
        { name: "Alta", value: tasksByPriority.high, fill: "#f59e0b" },
        { name: "Média", value: tasksByPriority.medium, fill: "#3b82f6" },
        { name: "Baixa", value: tasksByPriority.low, fill: "#64748b" },
    ], [tasksByPriority]);

    // Progress radial data
    const progressRadialData = useMemo(() =>
        projects.slice(0, 5).map((p, i) => ({
            name: p.client || p.name || "—",
            progress: p.progress || 0,
            fill: ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#14b8a6"][i % 5],
        })),
    [projects]);

    // Recent tasks (not done)
    const recentActiveTasks = useMemo(() =>
        tasks.filter(t => t.status !== "done").slice(0, 6),
    [tasks]);

    // Tasks with deadlines approaching
    const urgentTasks = useMemo(() =>
        tasks.filter(t => {
            if (t.status === "done") return false;
            if (t.priority === "critical" || t.priority === "high") return true;
            return false;
        }).slice(0, 5),
    [tasks]);

    if (!user) return null;

    if (loading) {
        return (
            <div className="p-6 md:p-8 flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-slate-500">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
            {/* ══════════════════════════════════════════════════ */}
            {/* HERO HEADER */}
            {/* ══════════════════════════════════════════════════ */}
            <motion.div {...fadeUp(0)} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-blue-900/20 border border-white/[0.06] p-7">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-500/8 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-gradient-to-tr from-emerald-500/6 to-transparent rounded-full blur-2xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Olá, {user.name?.split(" ")[0] || "Gestor"} 👋
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">Visão consolidada de todos os projetos e equipe de desenvolvimento.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} />
                        {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </div>
                </div>
            </motion.div>

            {/* ══════════════════════════════════════════════════ */}
            {/* KPI CARDS ROW */}
            {/* ══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: "Projetos Ativos", value: totalProjects, icon: FolderKanban, color: "text-blue-400", bg: "from-blue-600/15 to-blue-900/5", border: "border-blue-500/15" },
                    { label: "No Prazo", value: onTrack, icon: CheckCircle2, color: "text-blue-400", bg: "from-blue-600/15 to-blue-900/5", border: "border-blue-500/15" },
                    { label: "Em Risco", value: atRisk, icon: AlertTriangle, color: "text-amber-400", bg: "from-amber-600/15 to-amber-900/5", border: "border-amber-500/15" },
                    { label: "Atrasados", value: delayed, icon: Flame, color: "text-red-400", bg: "from-red-600/15 to-red-900/5", border: "border-red-500/15" },
                    { label: "Total de Tarefas", value: totalTasks, icon: ListTodo, color: "text-purple-400", bg: "from-purple-600/15 to-purple-900/5", border: "border-purple-500/15" },
                    { label: "Progresso Médio", value: `${avgProgress}%`, icon: TrendingUp, color: "text-emerald-400", bg: "from-emerald-600/15 to-emerald-900/5", border: "border-emerald-500/15" },
                ].map((card, i) => (
                    <motion.div key={i} {...fadeUp(0.05 + i * 0.04)}
                        className={`p-4 rounded-xl bg-gradient-to-b ${card.bg} border ${card.border} hover:scale-[1.02] transition-transform`}>
                        <div className="flex items-center justify-between mb-2">
                            <card.icon size={18} className={`${card.color} opacity-70`} />
                        </div>
                        <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                        <p className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mt-1">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════ */}
            {/* HOURS OVERVIEW + PROGRESS RADIAL */}
            {/* ══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Hours Bar Chart (2 cols) */}
                <motion.div {...fadeUp(0.3)} className="lg:col-span-2 rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                            <BarChart3 size={14} className="text-blue-400" /> Horas por Projeto
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Estimadas</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Usadas</span>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        {hoursByProject.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hoursByProject} barGap={4} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                    <Bar dataKey="estimadas" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Estimadas" />
                                    <Bar dataKey="usadas" fill="#22c55e" radius={[6, 6, 0, 0]} name="Usadas" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 text-sm">Nenhum projeto ainda</div>
                        )}
                    </div>
                </motion.div>

                {/* Hours Summary Card */}
                <motion.div {...fadeUp(0.35)} className="rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/40 border border-white/[0.06] p-5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2 mb-5">
                            <Clock size={14} className="text-blue-400" /> Resumo de Horas
                        </h3>
                        <div className="space-y-4">
                            <div className="text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                                <p className="text-[9px] font-bold tracking-widest uppercase text-slate-500">Eficiência</p>
                                <p className={`text-4xl font-bold mt-1 ${hoursEfficiency > 100 ? "text-red-400" : hoursEfficiency > 80 ? "text-amber-400" : "text-blue-400"}`}>
                                    {hoursEfficiency}%
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    {hoursEfficiency > 100 ? "Acima do orçado" : hoursEfficiency > 80 ? "Próximo do limite" : "Dentro do orçado"}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">Estimadas</p>
                                    <p className="text-lg font-bold text-blue-400 mt-0.5">{totalHoursEstimated}h</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">Usadas</p>
                                    <p className="text-lg font-bold text-blue-400 mt-0.5">{totalHoursUsed}h</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700/30 text-center">
                        <p className="text-[10px] text-slate-500">
                            Saldo: <span className={`font-bold ${totalHoursEstimated - totalHoursUsed >= 0 ? "text-blue-400" : "text-red-400"}`}>
                                {totalHoursEstimated - totalHoursUsed >= 0 ? "+" : ""}{totalHoursEstimated - totalHoursUsed}h
                            </span>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════════════ */}
            {/* TASK STATUS DONUT + PRIORITY DONUT + PHASE PIE */}
            {/* ══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Status Distribution */}
                <motion.div {...fadeUp(0.4)} className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
                        <Activity size={14} className="text-blue-400" /> Tarefas por Status
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                    {statusChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {statusChartData.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                                <span className="text-slate-400">{s.name}</span>
                                <span className="text-white font-bold ml-auto">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Priority Distribution */}
                <motion.div {...fadeUp(0.45)} className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
                        <Flame size={14} className="text-amber-400" /> Prioridade das Tarefas
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={priorityChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                    {priorityChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {priorityChartData.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                                <span className="text-slate-400">{s.name}</span>
                                <span className="text-white font-bold ml-auto">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Phase Distribution */}
                <motion.div {...fadeUp(0.5)} className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
                        <Target size={14} className="text-purple-400" /> Projetos por Fase
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={phaseDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                                    label={({ name, value }) => `${name} (${value})`}>
                                    {phaseDistribution.map((_, i) => <Cell key={i} fill={PHASE_COLORS[i % PHASE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {phaseDistribution.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[i % PHASE_COLORS.length] }} />
                                <span className="text-slate-400">{s.name}</span>
                                <span className="text-white font-bold ml-auto">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════════════ */}
            {/* URGENT TASKS + ACTIVE TASKS */}
            {/* ══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Urgent / High Priority Tasks */}
                <motion.div {...fadeUp(0.55)} className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-red-400" /> Tarefas Urgentes
                        </h3>
                        <Link href="/dashboard/backlog" className="text-[10px] font-bold text-blue-400 hover:underline flex items-center gap-1 uppercase tracking-widest">
                            Ver backlog <ArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {urgentTasks.length > 0 ? urgentTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/20 hover:border-red-500/20 transition-all">
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${task.priority === "critical" ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{task.title}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{task.project?.name || "—"} · {task.epic || "—"}</p>
                                </div>
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md shrink-0 ${
                                    task.priority === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                    {task.priority === "critical" ? "Crítica" : "Alta"}
                                </span>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-500">
                                <CheckCircle2 size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">Nenhuma tarefa urgente</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Active Tasks */}
                <motion.div {...fadeUp(0.6)} className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                            <ListTodo size={14} className="text-blue-400" /> Tarefas em Andamento
                        </h3>
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                            {tasksByStatus.in_progress + tasksByStatus.review} ativas
                        </span>
                    </div>
                    <div className="space-y-2">
                        {recentActiveTasks.length > 0 ? recentActiveTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/20 hover:border-blue-500/20 transition-all">
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    task.status === "in_progress" ? "bg-blue-500" : task.status === "review" ? "bg-amber-500" : "bg-slate-500"
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{task.title}</p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                        {task.project?.name || "—"}
                                        {task.assignee ? ` · ${task.assignee.name}` : ""}
                                    </p>
                                </div>
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md shrink-0 ${
                                    task.status === "in_progress" ? "bg-blue-500/10 text-blue-400" : task.status === "review" ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"
                                }`}>
                                    {task.status === "in_progress" ? "Em Andamento" : task.status === "review" ? "Revisão" : "A Fazer"}
                                </span>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-500">
                                <ListTodo size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">Nenhuma tarefa ativa</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════════════ */}
            {/* PROJECTS TABLE */}
            {/* ══════════════════════════════════════════════════ */}
            <motion.div {...fadeUp(0.65)} className="rounded-2xl bg-slate-800/40 border border-white/[0.06] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Layers size={14} className="text-blue-400" /> Todos os Projetos
                    </h3>
                    <Link href="/dashboard/projects" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors flex items-center gap-1">
                        Ver detalhes <ExternalLink size={11} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-700/30">
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Projeto</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cliente</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fase</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progresso</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tarefas</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horas</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saúde</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prazo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(p => {
                                const daysLeft = p.deadline ? Math.ceil((new Date(p.deadline).getTime() - Date.now()) / (86400000)) : null;
                                return (
                                    <tr key={p.id} className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors cursor-pointer"
                                        onClick={() => window.location.href = `/dashboard/projects/${p.id}`}>
                                        <td className="px-5 py-3 text-white font-medium max-w-[200px] truncate">{p.name}</td>
                                        <td className="px-5 py-3 text-slate-400">{p.client}</td>
                                        <td className="px-5 py-3"><span className="px-2 py-0.5 text-[10px] font-bold bg-slate-700/50 rounded-md text-slate-300">{PHASE_LABELS[p.phase] || p.phase}</span></td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                                                </div>
                                                <span className="text-xs text-slate-400 font-mono">{p.progress || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-slate-400">
                                            <span className="text-blue-400 font-bold">{p.tasksDone || 0}</span>
                                            <span className="text-slate-600">/{p.tasksTotal || 0}</span>
                                        </td>
                                        <td className="px-5 py-3 text-xs">
                                            <span className="text-slate-400">{p.hoursUsed || 0}h</span>
                                            <span className="text-slate-600"> / {p.hoursEstimated || 0}h</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getHealthBg(p.health)} ${getHealthColor(p.health)}`}>
                                                {getHealthLabel(p.health)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="text-xs">
                                                <span className="text-slate-400">{p.deadline ? new Date(p.deadline).toLocaleDateString("pt-BR") : "—"}</span>
                                                {daysLeft !== null && (
                                                    <span className={`block text-[10px] font-bold mt-0.5 ${daysLeft <= 0 ? "text-red-400" : daysLeft <= 7 ? "text-amber-400" : "text-slate-500"}`}>
                                                        {daysLeft > 0 ? `${daysLeft}d restantes` : daysLeft === 0 ? "Último dia" : `${Math.abs(daysLeft)}d atrasado`}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {projects.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <FolderKanban size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Nenhum projeto ativo</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
