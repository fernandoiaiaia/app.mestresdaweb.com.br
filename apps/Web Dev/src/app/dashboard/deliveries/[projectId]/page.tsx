"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, CheckCircle2,
    AlertTriangle, Plus, Calendar, ArrowLeft, Rocket, PlayCircle,
    ListTodo, Timer, Target, Trash2, Monitor, Check,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

const HEALTH_COLORS: Record<string, string> = {
    on_track: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    at_risk: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    delayed: "text-red-400 bg-red-500/10 border-red-500/20",
};
const HEALTH_LABELS: Record<string, string> = { on_track: "No Prazo", at_risk: "Em Risco", delayed: "Atrasado" };

type SprintStatus = "planned" | "active" | "completed";
type TaskPriority = "low" | "medium" | "high" | "critical";

const SPRINT_STATUS_CONFIG: Record<SprintStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    planned: { label: "Planejada", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", icon: <span className="text-slate-400">○</span> },
    active: { label: "Em Andamento", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: <PlayCircle size={11} /> },
    completed: { label: "Concluída", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: <CheckCircle2 size={11} /> },
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
    low: "text-slate-400 bg-slate-500/10",
    medium: "text-blue-400 bg-blue-500/10",
    high: "text-amber-400 bg-amber-500/10",
    critical: "text-red-400 bg-red-500/10",
};

const STATUS_LABELS: Record<string, string> = {
    todo: "A Fazer", in_progress: "Em Dev", review: "Revisão", done: "Concluída",
};

export default function DeliveryProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sprints, setSprints] = useState<any[]>([]);
    const [loadingSprints, setLoadingSprints] = useState(true);
    const [showNewSprint, setShowNewSprint] = useState(false);
    const [newSprint, setNewSprint] = useState({ name: "", goal: "", startDate: "", endDate: "" });
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [projectTasks, setProjectTasks] = useState<any[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);

    const fetchProject = useCallback(async () => {
        setLoading(true);
        const res = await api<any>(`/api/dev-projects/${projectId}`);
        if (res.success && res.data) setProject(res.data);
        setLoading(false);
    }, [projectId]);

    const fetchSprints = useCallback(async () => {
        setLoadingSprints(true);
        const res = await api<any[]>(`/api/dev-sprints/project/${projectId}`);
        if (res.success && res.data) setSprints(res.data);
        setLoadingSprints(false);
    }, [projectId]);

    const fetchTasks = useCallback(async () => {
        setLoadingTasks(true);
        const res = await api<any[]>(`/api/dev-projects/tasks/all?projectId=${projectId}`);
        if (res.success && res.data) setProjectTasks(res.data);
        setLoadingTasks(false);
    }, [projectId]);

    useEffect(() => { fetchProject(); fetchSprints(); fetchTasks(); }, [fetchProject, fetchSprints, fetchTasks]);

    const toggleTask = (taskId: string) => {
        setSelectedTaskIds(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const addSprint = async () => {
        if (!newSprint.name.trim()) return;
        const res = await api<any>("/api/dev-sprints/project/" + projectId, {
            method: "POST",
            body: { ...newSprint, taskIds: selectedTaskIds },
        });
        if (res.success) {
            setNewSprint({ name: "", goal: "", startDate: "", endDate: "" });
            setSelectedTaskIds([]);
            setShowNewSprint(false);
            await fetchSprints();
            await fetchTasks();
        }
    };

    const updateSprintStatus = async (sprintId: string, status: SprintStatus) => {
        await api(`/api/dev-sprints/${sprintId}`, {
            method: "PATCH",
            body: { status },
        });
        await fetchSprints();
    };

    const removeSprint = async (sprintId: string) => {
        await api(`/api/dev-sprints/${sprintId}`, { method: "DELETE" });
        await fetchSprints();
        await fetchTasks();
    };

    // Get task IDs already assigned to any sprint
    const assignedTaskIds = new Set(sprints.flatMap((s: any) => (s.tasks || []).map((t: any) => t.id)));
    // Available tasks = all project tasks not yet in a sprint
    const availableTasks = projectTasks.filter(t => !assignedTaskIds.has(t.id));

    if (loading) return (
        <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin" />
        </div>
    );

    if (!project) return (
        <div className="p-6 md:p-8 flex flex-col items-center justify-center py-32">
            <h3 className="text-lg font-bold text-white mb-2">Projeto não encontrado</h3>
            <button onClick={() => router.push("/dashboard/deliveries")} className="text-sm text-blue-400 hover:underline">Voltar</button>
        </div>
    );

    const activeSprints = sprints.filter(s => s.status === "active").length;
    const completedSprints = sprints.filter(s => s.status === "completed").length;
    const totalSprintTasks = sprints.reduce((sum: number, s: any) => sum + (s.tasks?.length || 0), 0);
    const doneSprintTasks = sprints.reduce((sum: number, s: any) => sum + (s.tasks || []).filter((t: any) => t.status === "done").length, 0);

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-[1200px] mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button onClick={() => router.push("/dashboard/deliveries")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors mb-4">
                    <ArrowLeft size={14} /> Voltar às Entregas
                </button>
            </motion.div>

            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 via-slate-900 to-purple-900/20" />
                <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-purple-500/8 to-transparent rounded-full blur-3xl" />
                <div className="relative p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md border mb-3 ${HEALTH_COLORS[project.health] || HEALTH_COLORS.on_track}`}>
                                {project.health === "on_track" ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                                {HEALTH_LABELS[project.health] || "No Prazo"}
                            </span>
                            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                <Building2 size={14} /> {project.client}
                            </p>
                        </div>
                        <Link href={`/dashboard/projects/${project.id}`}
                            className="shrink-0 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-xs font-bold text-slate-400 hover:text-white hover:border-blue-500/30 transition-all">
                            Ver Projeto →
                        </Link>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                        {[
                            { label: "Sprints", value: sprints.length, icon: Rocket, color: "text-purple-400" },
                            { label: "Ativas", value: activeSprints, icon: PlayCircle, color: "text-blue-400" },
                            { label: "Concluídas", value: completedSprints, icon: CheckCircle2, color: "text-blue-400" },
                            { label: "Telas", value: `${doneSprintTasks}/${totalSprintTasks}`, icon: Monitor, color: "text-cyan-400" },
                        ].map((c, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-800/40 border border-white/[0.06]">
                                <c.icon size={14} className={`${c.color} opacity-70 mb-1.5`} />
                                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                                <p className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mt-0.5">{c.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* New Sprint Button */}
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                    <Rocket size={14} className="text-purple-400" /> Sprints & Entregas
                </h2>
                <button onClick={() => { setShowNewSprint(!showNewSprint); setSelectedTaskIds([]); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg text-xs font-bold hover:bg-blue-600/20 transition-colors">
                    <Plus size={12} /> Nova Sprint
                </button>
            </div>

            {/* New Sprint Form */}
            <AnimatePresence>
                {showNewSprint && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-5 rounded-xl bg-slate-800/40 border border-blue-600/20 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Nome da Sprint</label>
                                    <input type="text" value={newSprint.name} onChange={e => setNewSprint({ ...newSprint, name: e.target.value })}
                                        placeholder="Ex: Sprint 1 — Autenticação"
                                        className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600/50" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Objetivo</label>
                                    <input type="text" value={newSprint.goal} onChange={e => setNewSprint({ ...newSprint, goal: e.target.value })}
                                        placeholder="Ex: Entregar módulo de login"
                                        className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600/50" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Início</label>
                                    <input type="date" value={newSprint.startDate} onChange={e => setNewSprint({ ...newSprint, startDate: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-blue-600/50" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Fim</label>
                                    <input type="date" value={newSprint.endDate} onChange={e => setNewSprint({ ...newSprint, endDate: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-blue-600/50" />
                                </div>
                            </div>

                            {/* Task/Screen Selector — grouped by Platform */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                                    <Monitor size={11} /> Selecionar Telas ({selectedTaskIds.length} selecionadas)
                                </label>
                                {loadingTasks ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin" />
                                    </div>
                                ) : availableTasks.length > 0 ? (() => {
                                    // Group tasks by platform (extracted from epic: "Platform — Module")
                                    const grouped: Record<string, typeof availableTasks> = {};
                                    availableTasks.forEach(task => {
                                        const platform = task.epic
                                            ? task.epic.split("—")[0]?.trim() || task.epic.split("-")[0]?.trim() || "Sem Plataforma"
                                            : "Sem Plataforma";
                                        if (!grouped[platform]) grouped[platform] = [];
                                        grouped[platform].push(task);
                                    });
                                    const platforms = Object.keys(grouped).sort();

                                    return (
                                        <div className="max-h-[320px] overflow-y-auto rounded-lg border border-white/[0.06] bg-slate-900/30">
                                            {platforms.map(platform => {
                                                const tasks = grouped[platform];
                                                const allSelected = tasks.every(t => selectedTaskIds.includes(t.id));
                                                const someSelected = tasks.some(t => selectedTaskIds.includes(t.id));
                                                const togglePlatform = () => {
                                                    if (allSelected) {
                                                        setSelectedTaskIds(prev => prev.filter(id => !tasks.some(t => t.id === id)));
                                                    } else {
                                                        setSelectedTaskIds(prev => [...new Set([...prev, ...tasks.map(t => t.id)])]);
                                                    }
                                                };
                                                return (
                                                    <div key={platform}>
                                                        {/* Platform Header */}
                                                        <button type="button" onClick={togglePlatform}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-800/60 hover:bg-slate-800/80 border-b border-white/[0.04] transition-colors sticky top-0 z-10">
                                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                                                allSelected ? "bg-blue-600 border-blue-600" : someSelected ? "bg-blue-600/40 border-blue-600/60" : "bg-transparent border-slate-500"
                                                            }`}>
                                                                {(allSelected || someSelected) && <Check size={12} className="text-white" />}
                                                            </div>
                                                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{platform}</span>
                                                            <span className="ml-auto text-[10px] text-slate-500 font-bold">{tasks.filter(t => selectedTaskIds.includes(t.id)).length}/{tasks.length}</span>
                                                        </button>
                                                        {/* Tasks */}
                                                        {tasks.map(task => {
                                                            const isSelected = selectedTaskIds.includes(task.id);
                                                            const priorityColor = PRIORITY_COLORS[(task.priority as TaskPriority)] || PRIORITY_COLORS.medium;
                                                            const moduleName = task.epic?.includes("—") ? task.epic.split("—").slice(1).join("—").trim() : "";
                                                            return (
                                                                <button key={task.id} type="button" onClick={() => toggleTask(task.id)}
                                                                    className={`w-full flex items-center gap-3 px-3 pl-6 py-2 text-left transition-all border-b border-white/[0.02] ${
                                                                        isSelected ? "bg-blue-500/5 hover:bg-blue-500/10" : "hover:bg-slate-800/40"
                                                                    }`}>
                                                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                                                        isSelected ? "bg-blue-600 border-blue-600" : "bg-transparent border-slate-600"
                                                                    }`}>
                                                                        {isSelected && <Check size={10} className="text-white" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm font-medium truncate ${isSelected ? "text-blue-400" : "text-white"}`}>{task.title}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            {moduleName && <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{moduleName}</span>}
                                                                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${priorityColor}`}>
                                                                                {task.priority === "critical" ? "Crítica" : task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                                                                            </span>
                                                                            <span className="text-[9px] text-slate-600">{STATUS_LABELS[task.status] || task.status}</span>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })() : (
                                    <div className="text-center py-6 text-slate-500 bg-slate-900/30 rounded-lg border border-white/[0.06]">
                                        <Monitor size={20} className="mx-auto mb-1.5 opacity-40" />
                                        <p className="text-xs">Todas as telas já estão em sprints</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button onClick={() => { setShowNewSprint(false); setSelectedTaskIds([]); }} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">Cancelar</button>
                                <button onClick={addSprint}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20">
                                    Criar Sprint
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Sprints */}
            {loadingSprints && (
                <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Sprint List */}
            {!loadingSprints && (
                <div className="space-y-3">
                    {sprints.length > 0 ? sprints.map((sprint, i) => {
                        const st = SPRINT_STATUS_CONFIG[sprint.status as SprintStatus] || SPRINT_STATUS_CONFIG.planned;
                        const daysLeft = sprint.endDate ? Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86400000) : null;
                        const sprintTasks = sprint.tasks || [];
                        const doneTasks = sprintTasks.filter((t: any) => t.status === "done").length;
                        return (
                            <motion.div key={sprint.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                className={`rounded-xl border p-5 transition-all group ${
                                    sprint.status === "active" ? "bg-blue-500/5 border-blue-500/20"
                                    : sprint.status === "completed" ? "bg-blue-500/5 border-blue-500/20"
                                    : "bg-slate-800/40 border-white/[0.06]"
                                }`}>
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <h3 className="text-base font-bold text-white">{sprint.name}</h3>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border ${st.bg} ${st.color}`}>
                                                {st.icon} {st.label}
                                            </span>
                                        </div>
                                        {sprint.goal && <p className="text-sm text-slate-400 mb-2">{sprint.goal}</p>}
                                        <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                            {sprint.startDate && <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(sprint.startDate).toLocaleDateString("pt-BR")}</span>}
                                            {sprint.endDate && <span className="flex items-center gap-1"><Target size={10} /> {new Date(sprint.endDate).toLocaleDateString("pt-BR")}</span>}
                                            {daysLeft !== null && sprint.status !== "completed" && (
                                                <span className={`font-bold ${daysLeft <= 0 ? "text-red-400" : daysLeft <= 3 ? "text-amber-400" : "text-blue-400"}`}>
                                                    <Timer size={10} className="inline mr-0.5" />
                                                    {daysLeft > 0 ? `${daysLeft}d restantes` : daysLeft === 0 ? "Último dia" : `${Math.abs(daysLeft)}d atrasada`}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 font-bold text-cyan-400">
                                                <Monitor size={10} /> {doneTasks}/{sprintTasks.length} telas
                                            </span>
                                        </div>

                                        {/* Sprint Tasks */}
                                        {sprintTasks.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {sprintTasks.map((task: any) => (
                                                    <span key={task.id}
                                                        className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg border ${
                                                            task.status === "done"
                                                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20 line-through opacity-70"
                                                                : task.status === "in_progress"
                                                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                                : "bg-slate-700/30 text-slate-300 border-slate-600/20"
                                                        }`}>
                                                        {task.status === "done" && <CheckCircle2 size={9} />}
                                                        {task.title.length > 30 ? task.title.substring(0, 30) + "…" : task.title}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {sprint.status === "planned" && (
                                            <button onClick={() => updateSprintStatus(sprint.id, "active")}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">
                                                <PlayCircle size={12} /> Iniciar
                                            </button>
                                        )}
                                        {sprint.status === "active" && (
                                            <button onClick={() => updateSprintStatus(sprint.id, "completed")}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">
                                                <CheckCircle2 size={12} /> Concluir
                                            </button>
                                        )}
                                        {sprint.status === "completed" && (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-400">
                                                <CheckCircle2 size={12} /> Entregue
                                            </span>
                                        )}
                                        <button onClick={() => removeSprint(sprint.id)}
                                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                                <Rocket size={24} className="text-purple-400" />
                            </div>
                            <h3 className="text-base font-bold text-white mb-1">Nenhuma sprint criada</h3>
                            <p className="text-sm text-slate-500 max-w-sm">Clique em &quot;+ Nova Sprint&quot; para organizar as entregas deste projeto.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
