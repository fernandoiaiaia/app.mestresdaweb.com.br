"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft, Settings, Plus, Trash2, Edit3, Tags, X, Save,
    Search, Users, BarChart3, Eye, EyeOff, Loader2,
} from "lucide-react";

interface Segment {
    id: string;
    name: string;
    description: string | null;
    color: string;
    active: boolean;
    clientCount: number;
    avgTicket: number;
}

const segmentColors = [
    { name: "Azul", value: "blue", bg: "bg-blue-500", dot: "bg-blue-400", text: "text-blue-400", light: "bg-blue-500/10 border-blue-500/20", ring: "ring-blue-500/30" },
    { name: "Verde", value: "green", bg: "bg-blue-500", dot: "bg-blue-400", text: "text-blue-400", light: "bg-blue-500/10 border-blue-500/20", ring: "ring-blue-500/30" },
    { name: "Roxo", value: "purple", bg: "bg-purple-500", dot: "bg-purple-400", text: "text-purple-400", light: "bg-purple-500/10 border-purple-500/20", ring: "ring-purple-500/30" },
    { name: "Âmbar", value: "amber", bg: "bg-amber-500", dot: "bg-amber-400", text: "text-amber-400", light: "bg-amber-500/10 border-amber-500/20", ring: "ring-amber-500/30" },
    { name: "Ciano", value: "cyan", bg: "bg-cyan-500", dot: "bg-cyan-400", text: "text-cyan-400", light: "bg-cyan-500/10 border-cyan-500/20", ring: "ring-cyan-500/30" },
    { name: "Rosa", value: "pink", bg: "bg-pink-500", dot: "bg-pink-400", text: "text-pink-400", light: "bg-pink-500/10 border-pink-500/20", ring: "ring-pink-500/30" },
    { name: "Laranja", value: "orange", bg: "bg-orange-500", dot: "bg-orange-400", text: "text-orange-400", light: "bg-orange-500/10 border-orange-500/20", ring: "ring-orange-500/30" },
    { name: "Vermelho", value: "red", bg: "bg-red-500", dot: "bg-red-400", text: "text-red-400", light: "bg-red-500/10 border-red-500/20", ring: "ring-red-500/30" },
    { name: "Teal", value: "teal", bg: "bg-teal-500", dot: "bg-teal-400", text: "text-teal-400", light: "bg-teal-500/10 border-teal-500/20", ring: "ring-teal-500/30" },
    { name: "Indigo", value: "indigo", bg: "bg-indigo-500", dot: "bg-indigo-400", text: "text-indigo-400", light: "bg-indigo-500/10 border-indigo-500/20", ring: "ring-indigo-500/30" },
];

const getColor = (v: string) => segmentColors.find(c => c.value === v) || segmentColors[0];
const fmt = (v: number) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`;

export default function SegmentsPage() {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formColor, setFormColor] = useState("blue");

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // ═══ Load ═══
    useEffect(() => {
        (async () => {
            try {
                const res = await api<Segment[]>("/api/segments", { method: "GET" });
                if (res.success && res.data) setSegments(res.data);
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, []);

    const filtered = segments
        .filter(s => { const q = search.toLowerCase(); return s.name.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q); })
        .sort((a, b) => b.clientCount - a.clientCount);

    const totalClients = segments.reduce((s, seg) => s + seg.clientCount, 0);
    const totalRevenue = segments.reduce((s, seg) => s + (seg.clientCount * seg.avgTicket), 0);

    const maxClients = Math.max(...segments.map(s => s.clientCount), 1);

    // ═══ CRUD ═══
    const openCreate = () => { setEditId(null); setFormName(""); setFormDesc(""); setFormColor("blue"); setShowModal(true); };
    const openEdit = (s: Segment) => { setEditId(s.id); setFormName(s.name); setFormDesc(s.description || ""); setFormColor(s.color); setShowModal(true); };

    const saveSegment = async () => {
        if (!formName.trim()) return;
        try {
            if (editId) {
                const res = await api<Segment>(`/api/segments/${editId}`, { method: "PUT", body: { name: formName.trim(), description: formDesc.trim() || null, color: formColor } });
                if (res.success && res.data) setSegments(prev => prev.map(s => s.id === editId ? res.data! : s));
            } else {
                const res = await api<Segment>("/api/segments", { method: "POST", body: { name: formName.trim(), description: formDesc.trim() || null, color: formColor } });
                if (res.success && res.data) setSegments(prev => [...prev, res.data!]);
            }
            setShowModal(false);
        } catch (e) { console.error(e); }
    };

    const toggleActive = async (id: string) => {
        try {
            const res = await api<Segment>(`/api/segments/${id}/toggle`, { method: "PATCH" });
            if (res.success && res.data) setSegments(prev => prev.map(s => s.id === id ? res.data! : s));
        } catch (e) { console.error(e); }
    };

    const deleteSegment = async (id: string) => {
        try { await api(`/api/segments/${id}`, { method: "DELETE" }); setSegments(prev => prev.filter(s => s.id !== id)); setDeleteConfirm(null); } catch (e) { console.error(e); }
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
                    <span className="text-slate-300 text-sm font-medium">Segmentos</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Tags size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Segmentos</h1>
                            <p className="text-sm text-slate-400">Defina segmentos de mercado para classificar clientes</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Novo Segmento
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Segmentos", value: segments.length, icon: Tags, color: "text-indigo-400" },
                    { label: "Ativos", value: segments.filter(s => s.active).length, icon: Eye, color: "text-blue-400" },
                    { label: "Total de Clientes", value: totalClients, icon: Users, color: "text-blue-400" },
                    { label: "Receita Estimada", value: fmt(totalRevenue), icon: BarChart3, color: "text-amber-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-lg font-bold text-white block truncate">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Distribution */}
            {segments.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5 mb-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Distribuição de Clientes por Segmento</h3>
                    <div className="flex gap-1 h-7 rounded-lg overflow-hidden mb-3">
                        {[...segments].sort((a, b) => b.clientCount - a.clientCount).map(seg => {
                            const c = getColor(seg.color);
                            const pct = totalClients > 0 ? Math.max((seg.clientCount / totalClients) * 100, seg.clientCount > 0 ? 3 : 0) : 0;
                            return pct > 0 ? (
                                <div key={seg.id} className={`${c.bg} relative group cursor-pointer transition-all hover:opacity-80`} style={{ width: `${pct}%` }} title={`${seg.name}: ${seg.clientCount} clientes`}>
                                    <div className="absolute inset-0 flex items-center justify-center"><span className="text-[8px] font-bold text-white/90">{seg.clientCount}</span></div>
                                </div>
                            ) : null;
                        })}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {[...segments].sort((a, b) => b.clientCount - a.clientCount).filter(s => s.clientCount > 0).map(seg => {
                            const c = getColor(seg.color);
                            return (
                                <span key={seg.id} className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                                    {seg.name}: <span className="text-white font-bold">{seg.clientCount}</span>
                                </span>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar segmento..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40" />
                </div>
            </div>

            {/* Segments List */}
            <div className="space-y-2">
                {filtered.length === 0 && (
                    <div className="text-center py-14 text-slate-600">
                        <Tags size={36} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm mb-3">{segments.length === 0 ? "Nenhum segmento cadastrado ainda" : "Nenhum segmento encontrado"}</p>
                        <button onClick={openCreate} className="text-sm text-blue-400 hover:text-blue-300">+ Criar primeiro segmento</button>
                    </div>
                )}

                {filtered.map((seg, i) => {
                    const c = getColor(seg.color);
                    const barW = Math.max((seg.clientCount / maxClients) * 100, 2);
                    return (
                        <motion.div key={seg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className={`flex items-center gap-4 p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl hover:border-white/[0.1] transition-colors group ${!seg.active ? 'opacity-40' : ''}`}>
                            <div className={`w-4 h-4 rounded-full ${c.bg} shrink-0`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-bold text-white truncate">{seg.name}</span>
                                    {!seg.active && <span className="text-[9px] text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">Inativo</span>}
                                </div>
                                <span className="text-[11px] text-slate-500 block truncate">{seg.description}</span>
                            </div>
                            <div className="hidden md:block w-28 shrink-0">
                                <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden">
                                    <div className={`h-full ${c.bg} rounded-full transition-all flex items-center justify-end pr-1.5`} style={{ width: `${barW}%`, minWidth: '16px', opacity: 0.5 }}>
                                        <span className="text-[8px] font-bold text-white/90">{seg.clientCount}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden lg:flex items-center gap-5 shrink-0">
                                <div className="text-center"><span className="text-sm font-bold text-white block">{seg.clientCount}</span><span className="text-[9px] text-slate-600 uppercase tracking-widest">Clientes</span></div>
                                <div className="text-center"><span className="text-sm font-bold text-white block">{seg.avgTicket > 0 ? fmt(seg.avgTicket) : "—"}</span><span className="text-[9px] text-slate-600 uppercase tracking-widest">Ticket Médio</span></div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => toggleActive(seg.id)} className={`p-1.5 rounded-lg transition-colors ${seg.active ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:bg-white/5'}`}>{seg.active ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                                <button onClick={() => openEdit(seg)} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"><Edit3 size={14} /></button>
                                <button onClick={() => setDeleteConfirm(seg.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ═══ MODAL: Create/Edit ═══ */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><Tags size={16} className="text-indigo-400" /> {editId ? "Editar Segmento" : "Novo Segmento"}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome do Segmento <span className="text-red-400">*</span></label>
                                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Fintech" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Descrição</label>
                                    <textarea rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Características deste segmento de mercado..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Cor</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {segmentColors.map(c => (
                                            <button key={c.value} type="button" onClick={() => setFormColor(c.value)} className={`w-8 h-8 rounded-lg ${c.bg} transition-all ${formColor === c.value ? `ring-2 ring-offset-2 ring-offset-slate-900 ${c.ring}` : 'opacity-40 hover:opacity-70'}`} title={c.name} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={saveSegment} disabled={!formName.trim()} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${editId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white`}>
                                    <Save size={14} /> {editId ? "Salvar" : "Criar Segmento"}
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
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Excluir Segmento?</h3>
                                <p className="text-sm text-slate-400">Clientes associados a este segmento ficarão sem classificação.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => deleteSegment(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
