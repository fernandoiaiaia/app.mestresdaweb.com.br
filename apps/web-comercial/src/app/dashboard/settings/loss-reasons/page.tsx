"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft,
    Settings,
    Plus,
    Trash2,
    Edit3,
    ThumbsDown,
    X,
    Save,
    ToggleLeft,
    ToggleRight,
    TrendingDown,
    BarChart3,
    Search,
    Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface LossReason {
    id: string;
    name: string;
    description: string | null;
    lastUsed: string | null;
    funnel?: { id: string; name: string };
    stage?: { id: string; name: string; color: string };
    usageCount: number;
    active: boolean;
}

interface FunnelStage {
    id: string;
    name: string;
    color: string;
}

interface Funnel {
    id: string;
    name: string;
    stages: FunnelStage[];
}

export default function LossReasonsPage() {
    const { toast } = useToast();
    const [reasons, setReasons] = useState<LossReason[]>([]);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");

    // Form
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formFunnelId, setFormFunnelId] = useState("");
    const [formStageId, setFormStageId] = useState("");

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);



    // ═══ Load Data ═══
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [reasonRes, funnelRes] = await Promise.all([
                api<LossReason[]>("/api/loss-reasons", { method: "GET" }),
                api<Funnel[]>("/api/funnels", { method: "GET" }),
            ]);
            if (reasonRes?.success && reasonRes.data) setReasons(reasonRes.data);
            if (funnelRes?.success && funnelRes.data) setFunnels(funnelRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const filtered = reasons
        .filter(r => {
            const q = searchQuery.toLowerCase();
            return r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q);
        })
        .filter(r => filterCategory === "all" || r.stage?.id === filterCategory)
        .sort((a, b) => b.usageCount - a.usageCount);

    // ═══ Reason CRUD ═══
    const openCreate = () => { 
        setEditId(null); 
        setFormName(""); 
        setFormDesc(""); 
        setFormFunnelId(""); 
        setFormStageId("");
        setShowModal(true); 
    };
    
    const openEdit = (r: LossReason) => { 
        setEditId(r.id); 
        setFormName(r.name); 
        setFormDesc(r.description || ""); 
        setFormFunnelId(r.funnel?.id || "");
        setFormStageId(r.stage?.id || "");
        setShowModal(true); 
    };

    const saveReason = async () => {
        if (!formName.trim() || !formFunnelId || !formStageId) {
            toast.error("Preencha todos os campos obrigatórios (Nome, Funil, Etapa).");
            return;
        }
        try {
            if (editId) {
                const res = await api<LossReason>(`/api/loss-reasons/${editId}`, {
                    method: "PUT",
                    body: { name: formName.trim(), description: formDesc.trim() || null, funnelId: formFunnelId, stageId: formStageId },
                });
                if (res.success && res.data) {
                    setReasons(prev => prev.map(r => r.id === editId ? res.data! : r));
                    toast.success("Motivo atualizado com sucesso!");
                    setShowModal(false);
                } else {
                    toast.error(res.message || "Erro ao atualizar motivo.");
                }
            } else {
                const res = await api<LossReason>("/api/loss-reasons", {
                    method: "POST",
                    body: { name: formName.trim(), description: formDesc.trim() || null, funnelId: formFunnelId, stageId: formStageId },
                });
                if (res.success && res.data) {
                    setReasons(prev => [...prev, res.data!]);
                    toast.success("Motivo criado com sucesso!");
                    setShowModal(false);
                } else {
                    toast.error(res.message || "Erro ao criar motivo.");
                }
            }
        } catch (e) {
            console.error(e);
            toast.error("Erro interno. Verifique se o funil e etapa estão corretos.");
        }
    };

    const toggleActive = async (id: string) => {
        const reason = reasons.find(r => r.id === id);
        if (!reason) return;
        try {
            const res = await api<LossReason>(`/api/loss-reasons/${id}`, {
                method: "PUT",
                body: { active: !reason.active },
            });
            if (res.success && res.data) {
                setReasons(prev => prev.map(r => r.id === id ? res.data! : r));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteReason = async (id: string) => {
        try {
            await api(`/api/loss-reasons/${id}`, { method: "DELETE" });
            setReasons(prev => prev.filter(r => r.id !== id));
            setDeleteConfirm(null);
        } catch (e) {
            console.error(e);
        }
    };

    // Stats
    const totalUsage = reasons.reduce((s, r) => s + r.usageCount, 0);
    const topReason = [...reasons].sort((a, b) => b.usageCount - a.usageCount)[0];
    const topStage = funnels.flatMap(f => f.stages).reduce((best: {stage: FunnelStage | null, count: number}, stage: FunnelStage) => {
        const count = reasons.filter(r => r.stage?.id === stage.id).reduce((s, r) => s + r.usageCount, 0);
        return count > best.count ? { stage, count } : best;
    }, { stage: funnels[0]?.stages[0] || null, count: 0 });

    const formatDate = (d: string | null) => {
        if (!d) return "Nunca";
        try {
            return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
        } catch { return "—"; }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Motivos de Perda</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <ThumbsDown size={20} className="text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Motivos de Perda</h1>
                            <p className="text-sm text-slate-400">Cadastre e analise os motivos pelos quais propostas são perdidas</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Novo Motivo
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Motivos Cadastrados", value: String(reasons.length), icon: ThumbsDown, color: "text-red-400" },
                    { label: "Ativos", value: String(reasons.filter(r => r.active).length), icon: ToggleRight, color: "text-blue-400" },
                    { label: "Total de Usos", value: String(totalUsage), icon: BarChart3, color: "text-blue-400" },
                    { label: "Etapa Mais Comum", value: topStage?.stage ? topStage.stage.name : "—", icon: TrendingDown, color: "text-amber-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-lg font-bold text-white block truncate">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Stage Distribution Bar */}
            {funnels.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5 mb-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Distribuição por Etapa</h3>
                    <div className="flex gap-1 h-6 rounded-lg overflow-hidden mb-3">
                        {funnels.flatMap(f => f.stages).map(stage => {
                            const count = reasons.filter(r => r.stage?.id === stage.id).reduce((s, r) => s + r.usageCount, 0);
                            const pct = totalUsage > 0 ? Math.max((count / totalUsage) * 100, count > 0 ? 3 : 0) : 0;
                            return pct > 0 ? (
                                <div key={stage.id} className="relative group cursor-pointer transition-all hover:opacity-80" style={{ width: `${pct}%`, backgroundColor: `${stage.color || '#64748b'}80` }} title={`${stage.name}: ${count} usos`}>
                                    <div className="absolute inset-0 flex items-center justify-center"><span className="text-[8px] font-bold text-white/80">{count}</span></div>
                                </div>
                            ) : null;
                        })}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {funnels.flatMap(f => f.stages).map(stage => {
                            const count = reasons.filter(r => r.stage?.id === stage.id).reduce((s, r) => s + r.usageCount, 0);
                            if (count === 0) return null;
                            return (
                                <span key={stage.id} className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color || '#64748b' }} /> {stage.name}: <span className="text-white font-bold">{count}</span>
                                </span>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Search + Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar motivo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/40" />
                </div>
                <select title="Filtrar por Etapa" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer">
                    <option value="all">Todas as etapas</option>
                    {funnels.flatMap(f => f.stages).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            {/* Reasons List */}
            <div className="space-y-2">
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-slate-600">
                        <ThumbsDown size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">{reasons.length === 0 ? "Nenhum motivo cadastrado ainda" : "Nenhum motivo encontrado"}</p>
                    </div>
                )}
                {filtered.map((reason, i) => {
                    const barW = totalUsage > 0 ? Math.max((reason.usageCount / (topReason?.usageCount || 1)) * 100, 2) : 2;
                    return (
                        <motion.div key={reason.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className={`flex items-center gap-4 p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl hover:border-white/[0.1] transition-colors group ${!reason.active ? 'opacity-50' : ''}`}>
                            {/* Stage badge */}
                            <span className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border shrink-0" style={{ borderColor: `${reason.stage?.color || '#ef4444'}40`, color: reason.stage?.color || '#ef4444', backgroundColor: `${reason.stage?.color || '#ef4444'}10` }}>
                                {reason.stage?.name || "Sem Etapa"}
                            </span>

                            {/* Name & Description */}
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-white block truncate">{reason.name}</span>
                                <span className="text-[11px] text-slate-500 block truncate">{reason.description || ""}</span>
                                {(reason.funnel && reason.stage) && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5" title="Funil atrelado">
                                        <TrendingDown size={10} className="opacity-60" />
                                        {reason.funnel.name} <span className="opacity-50 mx-0.5">→</span> <span style={{ color: reason.stage.color === 'blue' ? '#3b82f6' : reason.stage.color }}>{reason.stage.name}</span>
                                    </span>
                                )}
                            </div>

                            {/* Usage bar */}
                            <div className="hidden md:block w-32 shrink-0">
                                <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all flex items-center justify-end pr-1.5" style={{ width: `${barW}%`, minWidth: '16px', backgroundColor: `${reason.stage?.color || '#64748b'}60` }}>
                                        <span className="text-[8px] font-bold text-white/80">{reason.usageCount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Last used */}
                            <span className="text-[10px] text-slate-600 w-24 text-right shrink-0 hidden lg:block">
                                {formatDate(reason.lastUsed)}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => toggleActive(reason.id)} className={`p-1.5 rounded-lg transition-colors ${reason.active ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:bg-white/5'}`}>
                                    {reason.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                </button>
                                <button onClick={() => openEdit(reason)} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"><Edit3 size={14} /></button>
                                <button onClick={() => setDeleteConfirm(reason.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ═══ MODAL: Create / Edit Reason ═══ */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <ThumbsDown size={16} className="text-red-400" />
                                    {editId ? "Editar Motivo" : "Novo Motivo de Perda"}
                                </h2>
                                <button title="Fechar Modal" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome do Motivo <span className="text-red-400">*</span></label>
                                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Preço acima do orçamento" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Descrição</label>
                                    <textarea rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Detalhes sobre quando usar este motivo..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 resize-none" />
                                </div>
                                {funnels.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Funil de Vendas <span className="text-red-400">*</span></label>
                                            <select 
                                                title="Selecione um Funil"
                                                value={formFunnelId} 
                                                onChange={(e) => { 
                                                    setFormFunnelId(e.target.value); 
                                                    setFormStageId(""); // reset stage on funnel change
                                                }} 
                                                className="w-full px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none cursor-pointer"
                                            >
                                                <option value="" disabled>Selecione um Funil</option>
                                                {funnels.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Etapa Específica <span className="text-red-400">*</span></label>
                                            <select 
                                                title="Selecione uma Etapa"
                                                value={formStageId} 
                                                onChange={(e) => setFormStageId(e.target.value)} 
                                                disabled={!formFunnelId}
                                                className="w-full px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="" disabled>{formFunnelId ? "Selecione uma Etapa" : "Selecione um Funil primeiro"}</option>
                                                {funnels.find(f => f.id === formFunnelId)?.stages.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
                                        Nenhum funil cadastrado. <br/>
                                        Você precisa ter um funil de vendas ativo para atrelar os motivos de perda.
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={saveReason} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-500 text-white`}>
                                    <Save size={14} /> {editId ? "Salvar" : "Criar Motivo"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Delete Reason ═══ */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Excluir Motivo?</h3>
                                <p className="text-sm text-slate-400">Os registros históricos que utilizam este motivo serão mantidos.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => deleteConfirm && deleteReason(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Removed modals */}
        </div>
    );
}
