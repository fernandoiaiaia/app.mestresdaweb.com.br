"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft, Settings, Save, Percent, CreditCard, CheckCircle2,
    Plus, X, Edit3, Trash2, ToggleLeft, ToggleRight, FileText, Clock,
    ChevronDown, ChevronUp, Banknote, Wallet, QrCode, Building, Landmark,
    Copy, Loader2,
} from "lucide-react";

interface PaymentCondition {
    id: string;
    name: string;
    description: string | null;
    entryPercent: number;
    installments: number;
    discount: number;
    validityDays: number;
    methods: string[];
    active: boolean;
}

const allMethods = ["Pix", "Boleto Bancário", "Cartão de Crédito", "Transferência Bancária", "Débito Automático", "Depósito"];

const getMethodIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("pix") || n.includes("qr")) return QrCode;
    if (n.includes("cartão") || n.includes("crédito") || n.includes("débito")) return CreditCard;
    if (n.includes("boleto")) return FileText;
    if (n.includes("transferência") || n.includes("ted")) return Building;
    if (n.includes("depósito")) return Landmark;
    return Wallet;
};

export default function PaymentConfigPage() {
    const [conditions, setConditions] = useState<PaymentCondition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formEntry, setFormEntry] = useState("0");
    const [formInstallments, setFormInstallments] = useState("1");
    const [formDiscount, setFormDiscount] = useState("0");
    const [formValidity, setFormValidity] = useState("15");
    const [formMethods, setFormMethods] = useState<string[]>([]);

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // ═══ Load ═══
    const loadData = async () => {
        try {
            setIsLoading(true);
            const res = await api<PaymentCondition[]>("/api/payment-conditions", { method: "GET" });
            if (res.success && res.data) setConditions(res.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };
    useEffect(() => { loadData(); }, []);

    const activeCount = conditions.filter(c => c.active).length;

    const openCreate = () => {
        setEditId(null); setFormName(""); setFormDesc(""); setFormEntry("0"); setFormInstallments("1"); setFormDiscount("0"); setFormValidity("15"); setFormMethods([]);
        setShowModal(true);
    };

    const openEdit = (c: PaymentCondition) => {
        setEditId(c.id); setFormName(c.name); setFormDesc(c.description || ""); setFormEntry(String(c.entryPercent)); setFormInstallments(String(c.installments)); setFormDiscount(String(c.discount)); setFormValidity(String(c.validityDays)); setFormMethods([...(c.methods as string[])]);
        setShowModal(true);
    };

    const saveCondition = async () => {
        if (!formName.trim()) return;
        const payload = {
            name: formName.trim(),
            description: formDesc.trim() || null,
            entryPercent: Math.min(100, Math.max(0, parseFloat(formEntry) || 0)),
            installments: parseInt(formInstallments) || 0,
            discount: Math.min(100, Math.max(0, parseFloat(formDiscount) || 0)),
            validityDays: parseInt(formValidity) || 15,
            methods: formMethods,
        };
        try {
            if (editId) {
                const res = await api<PaymentCondition>(`/api/payment-conditions/${editId}`, { method: "PUT", body: payload });
                if (res.success && res.data) setConditions(prev => prev.map(c => c.id === editId ? res.data! : c));
            } else {
                const res = await api<PaymentCondition>("/api/payment-conditions", { method: "POST", body: payload });
                if (res.success && res.data) { setConditions(prev => [...prev, res.data!]); setExpandedId(res.data!.id); }
            }
            setShowModal(false);
        } catch (e) { console.error(e); }
    };

    const toggleCondition = async (id: string) => {
        try {
            const res = await api<PaymentCondition>(`/api/payment-conditions/${id}/toggle`, { method: "PATCH" });
            if (res.success && res.data) setConditions(prev => prev.map(c => c.id === id ? res.data! : c));
        } catch (e) { console.error(e); }
    };

    const duplicateCondition = async (c: PaymentCondition) => {
        try {
            const res = await api<PaymentCondition>(`/api/payment-conditions/${c.id}/duplicate`, { method: "POST" });
            if (res.success && res.data) { setConditions(prev => [...prev, res.data!]); setExpandedId(res.data!.id); }
        } catch (e) { console.error(e); }
    };

    const deleteCondition = async (id: string) => {
        try {
            await api(`/api/payment-conditions/${id}`, { method: "DELETE" });
            setConditions(prev => prev.filter(c => c.id !== id));
            setDeleteConfirm(null);
            if (expandedId === id) setExpandedId(null);
        } catch (e) { console.error(e); }
    };

    const toggleFormMethod = (m: string) => {
        setFormMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-slate-500" /></div>;
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
                    <span className="text-slate-300 text-sm font-medium">Condições de Pagamento</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Wallet size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Condições de Pagamento</h1>
                            <p className="text-sm text-slate-400">Cadastre condições com entrada, parcelas, meios de pagamento e validade</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Nova Condição
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total", value: conditions.length, icon: Wallet, color: "text-blue-400" },
                    { label: "Ativas", value: activeCount, icon: CheckCircle2, color: "text-blue-400" },
                    { label: "Inativas", value: conditions.length - activeCount, icon: ToggleLeft, color: "text-slate-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-xl font-bold text-white block">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* List */}
            <div className="space-y-3">
                {conditions.length === 0 && (
                    <div className="text-center py-14 text-slate-600">
                        <Wallet size={36} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm mb-3">Nenhuma condição cadastrada</p>
                        <button onClick={openCreate} className="text-sm text-blue-400 hover:text-blue-300">+ Criar primeira condição</button>
                    </div>
                )}

                {conditions.map((cond, i) => {
                    const isExpanded = expandedId === cond.id;
                    const methods = Array.isArray(cond.methods) ? cond.methods : [];
                    return (
                        <motion.div key={cond.id} layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden ${!cond.active ? 'opacity-50' : ''}`}>
                            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors" onClick={() => setExpandedId(isExpanded ? null : cond.id)}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`p-2 rounded-lg border ${cond.active ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-slate-500 bg-slate-500/10 border-slate-500/20'}`}><Wallet size={16} /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <h3 className="text-sm font-bold text-white truncate">{cond.name}</h3>
                                            {cond.entryPercent > 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border text-amber-400 bg-amber-500/10 border-amber-500/20 shrink-0">{cond.entryPercent}% entrada</span>}
                                            {cond.installments > 1 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border text-blue-400 bg-blue-500/10 border-blue-500/20 shrink-0">{cond.installments}x</span>}
                                            {cond.installments === 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border text-purple-400 bg-purple-500/10 border-purple-500/20 shrink-0">Recorrente</span>}
                                            {cond.discount > 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border text-blue-400 bg-blue-500/10 border-blue-500/20 shrink-0">{cond.discount}% desc.</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">{cond.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-3">
                                    <button onClick={(e) => { e.stopPropagation(); toggleCondition(cond.id); }} className={`p-1.5 rounded-lg transition-colors ${cond.active ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:bg-white/5'}`}>
                                        {cond.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); openEdit(cond); }} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors"><Edit3 size={14} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); duplicateCondition(cond); }} className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Duplicar"><Copy size={14} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(cond.id); }} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                                    {isExpanded ? <ChevronUp size={16} className="text-slate-500 ml-0.5" /> : <ChevronDown size={16} className="text-slate-500 ml-0.5" />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                        <div className="px-4 pb-4 border-t border-white/[0.04]">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 mb-4">
                                                <div className="p-3 bg-slate-800/50 rounded-xl border border-white/[0.04]">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mb-1">Entrada</span>
                                                    <span className="text-lg font-bold text-amber-400">{cond.entryPercent}%</span>
                                                </div>
                                                <div className="p-3 bg-slate-800/50 rounded-xl border border-white/[0.04]">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mb-1">Parcelas</span>
                                                    <span className="text-lg font-bold text-blue-400">{cond.installments === 0 ? "Recorrente" : `${cond.installments}x`}</span>
                                                </div>
                                                <div className="p-3 bg-slate-800/50 rounded-xl border border-white/[0.04]">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mb-1">Desconto</span>
                                                    <span className={`text-lg font-bold ${cond.discount > 0 ? 'text-blue-400' : 'text-slate-500'}`}>{cond.discount > 0 ? `${cond.discount}%` : "—"}</span>
                                                </div>
                                                <div className="p-3 bg-slate-800/50 rounded-xl border border-white/[0.04]">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mb-1">Validade</span>
                                                    <span className="text-lg font-bold text-purple-400">{cond.validityDays} dias</span>
                                                </div>
                                            </div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Meios de Pagamento Aceitos</h4>
                                            {methods.length === 0 ? (
                                                <p className="text-xs text-slate-600 py-3 text-center">Nenhum meio configurado — edite a condição para adicionar</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {methods.map((m: string) => {
                                                        const Icon = getMethodIcon(m);
                                                        return (
                                                            <span key={m} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/5 border border-blue-500/15 rounded-lg text-xs text-blue-300 font-medium">
                                                                <Icon size={12} /> {m}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* ═══ MODAL: Create/Edit Condition ═══ */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><Wallet size={16} className="text-blue-400" /> {editId ? "Editar Condição" : "Nova Condição de Pagamento"}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome da Condição <span className="text-red-400">*</span></label>
                                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Entrada 30% + 6x" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Descrição</label>
                                    <textarea rows={2} value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Detalhes desta condição..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 resize-none" />
                                </div>
                                <hr className="border-white/[0.04]" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">% da Entrada</label>
                                        <div className="relative">
                                            <input type="number" min={0} max={100} value={formEntry} onChange={e => setFormEntry(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 pr-8" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                        </div>
                                        <span className="text-[8px] text-slate-600 mt-0.5 block">0% = sem entrada</span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nº de Parcelas</label>
                                        <input type="number" min={0} max={48} value={formInstallments} onChange={e => setFormInstallments(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" />
                                        <span className="text-[8px] text-slate-600 mt-0.5 block">0 = recorrente · 1 = à vista</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Desconto (%)</label>
                                        <div className="relative">
                                            <input type="number" min={0} max={100} step={0.5} value={formDiscount} onChange={e => setFormDiscount(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 pr-8" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Validade da Proposta</label>
                                        <div className="flex gap-1.5">
                                            {[7, 15, 30, 60].map(d => (
                                                <button key={d} type="button" onClick={() => setFormValidity(String(d))} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${parseInt(formValidity) === d ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-slate-500 border-white/[0.06] hover:text-white'}`}>{d}d</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <hr className="border-white/[0.04]" />
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Meios de Pagamento Aceitos</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {allMethods.map(m => {
                                            const Icon = getMethodIcon(m);
                                            const selected = formMethods.includes(m);
                                            return (
                                                <button key={m} type="button" onClick={() => toggleFormMethod(m)} className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${selected ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-slate-500 border-white/[0.06] hover:text-white hover:border-white/[0.1]'}`}>
                                                    <Icon size={14} />
                                                    <span className="text-xs font-medium">{m}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3 sticky bottom-0 bg-slate-900">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={saveCondition} disabled={!formName.trim()} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${editId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
                                    <Save size={14} /> {editId ? "Salvar" : "Criar Condição"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Delete ═══ */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Excluir Condição?</h3>
                                <p className="text-sm text-slate-400">Esta condição não estará mais disponível nas propostas.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => deleteCondition(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
