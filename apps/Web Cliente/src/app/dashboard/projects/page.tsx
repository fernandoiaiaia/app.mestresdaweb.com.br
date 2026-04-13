"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FolderKanban, Clock, CheckCircle2, AlertCircle, ArrowRight, Loader2, FolderOpen } from "lucide-react";
import Link from "next/link";
import { fetchProjects, phaseToStatusLabel, formatDate, type DevProject } from "@/lib/projects-api";

const statusColors: Record<string, { bg: string; text: string }> = {
    "Em Andamento": { bg: "bg-blue-500/10", text: "text-blue-400" },
    "Planejamento": { bg: "bg-amber-500/10", text: "text-amber-400" },
    "Concluído": { bg: "bg-blue-500/10", text: "text-blue-400" },
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<DevProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects().then((res) => {
            if (res.success && res.data) setProjects(res.data);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="p-6 md:p-8 space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold tracking-tight">Todos os Projetos</h1>
                    <p className="text-slate-400 mt-1">Acompanhe o andamento de todos os seus projetos.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center py-20 bg-slate-800/20 border border-white/[0.04] rounded-2xl">
                    <FolderOpen size={48} className="text-slate-600 mb-4" />
                    <p className="text-lg font-bold text-slate-400">Nenhum projeto encontrado</p>
                    <p className="text-sm text-slate-500 mt-1">Os projetos aparecerão aqui quando forem criados.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div id="tour-page-projects-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">Todos os Projetos</h1>
                <p className="text-slate-400 mt-1">Acompanhe o andamento de todos os seus projetos.</p>
            </motion.div>

            <div id="tour-page-projects-list" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {projects.map((project, i) => {
                    const statusLabel = phaseToStatusLabel(project.phase);
                    const sc = statusColors[statusLabel] || statusColors["Em Andamento"];
                    const pending = project.tasksTotal - project.tasksDone;
                    return (
                        <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-all group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <FolderKanban size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white">{project.name}</h3>
                                        <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${sc.bg} ${sc.text}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors mt-1" />
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-slate-400 font-medium">Progresso</span>
                                    <span className="text-white font-bold">{project.progress}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                                        style={{ width: `${project.progress}%` }} />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="text-blue-400" />
                                    <span>{project.tasksDone} concluídas</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <AlertCircle size={12} className="text-amber-400" />
                                    <span>{pending} pendentes</span>
                                </div>
                                <div className="flex items-center gap-1.5 ml-auto">
                                    <Clock size={12} />
                                    <span>{formatDate(project.deadline)}</span>
                                </div>
                            </div>
                        </motion.div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
