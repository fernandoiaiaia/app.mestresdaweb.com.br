"use client";

import { useState } from "react";
import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    UserCircle,
    Plus,
    Search,
    Copy,
    Archive,
    MoreHorizontal,
    ArrowLeft,
    Workflow,
    Briefcase,
} from "lucide-react";

export default function PersonasListPage() {
    const router = useRouter();
    const { personas, addPersona, deletePersona } = useSDRStore();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
    const [menuOpen, setMenuOpen] = useState<string | null>(null);

    const filtered = personas
        .filter(p => filter === "all" || p.status === filter)
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    const handleNew = () => {
        addPersona({
            name: "Nova Persona", targetRoles: [], seniority: "Gerência", segments: [], companySize: "pme",
            pains: [], buyMotivations: [], language: "formal", objections: [], aiInstructions: "", status: "inactive",
        });
    };

    const handleDuplicate = (p: typeof personas[0]) => {
        addPersona({ ...p, name: `${p.name} (cópia)`, status: "inactive" });
        setMenuOpen(null);
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Hub SDR</Link>
                <span>/</span>
                <span className="text-white font-medium">Personas</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <UserCircle size={20} className="text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Personas</h1>
                        <p className="text-sm text-slate-400">Para quem vender — perfis de cliente ideal</p>
                    </div>
                </div>
                <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                    <Plus size={16} /> Nova Persona
                </button>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar personas..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl w-full pl-10 pr-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                </div>
                <div className="flex gap-2">
                    {(["all", "active", "inactive"] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? "bg-orange-600/20 text-orange-400 border border-orange-500/30" : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"}`}>
                            {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <UserCircle size={48} className="mx-auto mb-4 text-slate-600" />
                    <h3 className="text-lg font-bold text-white mb-1">Nenhuma persona encontrada</h3>
                    <p className="text-sm text-slate-400">Crie sua primeira persona para segmentar a prospecção.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-orange-500/30 transition-all group cursor-pointer" onClick={() => router.push(`/dashboard/sdr/personas/${p.id}`)}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                            <UserCircle size={18} className="text-orange-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{p.name}</h3>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${p.status === "active" ? "text-blue-400" : "text-slate-500"}`}>
                                                {p.status === "active" ? "Ativa" : "Inativa"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><MoreHorizontal size={16} /></button>
                                        {menuOpen === p.id && (
                                            <>
                                                <div className="fixed inset-0 z-[99]" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }} />
                                                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[100] py-1 min-w-[140px]" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => handleDuplicate(p)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"><Copy size={14} /> Duplicar</button>
                                                    <button onClick={() => { deletePersona(p.id); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"><Archive size={14} /> Arquivar</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Roles */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {p.targetRoles.slice(0, 3).map(r => (
                                        <span key={r} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-medium text-slate-300">{r}</span>
                                    ))}
                                    {p.targetRoles.length > 3 && <span className="text-[10px] text-slate-500">+{p.targetRoles.length - 3}</span>}
                                </div>

                                {/* Pains */}
                                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{p.pains.slice(0, 2).join(", ") || "Sem dores definidas"}</p>

                                <div className="flex items-center gap-4 pt-3 border-t border-slate-700/50">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Briefcase size={12} className="text-slate-500" />
                                        <span>{p.seniority}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Workflow size={12} className="text-slate-500" />
                                        <span>{p.cadenceCount} cadência{p.cadenceCount !== 1 ? "s" : ""}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
