"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, FolderKanban, Plus, Archive } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

const PHASE_LABELS: Record<string, string> = {
    requirements: "Levantamento de Requisitos",
    discovery: "Discovery e Design",
    development: "Desenvolvimento",
    testing: "Testes",
    documentation: "Documentação",
    delivery: "Entrega",
};

function getHealthColor(health: string) {
    switch (health) {
        case "on_track": return "text-blue-400";
        case "at_risk": return "text-amber-400";
        case "delayed": return "text-red-400";
        default: return "text-slate-400";
    }
}

function getHealthBg(health: string) {
    switch (health) {
        case "on_track": return "bg-blue-500/10 border-blue-500/20";
        case "at_risk": return "bg-amber-500/10 border-amber-500/20";
        case "delayed": return "bg-red-500/10 border-red-500/20";
        default: return "bg-slate-500/10 border-slate-500/20";
    }
}

function getHealthLabel(health: string) {
    switch (health) {
        case "on_track": return "No Prazo";
        case "at_risk": return "Em Risco";
        case "delayed": return "Atrasado";
        default: return health;
    }
}

export default function ProjectsPage() {
    const [search, setSearch] = useState("");
    const [healthFilter, setHealthFilter] = useState<string>("all");
    const [phaseFilter, setPhaseFilter] = useState<string>("all");
    const [showArchived, setShowArchived] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("archived", showArchived ? "true" : "false");
        if (healthFilter !== "all") params.set("health", healthFilter);
        if (phaseFilter !== "all") params.set("phase", phaseFilter);
        if (search) params.set("search", search);

        const res = await api<any[]>(`/api/dev-projects?${params.toString()}`);
        if (res.success && res.data) setProjects(res.data);
        setLoading(false);
    }, [showArchived, healthFilter, phaseFilter, search]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const activeCount = projects.filter(p => !p.archived).length;
    const archivedCount = projects.filter(p => p.archived).length;

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
                    <p className="text-slate-400 mt-1">Repositório de todos os projetos da empresa.</p>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-800/40 rounded-lg p-1 w-fit">
                <button onClick={() => setShowArchived(false)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!showArchived ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                    <FolderKanban size={14} className="inline mr-1.5" />Ativos ({showArchived ? "..." : projects.length})
                </button>
                <button onClick={() => setShowArchived(true)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${showArchived ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                    <Archive size={14} className="inline mr-1.5" />Arquivo
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar projeto ou cliente..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/50 transition-all" />
                </div>
                <select value={healthFilter} onChange={e => setHealthFilter(e.target.value)}
                    className="px-3 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-600/50">
                    <option value="all">Todas as saúdes</option>
                    <option value="on_track">No Prazo</option>
                    <option value="at_risk">Em Risco</option>
                    <option value="delayed">Atrasado</option>
                </select>
                <select value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)}
                    className="px-3 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-600/50">
                    <option value="all">Todas as fases</option>
                    {Object.entries(PHASE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-20">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-slate-500">Carregando projetos...</p>
                </div>
            )}

            {/* Project Cards */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Link href={`/dashboard/projects/${p.id}`}
                                className="block p-5 rounded-xl bg-slate-800/40 border border-white/[0.06] hover:border-blue-600/30 hover:bg-slate-800/60 transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{p.name}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{p.client}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getHealthBg(p.health)} ${getHealthColor(p.health)}`}>
                                        {getHealthLabel(p.health)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${p.progress}%` }} />
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">{p.progress}%</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                    <span className="px-2 py-0.5 bg-slate-700/50 rounded-md">{PHASE_LABELS[p.phase] || p.phase}</span>
                                    <span>{p.tasksDone}/{p.tasksTotal} tarefas</span>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30 text-[11px] text-slate-500">
                                    <span>Criado por: {p.createdBy?.name || "—"}</span>
                                    <span>Prazo: {p.deadline ? new Date(p.deadline).toLocaleDateString("pt-BR") : "—"}</span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {!loading && projects.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    <FolderKanban size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">Nenhum projeto encontrado</p>
                    <p className="text-xs text-slate-600 mt-1">Projetos são criados automaticamente quando uma proposta é enviada para devs.</p>
                </div>
            )}
        </div>
    );
}
