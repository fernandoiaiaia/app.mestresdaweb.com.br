"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    FolderKanban, Clock, CheckCircle2, AlertCircle, Kanban, FileText, Package,
    TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Zap, Target, Loader2,
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    RadialBarChart, RadialBar, Treemap, ResponsiveContainer, XAxis, YAxis,
    CartesianGrid, Tooltip,
} from "recharts";
import { fetchProjectStats, fetchProjects, fetchAllTasks, type DevProject, type DevTask } from "@/lib/projects-api";

/* ═══════════════════════════════════════ */
/* HELPERS                                 */
/* ═══════════════════════════════════════ */
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
};

const activityIcon: Record<string, { icon: typeof CheckCircle2; color: string }> = {
    success: { icon: CheckCircle2, color: "text-blue-400" },
    warning: { icon: AlertCircle, color: "text-amber-400" },
    info: { icon: Clock, color: "text-blue-400" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                <p className="text-xs font-bold text-white mb-1.5">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} className="text-[11px]" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-bold">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const TreemapContent = (props: any) => {
    const { x, y, width, height, name, color } = props;
    const isSmall = width < 50 || height < 40;
    const isTiny = width < 30 || height < 24;
    if (isTiny) {
        return (
            <g>
                <rect x={x} y={y} width={width} height={height} rx={4} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1} strokeOpacity={0.3} />
            </g>
        );
    }
    const fontSize = isSmall ? 9 : Math.min(12, Math.max(9, width / 8));
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} rx={6} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1} strokeOpacity={0.3} />
            <text x={x + width / 2} y={y + height / 2 - (isSmall ? 3 : 6)} textAnchor="middle" fill="#e2e8f0" fontSize={fontSize} fontWeight={700}>{name}</text>
            {!isSmall && <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#94a3b8" fontSize={10}>{props.size}h</text>}
        </g>
    );
};

/* ═══════════════════════════════════════ */
/* COMPONENT                               */
/* ═══════════════════════════════════════ */
export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        activeProjects: number; totalTasks: number; tasksInProgress: number;
        tasksDone: number; tasksTodo: number; tasksBlocked: number;
        totalDeliveries: number; pendingDocuments: number;
    } | null>(null);
    const [projects, setProjects] = useState<DevProject[]>([]);
    const [tasks, setTasks] = useState<DevTask[]>([]);

    useEffect(() => {
        Promise.all([
            fetchProjectStats(),
            fetchProjects(),
            fetchAllTasks(),
        ]).then(([statsRes, projectsRes, tasksRes]) => {
            if (statsRes.success && statsRes.data) setStats(statsRes.data);
            if (projectsRes.success && projectsRes.data) setProjects(projectsRes.data);
            if (tasksRes.success && tasksRes.data) setTasks(tasksRes.data);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    // Compute derived data
    const activeProjects = stats?.activeProjects || 0;
    const tasksInProgress = stats?.tasksInProgress || 0;
    const pendingDocs = stats?.pendingDocuments || 0;
    const totalDeliveries = stats?.totalDeliveries || 0;
    const totalTasks = stats?.totalTasks || 0;
    const tasksDone = stats?.tasksDone || 0;
    const tasksTodo = stats?.tasksTodo || 0;
    const tasksBlocked = stats?.tasksBlocked || 0;

    const statCards = [
        { label: "Projetos Ativos", value: String(activeProjects), icon: FolderKanban, color: "blue", trend: `${activeProjects}`, up: true },
        { label: "Tarefas em Andamento", value: String(tasksInProgress), icon: Kanban, color: "blue", trend: `+${tasksInProgress}`, up: true },
        { label: "Documentos Pendentes", value: String(pendingDocs), icon: FileText, color: "amber", trend: `${pendingDocs}`, up: false },
        { label: "Entregas Realizadas", value: String(totalDeliveries), icon: Package, color: "blue", trend: `+${totalDeliveries}`, up: true },
    ];

    // Task status for donut
    const taskStatus = [
        { name: "Concluídas", value: tasksDone, color: "#3b82f6" },
        { name: "Em Andamento", value: tasksInProgress, color: "#6366f1" },
        { name: "Pendentes", value: tasksTodo, color: "#f59e0b" },
        { name: "Bloqueadas", value: tasksBlocked, color: "#ef4444" },
    ];

    // Project health radar
    const projectHealth = [
        { area: "Prazo", score: projects.length > 0 ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / projects.length) : 0 },
        { area: "Qualidade", score: totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0 },
        { area: "Escopo", score: totalTasks > 0 ? 100 - Math.round((tasksTodo / totalTasks) * 40) : 50 },
        { area: "Comunicação", score: 80 },
        { area: "Orçamento", score: 70 },
        { area: "Satisfação", score: 90 },
    ];

    // Area progress per project
    const areaProgress = projects.slice(0, 4).map((p, i) => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + "…" : p.name,
        value: p.progress,
        fill: ["#3b82f6", "#6366f1", "#a855f7", "#f59e0b"][i % 4],
    }));

    // Tasks grouped by week for area chart (last 7 months)
    const now = new Date();
    const monthlyProgress = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
        const monthStr = d.toLocaleDateString("pt-BR", { month: "short" });
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const monthTasks = tasks.filter(t => {
            const td = new Date(t.createdAt);
            return td >= monthStart && td <= monthEnd;
        });
        return {
            month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
            tarefas: monthTasks.length,
            entregas: monthTasks.filter(t => t.status === "done").length,
            bugs: 0,
        };
    });

    // Hours distribution (estimate from tasks)
    const hoursDistribution = [
        { name: "Dev", size: Math.round(tasks.reduce((a, t) => a + t.estimatedHours, 0) * 0.5) || 1, color: "#3b82f6" },
        { name: "Reuniões", size: Math.round(tasks.length * 0.5) || 1, color: "#6366f1" },
        { name: "Review", size: tasks.filter(t => t.status === "review").length * 2 || 1, color: "#06b6d4" },
        { name: "Testes", size: Math.round(tasks.reduce((a, t) => a + t.estimatedHours, 0) * 0.15) || 1, color: "#f59e0b" },
    ];

    // Recent activity from latest tasks
    const recentActivity = tasks
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map((t, i) => ({
            id: i,
            text: `${t.status === "done" ? "Tarefa concluída" : t.status === "in_progress" ? "Em andamento" : "Atualizada"}: "${t.title}" — ${t.project?.name || ""}`,
            time: new Date(t.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
            type: t.status === "done" ? "success" : t.status === "in_progress" ? "info" : "warning",
        }));

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-slate-400 mt-1">Visão geral dos seus projetos e métricas de performance.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <Activity size={16} className="text-blue-400" />
                        <span className="text-xs font-bold text-blue-400">Todos os sistemas operacionais</span>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => {
                    const colors = colorMap[stat.color];
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all group">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <Icon size={20} className={colors.text} />
                                </div>
                                <div className={`flex items-center gap-0.5 text-xs font-bold ${stat.up ? "text-blue-400" : "text-red-400"}`}>
                                    {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {stat.trend}
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">{stat.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Row 1: Area Chart + Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp size={18} className="text-blue-400" /> Progresso Mensal
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Tarefas criadas e entregas por mês</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={monthlyProgress}>
                            <defs>
                                <linearGradient id="colorTarefas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorEntregas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="tarefas" name="Tarefas" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTarefas)" />
                            <Area type="monotone" dataKey="entregas" name="Entregas" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEntregas)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                        <Target size={18} className="text-blue-400" /> Status das Tarefas
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">Distribuição atual das {totalTasks} tarefas</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={taskStatus.filter(t => t.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                {taskStatus.filter(t => t.value > 0).map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {taskStatus.map((t) => (
                            <div key={t.name} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                                <span className="text-[11px] text-slate-400">{t.name}</span>
                                <span className="text-[11px] font-bold text-white ml-auto">{t.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Row 2: Radar + Radial Bar + Treemap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <Activity size={18} className="text-cyan-400" /> Saúde do Projeto
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">Score por dimensão (0–100)</p>
                    <ResponsiveContainer width="100%" height={260}>
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={projectHealth}>
                            <PolarGrid stroke="rgba(255,255,255,0.06)" />
                            <PolarAngleAxis dataKey="area" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <Target size={18} className="text-blue-400" /> Progresso por Projeto
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">Percentual concluído por projeto</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%" data={areaProgress} startAngle={90} endAngle={-270}>
                            <RadialBar background={{ fill: "rgba(255,255,255,0.03)" }} dataKey="value" cornerRadius={10} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {areaProgress.map((a) => (
                            <div key={a.name} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.fill }} />
                                <span className="text-[11px] text-slate-400 truncate">{a.name}</span>
                                <span className="text-[11px] font-bold text-white ml-auto">{a.value}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <FolderKanban size={18} className="text-pink-400" /> Distribuição de Horas
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">Horas estimadas por categoria</p>
                    <ResponsiveContainer width="100%" height={268}>
                        <Treemap data={hoursDistribution} dataKey="size" aspectRatio={4 / 3} content={<TreemapContent />} />
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-slate-400" /> Atividades Recentes
                </h2>
                {recentActivity.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recentActivity.map((item) => {
                            const ai = activityIcon[item.type];
                            const Icon = ai.icon;
                            return (
                                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/30 border border-white/[0.03] hover:border-white/[0.08] transition-all hover:bg-slate-900/50">
                                    <Icon size={18} className={`mt-0.5 shrink-0 ${ai.color}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white leading-relaxed line-clamp-2">{item.text}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 font-medium">{item.time}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 py-8 text-center">Nenhuma atividade recente</p>
                )}
            </motion.div>
        </div>
    );
}
