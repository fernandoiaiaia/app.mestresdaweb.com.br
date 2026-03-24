"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Kanban, Clock, User, FolderKanban, Loader2 } from "lucide-react";
import { fetchProjectTasks, fetchProject, priorityLabel, formatShortDate, type DevTask } from "@/lib/projects-api";

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

export default function ProjectBacklogPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [tasks, setTasks] = useState<DevTask[]>([]);
    const [projectName, setProjectName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;
        Promise.all([
            fetchProjectTasks(projectId),
            fetchProject(projectId),
        ]).then(([tasksRes, projectRes]) => {
            if (tasksRes.success && tasksRes.data) setTasks(tasksRes.data);
            if (projectRes.success && projectRes.data) setProjectName(projectRes.data.name);
        }).finally(() => setLoading(false));
    }, [projectId]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    if (!projectName) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <FolderKanban size={48} className="text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Projeto não encontrado</h2>
                <p className="text-slate-400 mb-4">O backlog deste projeto não existe.</p>
                <button onClick={() => router.push("/dashboard/projects")} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-colors">
                    ← Voltar aos Projetos
                </button>
            </div>
        );
    }

    const columns = statusColumns.map(col => ({
        ...col,
        items: tasks.filter(t => t.status === col.key),
    }));
    const totalItems = tasks.length;

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link href={`/dashboard/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-5 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Voltar ao Projeto
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Kanban size={28} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Backlog</h1>
                            <p className="text-sm text-slate-400 mt-1">{projectName}</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <Kanban size={16} className="text-blue-400" />
                        <span className="text-xs font-bold text-blue-400">{totalItems} tarefas no backlog</span>
                    </div>
                </div>
            </motion.div>

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
                                {col.items.length === 0 && (
                                    <div className="text-center py-6 text-slate-600 text-xs">Nenhuma tarefa</div>
                                )}
                                {col.items.map((item) => {
                                    const pLabel = priorityLabel(item.priority);
                                    return (
                                        <div key={item.id} className={`p-3 rounded-xl bg-slate-900/50 border ${cc.border} hover:border-white/[0.1] transition-colors cursor-pointer`}>
                                            <h4 className="text-sm font-semibold text-white mb-2 leading-snug">{item.title}</h4>
                                            <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                                <span className={`px-1.5 py-0.5 rounded font-bold ${priorityColors[pLabel] || "text-slate-400 bg-slate-500/10"}`}>{pLabel}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <User size={10} />
                                                    <User size={10} className="-ml-1.5" />
                                                    <User size={10} className="-ml-1.5" />
                                                    {item.assignee?.name || "Time Empresa"}
                                                </span>
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
        </div>
    );
}
