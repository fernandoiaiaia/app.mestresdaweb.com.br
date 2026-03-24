"use client";

import { useState } from "react";
import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    Plus,
    Search,
    TrendingUp,
    Copy,
    Archive,
    MoreHorizontal,
    ArrowLeft,
    Workflow,
} from "lucide-react";

export default function PlaybooksListPage() {
    const router = useRouter();
    const { playbooks, addPlaybook, deletePlaybook, updatePlaybook } = useSDRStore();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
    const [menuOpen, setMenuOpen] = useState<string | null>(null);

    const filtered = playbooks
        .filter(pb => filter === "all" || pb.status === filter)
        .filter(pb => pb.name.toLowerCase().includes(search.toLowerCase()));

    const handleDuplicate = (pb: typeof playbooks[0]) => {
        addPlaybook({
            ...pb,
            name: `${pb.name} (cópia)`,
            status: "inactive",
        });
        setMenuOpen(null);
    };

    const handleArchive = (id: string) => {
        deletePlaybook(id);
        setMenuOpen(null);
    };

    const handleNew = () => {
        addPlaybook({
            name: "Novo Playbook",
            valueProposition: "",
            description: "",
            pains: [],
            differentials: [],
            objections: [],
            cases: [],
            priceRange: "",
            aiInstructions: "",
            status: "inactive",
        });
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Hub SDR</Link>
                <span>/</span>
                <span className="text-white font-medium">Playbooks</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <BookOpen size={20} className="text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Playbooks</h1>
                        <p className="text-sm text-slate-400">O que vender — produtos, diferenciais, objeções e cases</p>
                    </div>
                </div>
                <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                    <Plus size={16} /> Novo Playbook
                </button>
            </motion.div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar playbooks..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl w-full pl-10 pr-4 py-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all" />
                </div>
                <div className="flex gap-2">
                    {(["all", "active", "inactive"] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"}`}>
                            {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen size={48} className="mx-auto mb-4 text-slate-600" />
                    <h3 className="text-lg font-bold text-white mb-1">Nenhum playbook encontrado</h3>
                    <p className="text-sm text-slate-400">Crie seu primeiro playbook para começar a prospectar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((pb, i) => (
                        <motion.div key={pb.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all group cursor-pointer" onClick={() => router.push(`/dashboard/sdr/playbooks/${pb.id}`)}>
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <BookOpen size={18} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{pb.name}</h3>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${pb.status === "active" ? "text-blue-400" : "text-slate-500"}`}>
                                                {pb.status === "active" ? "Ativo" : "Inativo"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === pb.id ? null : pb.id); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                            <MoreHorizontal size={16} />
                                        </button>
                                        {menuOpen === pb.id && (
                                            <>
                                                <div className="fixed inset-0 z-[99]" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }} />
                                                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[100] py-1 min-w-[140px]" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => handleDuplicate(pb)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"><Copy size={14} /> Duplicar</button>
                                                    <button onClick={() => handleArchive(pb.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"><Archive size={14} /> Arquivar</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Value Proposition */}
                                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{pb.valueProposition || "Sem proposta de valor definida"}</p>

                                {/* Metrics */}
                                <div className="flex items-center gap-4 pt-3 border-t border-slate-700/50">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Workflow size={12} className="text-slate-500" />
                                        <span>{pb.cadenceCount} cadência{pb.cadenceCount !== 1 ? "s" : ""}</span>
                                    </div>
                                    {pb.conversionRate > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-blue-400">
                                            <TrendingUp size={12} />
                                            <span>{pb.conversionRate}% conversão</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
