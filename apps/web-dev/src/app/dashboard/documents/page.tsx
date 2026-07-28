"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Building2, ChevronRight, FolderKanban, Clock, CheckCircle2, AlertTriangle, Flame } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

const HEALTH_COLORS: Record<string, string> = {
    on_track: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    at_risk: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    delayed: "text-red-400 bg-red-500/10 border-red-500/20",
};
const HEALTH_LABELS: Record<string, string> = { on_track: "No Prazo", at_risk: "Em Risco", delayed: "Atrasado" };
const PHASE_LABELS: Record<string, string> = { requirements: "Requisitos", discovery: "Discovery", development: "Desenvolvimento", testing: "Testes", documentation: "Documentação", delivery: "Entrega" };

export default function DocumentsPage() {
    const [search, setSearch] = useState("");
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        const res = await api<any[]>("/api/dev-projects?archived=false");
        if (res.success && res.data) setProjects(res.data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const filtered = projects.filter(p =>
        !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.client?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
                <p className="text-slate-400 mt-1">Selecione um projeto para visualizar e gerenciar seus documentos.</p>
            </motion.div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar projeto ou cliente..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50"
                />
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Project Cards Grid */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((project, i) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link href={`/dashboard/documents/${project.id}`}>
                                <div className="group p-5 rounded-xl bg-slate-800/40 border border-white/[0.06] hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/20 to-emerald-500/10 border border-blue-600/20 flex items-center justify-center">
                                            <FolderKanban size={20} className="text-blue-400" />
                                        </div>
                                        <ChevronRight size={18} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                                    </div>

                                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-400 transition-colors truncate">
                                        {project.name}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 size={12} className="text-slate-500" />
                                        <span className="text-sm text-slate-400">{project.client}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${HEALTH_COLORS[project.health] || HEALTH_COLORS.on_track}`}>
                                            {HEALTH_LABELS[project.health] || "No Prazo"}
                                        </span>
                                        <span className="text-[11px] text-slate-500">
                                            {PHASE_LABELS[project.phase] || project.phase}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mb-4">
                        <FileText size={28} className="text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Nenhum projeto encontrado</h3>
                    <p className="text-sm text-slate-500">{projects.length === 0 ? "Nenhum projeto ativo. Envie uma proposta para devs primeiro." : "Tente outro termo de busca."}</p>
                </div>
            )}
        </div>
    );
}
