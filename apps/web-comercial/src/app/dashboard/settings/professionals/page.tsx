"use client";

import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Settings,
    Users,
    Plus,
    X,
    Edit3,
    Trash2,
    Search,
    DollarSign,
    Clock,
    TrendingUp,
    History,
    Save,
    Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

interface Professional {
    id: string;
    role: string;
    seniority: string;
    seniorityColor: string;
    hourlyRate: number;
    currency: string;
    isActive: boolean;
    updatedAt: string;
    history: { date: string; oldRate: number; newRate: number }[];
}

const getCatStyle = (color: string) => ({
    color,
    backgroundColor: `${color}15`,
    borderColor: `${color}30`,
});

const seniorityPresets = [
    { name: "Junior", color: "#3b82f6" },
    { name: "Pleno", color: "#22c55e" },
    { name: "Sênior", color: "#8b5cf6" },
    { name: "Especialista", color: "#f59e0b" },
];

export default function ProfessionalsPage() {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form
    const [formRole, setFormRole] = useState("");
    const [formSeniority, setFormSeniority] = useState("Pleno");
    const [formSeniorityColor, setFormSeniorityColor] = useState("#22c55e");
    const [formRate, setFormRate] = useState("");

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Load from API
    useEffect(() => {
        loadProfessionals();
    }, []);

    const loadProfessionals = async () => {
        const res = await api<any>(`/api/professionals`);
        if (res.success && Array.isArray(res.data)) {
            setProfessionals(res.data);
        }
        setLoading(false);
    };

    const filtered = professionals
        .filter((p) => p.role.toLowerCase().includes(searchQuery.toLowerCase()));

    const activeCount = professionals.filter((p) => p.isActive).length;
    const avgRate = activeCount > 0 ? Math.round(professionals.filter((p) => p.isActive).reduce((s, p) => s + p.hourlyRate, 0) / activeCount) : 0;

    const openCreate = () => {
        setEditingId(null);
        setFormRole("");
        setFormSeniority("Pleno");
        setFormSeniorityColor("#22c55e");
        setFormRate("");
        setShowModal(true);
    };

    const openEdit = (p: Professional) => {
        setEditingId(p.id);
        setFormRole(p.role);
        setFormSeniority(p.seniority);
        setFormSeniorityColor(p.seniorityColor);
        setFormRate(String(p.hourlyRate));
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formRole || !formRate) return;
        setSaving(true);
        try {
            if (editingId) {
                await api(`/api/professionals/${editingId}`, {
                    method: "PATCH",
                    body: { role: formRole, seniority: formSeniority, seniorityColor: formSeniorityColor, hourlyRate: Number(formRate) },
                });
            } else {
                await api(`/api/professionals`, {
                    method: "POST",
                    body: { role: formRole, seniority: formSeniority, seniorityColor: formSeniorityColor, hourlyRate: Number(formRate) },
                });
            }
            await loadProfessionals();
            setShowModal(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (p: Professional) => {
        await api(`/api/professionals/${p.id}`, {
            method: "PATCH",
            body: { isActive: !p.isActive },
        });
        await loadProfessionals();
    };

    const handleDelete = async (id: string) => {
        await api(`/api/professionals/${id}`, { method: "DELETE" });
        setDeleteConfirm(null);
        await loadProfessionals();
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
        } catch { return dateStr; }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Profissionais & Valores-Hora</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Users size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Profissionais & Valores-Hora</h1>
                            <p className="text-sm text-slate-400">Defina cargos, senioridades e valores para estimativas automáticas</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Novo Cargo
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Cargos Ativos", value: activeCount, icon: Users, color: "text-blue-400" },
                    { label: "Média Valor-Hora", value: `R$ ${avgRate}`, icon: DollarSign, color: "text-blue-400" },
                    { label: "Total Cadastrados", value: professionals.length, icon: TrendingUp, color: "text-amber-400" },
                ].map((s) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-xl font-bold text-white block">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Search */}
            <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar cargo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40" />
                </div>
            </div>

            {/* Table */}
            {professionals.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-slate-800/40 border border-white/[0.06] rounded-2xl">
                    <Users size={40} className="text-slate-600 mx-auto mb-4" />
                    <h3 className="text-white font-bold mb-2">Nenhum cargo cadastrado</h3>
                    <p className="text-slate-400 text-sm mb-4">Cadastre os cargos e valores-hora para usar nas estimativas de propostas.</p>
                    <button onClick={openCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold">
                        <Plus size={14} className="inline mr-1" /> Cadastrar Primeiro Cargo
                    </button>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-slate-900/50">
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cargo</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Senioridade</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor-Hora</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filtered.map((p) => (
                                <Fragment key={p.id}>
                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-white">{p.role}</span>
                                            <span className="text-[10px] text-slate-600 block mt-0.5">Atualizado: {formatDate(p.updatedAt)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={getCatStyle(p.seniorityColor)}>{p.seniority}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-white">R$ {p.hourlyRate},00</span>
                                            <span className="text-[10px] text-slate-600 block">/hora</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => toggleActive(p)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${p.isActive ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-slate-500 bg-slate-500/10 border-slate-500/20"}`}>
                                                {p.isActive ? "Ativo" : "Inativo"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"><Edit3 size={14} /></button>
                                                {Array.isArray(p.history) && p.history.length > 0 && (
                                                    <button onClick={() => setExpandedHistory(expandedHistory === p.id ? null : p.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all"><History size={14} /></button>
                                                )}
                                                <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedHistory === p.id && Array.isArray(p.history) && p.history.length > 0 && (
                                        <tr key={`${p.id}-hist`}>
                                            <td colSpan={5} className="px-6 py-3 bg-slate-900/30">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 flex items-center gap-1"><History size={10} /> Histórico de Alterações</div>
                                                <div className="space-y-1">
                                                    {p.history.map((h: any, hi: number) => (
                                                        <div key={hi} className="flex items-center gap-3 text-xs text-slate-400">
                                                            <span className="text-[10px] text-slate-600 w-24">{formatDate(h.date)}</span>
                                                            <span className="text-red-400 line-through">R$ {h.oldRate}</span>
                                                            <span className="text-slate-600">→</span>
                                                            <span className="text-blue-400 font-medium">R$ {h.newRate}</span>
                                                            <span className={`text-[9px] ${h.newRate > h.oldRate ? "text-blue-500" : "text-red-500"}`}>
                                                                ({h.newRate > h.oldRate ? "+" : ""}{Math.round(((h.newRate - h.oldRate) / h.oldRate) * 100)}%)
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}

            {/* ═══ MODAL: Create/Edit ═══ */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                                <h2 className="text-base font-bold text-white">{editingId ? "Editar Cargo" : "Novo Cargo"}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome do Cargo</label>
                                    <input type="text" value={formRole} onChange={(e) => setFormRole(e.target.value)} placeholder="Ex: Desenvolvedor Frontend" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Senioridade</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {seniorityPresets.map(s => (
                                            <button key={s.name} type="button" onClick={() => { setFormSeniority(s.name); setFormSeniorityColor(s.color); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${formSeniority === s.name ? '' : 'text-slate-500 border-white/[0.06] hover:text-white'}`} style={formSeniority === s.name ? getCatStyle(s.color) : undefined}>{s.name}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Valor-Hora (R$)</label>
                                    <input type="number" value={formRate} onChange={(e) => setFormRate(e.target.value)} placeholder="180" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
                                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
                                <button onClick={handleSave} disabled={!formRole || !formRate || saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-all">
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editingId ? "Salvar Alterações" : "Criar Cargo"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Delete Confirm ═══ */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Excluir Cargo?</h3>
                                <p className="text-sm text-slate-400">Esta ação é irreversível e afetará futuras estimativas.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
