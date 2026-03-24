"use client";

import { useState } from "react";
import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Workflow,
    Plus,
    Search,
    Copy,
    Archive,
    MoreHorizontal,
    ArrowLeft,
    Users,
    TrendingUp,
    Play,
    Pause,
    FileEdit,
    BookOpen,
    UserCircle,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: "Rascunho", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
    active: { label: "Ativa", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    paused: { label: "Pausada", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    archived: { label: "Arquivada", color: "text-slate-500", bg: "bg-slate-700/50 border-slate-600/20" },
};

export default function CadencesListPage() {
    const router = useRouter();
    const { cadences, playbooks, personas, addCadence, deleteCadence, updateCadence } = useSDRStore();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<string>("all");
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newForm, setNewForm] = useState({ name: "", playbookId: "", personaId: "", identityId: "", automationLevel: "autopilot" as "autopilot" | "semi" | "assisted" });

    const { identities } = useSDRStore();

    const filtered = cadences
        .filter(c => filter === "all" || c.status === filter)
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    const handleCreate = () => {
        if (!newForm.name || !newForm.playbookId || !newForm.personaId || !newForm.identityId) return;
        addCadence({
            ...newForm,
            status: "draft",
            schedule: { days: ["seg", "ter", "qua", "qui", "sex"], startTime: "08:00", endTime: "18:00" },
            timezone: "America/Sao_Paulo",
            nodes: [{ id: "n1", type: "start", position: { x: 250, y: 0 }, data: { label: "Início" } }],
            edges: [],
        });
        setShowNewModal(false);
        setNewForm({ name: "", playbookId: "", personaId: "", identityId: "", automationLevel: "autopilot" });
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Hub SDR</Link>
                <span>/</span>
                <span className="text-white font-medium">Cadências</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Workflow size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Minhas Cadências</h1>
                        <p className="text-sm text-slate-400">Fluxos automatizados de prospecção</p>
                    </div>
                </div>
                <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                    <Plus size={16} /> Nova Cadência
                </button>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar cadências..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl w-full pl-10 pr-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {["all", "active", "paused", "draft", "archived"].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"}`}>
                            {f === "all" ? "Todos" : statusConfig[f]?.label || f}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <Workflow size={48} className="mx-auto mb-4 text-slate-600" />
                    <h3 className="text-lg font-bold text-white mb-1">Nenhuma cadência encontrada</h3>
                    <p className="text-sm text-slate-400">Crie sua primeira cadência para começar a prospectar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((cad, i) => {
                        const pb = playbooks.find(p => p.id === cad.playbookId);
                        const per = personas.find(p => p.id === cad.personaId);
                        const sc = statusConfig[cad.status];

                        return (
                            <motion.div key={cad.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all group cursor-pointer" onClick={() => router.push(`/dashboard/sdr/cadences/${cad.id}`)}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{cad.name}</h3>
                                            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${sc.bg} ${sc.color}`}>
                                                {cad.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                                                {sc.label}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === cad.id ? null : cad.id); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><MoreHorizontal size={16} /></button>
                                            {menuOpen === cad.id && (
                                                <>
                                                    <div className="fixed inset-0 z-[99]" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }} />
                                                    <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[100] py-1 min-w-[160px]" onClick={e => e.stopPropagation()}>
                                                        {cad.status === "active" && <button onClick={() => { updateCadence(cad.id, { status: "paused" }); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-amber-400 hover:bg-slate-700 flex items-center gap-2"><Pause size={14} /> Pausar</button>}
                                                        {cad.status === "paused" && <button onClick={() => { updateCadence(cad.id, { status: "active" }); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-slate-700 flex items-center gap-2"><Play size={14} /> Ativar</button>}
                                                        <button onClick={() => { setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"><Copy size={14} /> Duplicar</button>
                                                        <button onClick={() => { deleteCadence(cad.id); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"><Archive size={14} /> Arquivar</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Playbook + Persona */}
                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <BookOpen size={12} className="text-purple-400" />
                                            <span className="truncate">{pb?.name || "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <UserCircle size={12} className="text-orange-400" />
                                            <span className="truncate">{per?.name || "—"}</span>
                                        </div>
                                    </div>

                                    {/* Auto Level */}
                                    <div className="mb-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cad.automationLevel === "autopilot" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                            cad.automationLevel === "semi" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                                "bg-slate-500/10 border-slate-500/20 text-slate-400"
                                            }`}>
                                            {cad.automationLevel === "autopilot" ? "Piloto Automático" : cad.automationLevel === "semi" ? "Semi-automático" : "Assistido"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 pt-3 border-t border-slate-700/50">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Users size={12} />
                                            <span>{cad.leadsActive} leads</span>
                                        </div>
                                        {cad.conversionRate > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-blue-400">
                                                <TrendingUp size={12} />
                                                <span>{cad.conversionRate}%</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
                                            <span>{cad.nodes.length} nodes</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* New Cadence Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-6">Nova Cadência</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Nome</label>
                                <input type="text" className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 focus:border-blue-500 outline-none" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Prospecção SaaS — CEO Startup" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Playbook (o que vender)</label>
                                <select className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 focus:border-blue-500 outline-none" value={newForm.playbookId} onChange={e => setNewForm(f => ({ ...f, playbookId: e.target.value }))}>
                                    <option value="">Selecionar...</option>
                                    {playbooks.filter(p => p.status === "active").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Persona (para quem)</label>
                                <select className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 focus:border-blue-500 outline-none" value={newForm.personaId} onChange={e => setNewForm(f => ({ ...f, personaId: e.target.value }))}>
                                    <option value="">Selecionar...</option>
                                    {personas.filter(p => p.status === "active").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Identidade (quem fala)</label>
                                <select className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 focus:border-blue-500 outline-none" value={newForm.identityId} onChange={e => setNewForm(f => ({ ...f, identityId: e.target.value }))}>
                                    <option value="">Selecionar...</option>
                                    {identities.map(i => <option key={i.id} value={i.id}>{i.name} ({i.email})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Nível de Automação</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {([["autopilot", "Piloto Auto", "IA faz tudo"], ["semi", "Semi-auto", "IA + humano"], ["assisted", "Assistido", "Humano revisa"]] as const).map(([val, label, desc]) => (
                                        <button key={val} onClick={() => setNewForm(f => ({ ...f, automationLevel: val as any }))} className={`p-3 rounded-xl border text-center transition-all ${newForm.automationLevel === val ? "border-blue-500/50 bg-blue-500/10" : "border-slate-700 bg-slate-800 hover:border-slate-600"}`}>
                                            <div className={`text-xs font-bold ${newForm.automationLevel === val ? "text-blue-400" : "text-slate-300"}`}>{label}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowNewModal(false)} className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white transition-colors font-medium">Cancelar</button>
                            <button onClick={handleCreate} disabled={!newForm.name || !newForm.playbookId || !newForm.personaId || !newForm.identityId} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all">Criar Cadência</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
