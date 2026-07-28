"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    ArrowLeft, FolderKanban, Clock, CheckCircle2, AlertCircle, Users, Calendar,
    FileText, MessageSquare, Package, Activity, Paperclip, TrendingUp,
    ArrowUpRight, ArrowDownRight, Target, Zap, Code2, Kanban, Loader2, ExternalLink,
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { fetchProject, phaseToStatusLabel, formatDate, type DevProjectDetail } from "@/lib/projects-api";

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    "Em Andamento": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    "Planejamento": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    "Concluído": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
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

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<DevProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;
        fetchProject(projectId).then((res) => {
            if (res.success && res.data) setProject(res.data);
        }).finally(() => setLoading(false));
    }, [projectId]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <FolderKanban size={48} className="text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Projeto não encontrado</h2>
                <p className="text-slate-400 mb-4">O projeto solicitado não existe.</p>
                <button onClick={() => router.push("/dashboard/projects")} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-colors">
                    ← Voltar aos Projetos
                </button>
            </div>
        );
    }

    const statusLabel = phaseToStatusLabel(project.phase);
    const sc = statusColors[statusLabel] || statusColors["Em Andamento"];

    // Task breakdown
    const taskBreakdown = [
        { name: "Concluídas", value: project.tasks.filter(t => t.status === "done").length, color: "#3b82f6" },
        { name: "Em Andamento", value: project.tasks.filter(t => t.status === "in_progress").length, color: "#6366f1" },
        { name: "Pendentes", value: project.tasks.filter(t => t.status === "todo").length, color: "#f59e0b" },
        { name: "Em Revisão", value: project.tasks.filter(t => t.status === "review").length, color: "#a855f7" },
    ];
    const totalTasks = project.tasks.length;
    const completedTasks = taskBreakdown[0].value;
    const pendingTasks = taskBreakdown[2].value;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Sprint data for bar chart
    const sprintData = (project.sprints || []).map(s => ({
        name: s.name,
        tarefas: s.tasks?.length || 0,
        concluidas: s.tasks?.filter((t: any) => t.status === "done").length || 0,
    }));

    // Weekly progress — group tasks by creation week (last 6 weeks)
    const now = new Date();
    const weeklyProgress: { week: string; tasks: number; bugs: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const weekTasks = project.tasks.filter(t => {
            const d = new Date(t.createdAt);
            return d >= weekStart && d < weekEnd;
        });
        weeklyProgress.push({
            week: `Sem ${6 - i}`,
            tasks: weekTasks.filter(t => t.status === "done").length,
            bugs: 0, // bugs tracked separately
        });
    }

    // Health radar data
    const healthData = [
        { area: "Prazo", score: project.progress >= 70 ? 85 : project.progress >= 40 ? 65 : 40 },
        { area: "Qualidade", score: Math.min(95, completionRate + 20) },
        { area: "Escopo", score: totalTasks > 0 ? 100 - Math.round((pendingTasks / totalTasks) * 40) : 50 },
        { area: "Entrega", score: completionRate },
        { area: "Equipe", score: Math.min(95, project.members.length * 22) },
    ];

    const statsData = [
        { label: "Progresso", value: `${project.progress}%`, icon: TrendingUp, color: "blue", trend: `+${Math.round(project.progress / 4)}%`, up: true },
        { label: "Total de Tarefas", value: String(totalTasks), icon: CheckCircle2, color: "blue", trend: `${completedTasks} ok`, up: true },
        { label: "Pendentes", value: String(pendingTasks), icon: AlertCircle, color: "amber", trend: `${pendingTasks}`, up: false },
        { label: "Membros", value: String(project.members.length), icon: Users, color: "purple", trend: "Ativo", up: true },
    ];

    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
        cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
        amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
        purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    };

    // Documents
    const documents = (project.documents || []).map(d => ({
        name: d.title,
        type: d.docType.toUpperCase(),
        date: formatDate(d.createdAt),
    }));

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link href="/dashboard/projects" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-5 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Voltar aos Projetos
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl ${sc.bg} border ${sc.border} flex items-center justify-center`}>
                            <FolderKanban size={28} className={sc.text} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${sc.bg} ${sc.text}`}>{statusLabel}</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1.5"><Calendar size={13} /> {formatDate(project.deadline)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <Link href={`/dashboard/projects/${project.id}/backlog`}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors">
                            <Kanban size={16} className="text-blue-400" />
                            <span className="text-xs font-bold text-blue-400">Backlog</span>
                        </Link>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <Activity size={16} className="text-blue-400" />
                            <span className="text-xs font-bold text-blue-400">{completionRate}% concluído</span>
                        </div>
                    </div>
                </div>
                <p className="text-slate-400 mt-3 leading-relaxed max-w-3xl">Cliente: {project.client}</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat, i) => {
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

            {/* Progress Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                        <Zap size={16} className="text-blue-400" /> Progresso Geral
                    </span>
                    <span className="text-white font-bold text-lg">{project.progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-900/50 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 1, ease: "easeOut" }} />
                </div>
            </motion.div>

            {/* Row 1: Area Chart + Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp size={18} className="text-blue-400" /> Progresso Semanal
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Tarefas concluídas por semana</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={weeklyProgress}>
                            <defs>
                                <linearGradient id="gTasks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="tasks" name="Tarefas" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#gTasks)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                        <Target size={18} className="text-blue-400" /> Status das Tarefas
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">Distribuição das {totalTasks} tarefas</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={taskBreakdown.filter(t => t.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                {taskBreakdown.filter(t => t.value > 0).map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {taskBreakdown.map((t) => (
                            <div key={t.name} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                                <span className="text-[11px] text-slate-400">{t.name}</span>
                                <span className="text-[11px] font-bold text-white ml-auto">{t.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Row 2: Sprint Performance + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Package size={18} className="text-purple-400" /> Performance por Sprint
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Planejadas vs. Concluídas</p>
                        </div>
                    </div>
                    {sprintData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={sprintData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="tarefas" name="Planejadas" fill="#3b82f6" radius={[6, 6, 0, 0]} fillOpacity={0.35} />
                                <Bar dataKey="concluidas" name="Concluídas" fill="#3b82f6" radius={[6, 6, 0, 0]} fillOpacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[260px] text-slate-500 text-sm">Nenhuma sprint cadastrada</div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Activity size={18} className="text-cyan-400" /> Saúde do Projeto
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Score por dimensão (0–100)</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={healthData}>
                            <PolarGrid stroke="rgba(255,255,255,0.06)" />
                            <PolarAngleAxis dataKey="area" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Row 3: Team + Documents */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                        <Users size={18} className="text-blue-400" /> Equipe ({project.members.length})
                    </h2>
                    {project.members.length > 0 ? (
                        <div className="space-y-3">
                            {project.members.map((member) => {
                                const initials = member.user.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
                                return (
                                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-white/[0.03] hover:border-white/[0.08] transition-all group">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 group-hover:scale-110 transition-transform">
                                            {initials}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">{member.user.name}</p>
                                            <p className="text-[11px] text-slate-500">{member.role}</p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 py-8 text-center">Nenhum membro atribuído ao projeto</p>
                    )}
                </motion.div>

                {/* Documents */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                        <FileText size={18} className="text-purple-400" /> Documentos
                    </h2>
                    {documents.length > 0 ? (
                        <div className="space-y-2">
                            {documents.map((doc, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-white/[0.03] hover:border-white/[0.08] transition-all cursor-pointer group">
                                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                        <Paperclip size={14} className="text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium truncate">{doc.name}</p>
                                        <p className="text-[10px] text-slate-500">{doc.type} • {doc.date}</p>
                                    </div>
                                    <ExternalLink size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 py-8 text-center">Nenhum documento cadastrado</p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
