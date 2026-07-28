"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Workflow, Plus, Search, ChevronDown, MoreHorizontal,
    Play, Pause, Archive, Trash2, Users, TrendingUp, Kanban,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface Funnel { id: string; name: string; stages: Stage[]; }
interface Stage { id: string; name: string; color: string; orderIndex: number; }
interface SalesCadence {
    id: string; stageId: string; name: string; description: string | null;
    isActive: boolean; stage: Stage; funnel?: Funnel;
    steps: { id: string; type: string; title: string; }[];
    _count?: { executions: number };
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Ativa", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    inactive: { label: "Inativa", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

export default function SalesCadenceListPage() {
    const { confirm: showConfirm } = useToast();
    const router = useRouter();
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
    const [cadences, setCadences] = useState<SalesCadence[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newForm, setNewForm] = useState({ name: "", stageId: "" });

    // Load funnels
    useEffect(() => {
        (async () => {
            const res = await api<Funnel[]>("/api/funnels");
            if (res.success && res.data) {
                setFunnels(res.data);
                if (res.data.length > 0) setSelectedFunnelId(res.data[0].id);
            }
            setLoading(false);
        })();
    }, []);

    const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);

    // Load cadences
    const loadCadences = useCallback(async () => {
        if (!selectedFunnelId) return;
        const res = await api<SalesCadence[]>(`/api/sales-cadences/funnel/${selectedFunnelId}`);
        if (res.success && res.data) setCadences(res.data);
    }, [selectedFunnelId]);

    useEffect(() => { loadCadences(); }, [loadCadences]);

    const filtered = cadences
        .filter(c => filter === "all" || (filter === "active" ? c.isActive : !c.isActive))
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    const handleCreate = async () => {
        if (!newForm.name || !newForm.stageId) return;
        const res = await api<SalesCadence>("/api/sales-cadences", {
            method: "POST",
            body: { funnelId: selectedFunnelId, stageId: newForm.stageId, name: newForm.name },
        });
        if (res.success && res.data) {
            setShowNewModal(false);
            setNewForm({ name: "", stageId: "" });
            await loadCadences();
            router.push(`/dashboard/crm/sales-cadence/${res.data.id}`);
        }
    };

    const handleToggle = async (cad: SalesCadence) => {
        await api(`/api/sales-cadences/${cad.id}`, { method: "PUT", body: { isActive: !cad.isActive } });
        setMenuOpen(null);
        await loadCadences();
    };

    const handleDelete = async (cad: SalesCadence) => {
        const confirmed = await showConfirm({ title: "Excluir cadência?", description: `Excluir cadência "${cad.name}"?`, confirmLabel: "Excluir", variant: "danger" });
        if (!confirmed) return;
        await api(`/api/sales-cadences/${cad.id}`, { method: "DELETE" });
        setMenuOpen(null);
        await loadCadences();
    };

    // Stages available for new cadence (not already used)
    const usedStageIds = cadences.map(c => c.stageId);
    const availableStages = (selectedFunnel?.stages || []).filter(s => !usedStageIds.includes(s.id));

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.20))] items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/crm/pipeline" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Pipeline</Link>
                <span>/</span>
                <span className="text-white font-medium">Fluxo de Cadência</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Workflow size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Fluxo de Cadência Sales</h1>
                        <p className="text-sm text-slate-400">Fluxos automatizados por fase da pipeline</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Funnel selector */}
                    <div className="relative">
                        <select
                            value={selectedFunnelId || ""}
                            onChange={(e) => setSelectedFunnelId(e.target.value)}
                            className="appearance-none bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                        >
                            {funnels.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <button onClick={() => setShowNewModal(true)} disabled={availableStages.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Nova Cadência
                    </button>
                </div>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar cadências..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl w-full pl-10 pr-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {["all", "active", "inactive"].map(f => (
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
                    <p className="text-sm text-slate-400">Crie sua primeira cadência para automatizar o fluxo de vendas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((cad, i) => {
                        const sc = cad.isActive ? statusConfig.active : statusConfig.inactive;

                        return (
                            <motion.div key={cad.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all group cursor-pointer" onClick={() => router.push(`/dashboard/crm/sales-cadence/${cad.id}`)}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{cad.name}</h3>
                                            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${sc.bg} ${sc.color}`}>
                                                {cad.isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                                                {sc.label}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === cad.id ? null : cad.id); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><MoreHorizontal size={16} /></button>
                                            {menuOpen === cad.id && (
                                                <>
                                                    <div className="fixed inset-0 z-[99]" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }} />
                                                    <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[100] py-1 min-w-[160px]" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => handleToggle(cad)} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 flex items-center gap-2 ${cad.isActive ? 'text-amber-400' : 'text-blue-400'}`}>
                                                            {cad.isActive ? <><Pause size={14} /> Desativar</> : <><Play size={14} /> Ativar</>}
                                                        </button>
                                                        <button onClick={() => handleDelete(cad)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"><Trash2 size={14} /> Excluir</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stage + Funnel */}
                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Kanban size={12} className="text-purple-400" />
                                            <span className="truncate">Fase: {cad.stage?.name || "—"}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-3 border-t border-slate-700/50">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Users size={12} />
                                            <span>{cad._count?.executions || 0} execuções</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
                                            <span>{cad.steps?.length || 0} nodes</span>
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
                        <h2 className="text-xl font-bold text-white mb-6">Nova Cadência de Vendas</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Nome</label>
                                <input type="text" className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 focus:border-blue-500 outline-none" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Cadência — Qualificação" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Fase da Pipeline</label>
                                <select className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 focus:border-blue-500 outline-none" value={newForm.stageId} onChange={e => setNewForm(f => ({ ...f, stageId: e.target.value }))}>
                                    <option value="">Selecionar fase...</option>
                                    {availableStages.sort((a, b) => a.orderIndex - b.orderIndex).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {availableStages.length === 0 && (
                                    <p className="text-[10px] text-amber-400 mt-1">Todas as fases já possuem cadência.</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowNewModal(false)} className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white transition-colors font-medium">Cancelar</button>
                            <button onClick={handleCreate} disabled={!newForm.name || !newForm.stageId} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all">Criar Cadência</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
