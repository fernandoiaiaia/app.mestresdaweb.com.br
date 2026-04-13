"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Kanban, Clock, User, Tag, Loader2, FolderOpen } from "lucide-react";
import { fetchAllTasks, priorityLabel, formatShortDate, type DevTask } from "@/lib/projects-api";

const statusColumns: { key: string; title: string; color: string }[] = [
    { key: "todo", title: "A Fazer", color: "slate" },
    { key: "in_progress", title: "Em Progresso", color: "blue" },
    { key: "review", title: "Em Revisão", color: "amber" },
    { key: "done", title: "Concluído", color: "blue" },
];

const colColors: Record<string, { dot: string; border: string }> = {
    slate: { dot: "bg-slate-400", border: "border-slate-500/20" },
    blue: { dot: "bg-blue-400", border: "border-blue-500/20" },
    amber: { dot: "bg-amber-400", border: "border-amber-500/20" },
};

const priorityColors: Record<string, string> = {
    "Alta": "text-red-400 bg-red-500/10",
    "Média": "text-amber-400 bg-amber-500/10",
    "Baixa": "text-slate-400 bg-slate-500/10",
    "Crítica": "text-red-500 bg-red-600/10",
};

export default function BacklogPage() {
    const [tasks, setTasks] = useState<DevTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllTasks().then((res) => {
            if (res.success && res.data) setTasks(res.data);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    const columns = statusColumns.map(col => ({
        ...col,
        items: tasks.filter(t => t.status === col.key),
    }));

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">BackLog</h1>
                <p className="text-slate-400 mt-1">Visualize o andamento das tarefas de todos os projetos.</p>
            </motion.div>

            {tasks.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center py-20 bg-slate-800/20 border border-white/[0.04] rounded-2xl">
                    <FolderOpen size={48} className="text-slate-600 mb-4" />
                    <p className="text-lg font-bold text-slate-400">Nenhuma tarefa encontrada</p>
                    <p className="text-sm text-slate-500 mt-1">As tarefas aparecerão aqui quando forem criadas.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {columns.map((col, ci) => {
                        const cc = colColors[col.color];
                        return (
                            <motion.div key={col.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}
                                className="bg-slate-800/30 backdrop-blur-sm border border-white/[0.04] rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={`w-2.5 h-2.5 rounded-full ${cc.dot}`} />
                                    <h3 className="text-sm font-bold text-white">{col.title}</h3>
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-md ml-auto">{col.items.length}</span>
                                </div>

                                <div className="space-y-3">
                                    {col.items.map((item) => {
                                        const pLabel = priorityLabel(item.priority);
                                        return (
                                            <div key={item.id} className={`p-3 rounded-xl bg-slate-900/50 border ${cc.border} hover:border-white/[0.1] transition-colors cursor-pointer`}>
                                                <h4 className="text-sm font-semibold text-white mb-2 leading-snug">{item.title}</h4>
                                                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                                    <span className={`px-1.5 py-0.5 rounded font-bold ${priorityColors[pLabel] || "text-slate-400 bg-slate-500/10"}`}>{pLabel}</span>
                                                    <span className="text-slate-500 flex items-center gap-1"><Tag size={10} />{item.project?.name || "—"}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                                                    <span className="flex items-center gap-1"><User size={10} />{item.assignee?.name || "Equipe MW"}</span>
                                                    <span className="flex items-center gap-1"><Clock size={10} />{formatShortDate(item.deadline)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
