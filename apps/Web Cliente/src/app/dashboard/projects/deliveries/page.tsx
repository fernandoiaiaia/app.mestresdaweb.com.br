"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Package, CheckCircle2, Clock, ExternalLink, Loader2,
    FolderOpen, PlayCircle, CalendarDays, ListChecks,
} from "lucide-react";
import {
    fetchAllSprints,
    formatDate,
    type DevSprintFull,
} from "@/lib/projects-api";

const sprintStatusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
    completed: { label: "Entregue", icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    active:    { label: "Em Andamento", icon: PlayCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    planned:   { label: "Planejada", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

export default function DeliveriesPage() {
    const router = useRouter();
    const [sprints, setSprints] = useState<DevSprintFull[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        fetchAllSprints().then((res) => {
            if (res.success && res.data) setSprints(res.data);
        }).finally(() => setLoading(false));
    }, []);

    const filtered = filter === "all" ? sprints : sprints.filter(s => s.status === filter);

    const counts = {
        all: sprints.length,
        completed: sprints.filter(s => s.status === "completed").length,
        active: sprints.filter(s => s.status === "active").length,
        planned: sprints.filter(s => s.status === "planned").length,
    };

    if (loading) {
        return (
            <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div id="tour-page-deliveries-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">Entregas</h1>
                <p className="text-slate-400 mt-1">Histórico de entregas e progresso dos sprints dos seus projetos.</p>
            </motion.div>

            {/* Stat Cards */}
            <motion.div id="tour-page-deliveries-filters" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                    { key: "all", label: "Total", icon: ListChecks, color: "text-white", bg: "bg-slate-800/40", border: "border-white/[0.06]" },
                    { key: "completed", label: "Entregues", icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { key: "active", label: "Em Andamento", icon: PlayCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { key: "planned", label: "Planejadas", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                ] as const).map(({ key, label, icon: Icon, color, bg, border }) => (
                    <button key={key} onClick={() => setFilter(key)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${filter === key ? `${bg} ${border} ring-1 ring-white/10` : "bg-slate-800/20 border-white/[0.04] hover:border-white/[0.08]"}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <Icon size={14} className={color} />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">{label}</span>
                        </div>
                        <p className={`text-xl font-black ${color}`}>{counts[key]}</p>
                    </button>
                ))}
            </motion.div>

            {/* Empty State */}
            {filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center py-20 bg-slate-800/20 border border-white/[0.04] rounded-2xl">
                    <FolderOpen size={48} className="text-slate-600 mb-4" />
                    <p className="text-lg font-bold text-slate-400">
                        {filter === "all" ? "Nenhuma entrega registrada" : "Nenhuma entrega nesta categoria"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">As entregas aparecerão aqui conforme os sprints são criados e concluídos.</p>
                </motion.div>
            ) : (
                <div id="tour-page-deliveries-list" className="space-y-4">
                    {filtered.map((sprint, i) => {
                        const sc = sprintStatusConfig[sprint.status] || sprintStatusConfig.planned;
                        const StatusIcon = sc.icon;

                        const tasks = (sprint.tasks as { id: string; status: string }[]) || [];
                        const total = tasks.length;
                        const done = tasks.filter(t => t.status === "done").length;
                        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                        return (
                            <motion.div
                                key={sprint.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`w-10 h-10 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center shrink-0 mt-0.5`}>
                                            <Package size={20} className={sc.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-base font-bold text-white">{sprint.name}</h3>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${sc.bg} ${sc.color}`}>
                                                    <StatusIcon size={10} />{sc.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                                                <span>{sprint.project?.name || "—"}</span>
                                                <span className="text-slate-600">•</span>
                                                <span>{sprint.project?.client || "—"}</span>
                                                {(sprint.startDate || sprint.endDate) && (
                                                    <>
                                                        <span className="text-slate-600">•</span>
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays size={10} />
                                                            {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                                                        </span>
                                                    </>
                                                )}
                                            </p>
                                            {sprint.goal && (
                                                <p className="text-sm text-slate-300 mt-2 leading-relaxed line-clamp-2">{sprint.goal}</p>
                                            )}
                                            {/* Task progress */}
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-slate-900/50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all"
                                                        style={{ width: `${progress}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 shrink-0">{done}/{total} tarefas</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={() => sprint.project?.id && router.push(`/dashboard/projects/${sprint.project.id}`)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                                            title="Ver projeto"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
