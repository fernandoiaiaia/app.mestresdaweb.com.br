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
    Tag,
    Loader2,
} from "lucide-react";

interface Category {
    id: string;
    name: string;
    emoji: string;
    color: string;
    _count?: { reasons: number };
}

interface LossReason {
    id: string;
    name: string;
    description: string | null;
    categoryId: string;
    active: boolean;
    usageCount: number;
    lastUsed: string | null;
    category?: { id: string; name: string; emoji: string; color: string };
}

const colorPresets = [
    { name: "Vermelho", value: "#ef4444" },
    { name: "Laranja", value: "#f97316" },
    { name: "Âmbar", value: "#f59e0b" },
    { name: "Verde", value: "#22c55e" },
    { name: "Ciano", value: "#06b6d4" },
    { name: "Azul", value: "#3b82f6" },
    { name: "Roxo", value: "#8b5cf6" },
    { name: "Rosa", value: "#ec4899" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Indigo", value: "#6366f1" },
];

const emojiPresets = ["💰", "📦", "⚔️", "⏰", "🏢", "📋", "🚫", "❌", "🔒", "💬", "📉", "🤷"];

const getCatStyle = (color: string) => ({
    color,
    backgroundColor: `${color}15`,
    borderColor: `${color}30`,
});

export default function LossReasonsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [reasons, setReasons] = useState<LossReason[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");

    // Reason modal
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formCategoryId, setFormCategoryId] = useState("");

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Category modal
    const [showCatModal, setShowCatModal] = useState(false);
    const [editCatId, setEditCatId] = useState<string | null>(null);
    const [catName, setCatName] = useState("");
    const [catEmoji, setCatEmoji] = useState("💰");
    const [catColor, setCatColor] = useState("#ef4444");
    const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);

    // ═══ Load Data ═══
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [catRes, reasonRes] = await Promise.all([
                api<Category[]>("/api/loss-reasons/categories", { method: "GET" }),
                api<LossReason[]>("/api/loss-reasons", { method: "GET" }),
            ]);
            if (catRes?.success && catRes.data) setCategories(catRes.data);
            if (reasonRes?.success && reasonRes.data) setReasons(reasonRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const getCat = (id: string) => categories.find(c => c.id === id);
    const getCatColor = (id: string) => getCat(id)?.color || "#64748b";

    const filtered = reasons
        .filter(r => {
            const q = searchQuery.toLowerCase();
            return r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q);
        })
        .filter(r => filterCategory === "all" || r.categoryId === filterCategory)
        .sort((a, b) => b.usageCount - a.usageCount);

    // ═══ Reason CRUD ═══
    const openCreate = () => { setEditId(null); setFormName(""); setFormDesc(""); setFormCategoryId(categories[0]?.id || ""); setShowModal(true); };
    const openEdit = (r: LossReason) => { setEditId(r.id); setFormName(r.name); setFormDesc(r.description || ""); setFormCategoryId(r.categoryId); setShowModal(true); };

    const saveReason = async () => {
        if (!formName.trim()) return;
        try {
            if (editId) {
                const res = await api<LossReason>(`/api/loss-reasons/${editId}`, {
                    method: "PUT",
                    body: { name: formName.trim(), description: formDesc.trim() || null, categoryId: formCategoryId },
                });
                if (res.success && res.data) {
                    setReasons(prev => prev.map(r => r.id === editId ? res.data! : r));
                }
            } else {
                const res = await api<LossReason>("/api/loss-reasons", {
                    method: "POST",
                    body: { name: formName.trim(), description: formDesc.trim() || null, categoryId: formCategoryId },
                });
                if (res.success && res.data) {
                    setReasons(prev => [...prev, res.data!]);
                }
            }
            setShowModal(false);
        } catch (e) {
            console.error(e);
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

    // ═══ Category CRUD ═══
    const openCreateCat = () => { setEditCatId(null); setCatName(""); setCatEmoji("💰"); setCatColor("#ef4444"); setShowCatModal(true); };
    const openEditCat = (c: Category) => { setEditCatId(c.id); setCatName(c.name); setCatEmoji(c.emoji); setCatColor(c.color); setShowCatModal(true); };

    const saveCat = async () => {
        if (!catName.trim()) return;
        try {
            if (editCatId) {
                const res = await api<Category>(`/api/loss-reasons/categories/${editCatId}`, {
                    method: "PUT",
                    body: { name: catName.trim(), emoji: catEmoji, color: catColor },
                });
                if (res.success && res.data) {
                    setCategories(prev => prev.map(c => c.id === editCatId ? { ...c, ...res.data! } : c));
                }
            } else {
                const res = await api<Category>("/api/loss-reasons/categories", {
                    method: "POST",
                    body: { name: catName.trim(), emoji: catEmoji, color: catColor },
                });
                if (res.success && res.data) {
                    setCategories(prev => [...prev, res.data!]);
                }
            }
            setEditCatId(null);
            setCatName(""); setCatEmoji("💰"); setCatColor("#ef4444");
        } catch (e) {
            console.error(e);
        }
    };

    const deleteCat = async (id: string) => {
        try {
            await api(`/api/loss-reasons/categories/${id}`, { method: "DELETE" });
            await loadData(); // Reload to get reassigned reasons
            setDeleteCatConfirm(null);
        } catch (e) {
            console.error(e);
        }
    };

    // Stats
    const totalUsage = reasons.reduce((s, r) => s + r.usageCount, 0);
    const topReason = [...reasons].sort((a, b) => b.usageCount - a.usageCount)[0];
    const topCat = categories.reduce((best, cat) => {
        const count = reasons.filter(r => r.categoryId === cat.id).reduce((s, r) => s + r.usageCount, 0);
        return count > best.count ? { cat, count } : best;
    }, { cat: categories[0], count: 0 });

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
                    { label: "Categoria Mais Comum", value: topCat?.cat ? `${topCat.cat.emoji} ${topCat.cat.name}` : "—", icon: TrendingDown, color: "text-amber-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-lg font-bold text-white block truncate">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Category Distribution Bar */}
            {categories.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5 mb-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Distribuição por Categoria</h3>
                    <div className="flex gap-1 h-6 rounded-lg overflow-hidden mb-3">
                        {categories.map(cat => {
                            const count = reasons.filter(r => r.categoryId === cat.id).reduce((s, r) => s + r.usageCount, 0);
                            const pct = totalUsage > 0 ? Math.max((count / totalUsage) * 100, count > 0 ? 3 : 0) : 0;
                            return pct > 0 ? (
                                <div key={cat.id} className="relative group cursor-pointer transition-all hover:opacity-80" style={{ width: `${pct}%`, backgroundColor: `${cat.color}80` }} title={`${cat.name}: ${count} usos`}>
                                    <div className="absolute inset-0 flex items-center justify-center"><span className="text-[8px] font-bold text-white/80">{count}</span></div>
                                </div>
                            ) : null;
                        })}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {categories.map(cat => {
                            const count = reasons.filter(r => r.categoryId === cat.id).reduce((s, r) => s + r.usageCount, 0);
                            if (count === 0) return null;
                            return (
                                <span key={cat.id} className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <span>{cat.emoji}</span> {cat.name}: <span className="text-white font-bold">{count}</span>
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
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer">
                    <option value="all">Todas as categorias</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
                <button onClick={openCreateCat} className="flex items-center gap-1.5 px-3 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Gerenciar Categorias">
                    <Tag size={14} /> Categorias
                </button>
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
                    const cat = getCat(reason.categoryId);
                    const barW = totalUsage > 0 ? Math.max((reason.usageCount / (topReason?.usageCount || 1)) * 100, 2) : 2;
                    return (
                        <motion.div key={reason.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className={`flex items-center gap-4 p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl hover:border-white/[0.1] transition-colors group ${!reason.active ? 'opacity-50' : ''}`}>
                            {/* Category badge */}
                            <span className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border shrink-0" style={getCatStyle(cat?.color || "#64748b")}>
                                {cat?.emoji} {cat?.name || "—"}
                            </span>

                            {/* Name & Description */}
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-white block truncate">{reason.name}</span>
                                <span className="text-[11px] text-slate-500 block truncate">{reason.description || ""}</span>
                            </div>

                            {/* Usage bar */}
                            <div className="hidden md:block w-32 shrink-0">
                                <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all flex items-center justify-end pr-1.5" style={{ width: `${barW}%`, minWidth: '16px', backgroundColor: `${cat?.color || '#64748b'}60` }}>
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
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
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
                                {categories.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Categoria</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {categories.map(cat => (
                                                <button key={cat.id} type="button" onClick={() => setFormCategoryId(cat.id)} className={`p-2.5 rounded-xl text-left transition-all border ${formCategoryId === cat.id ? '' : 'border-white/[0.06] hover:border-white/[0.1]'}`} style={formCategoryId === cat.id ? getCatStyle(cat.color) : undefined}>
                                                    <span className="text-sm block">{cat.emoji}</span>
                                                    <span className={`text-[10px] font-bold ${formCategoryId === cat.id ? '' : 'text-slate-400'}`}>{cat.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={saveReason} disabled={!formName.trim() || !formCategoryId} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${editId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
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

            {/* ═══ MODAL: Category CRUD ═══ */}
            <AnimatePresence>
                {showCatModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowCatModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><Tag size={16} className="text-blue-400" /> Gerenciar Categorias</h2>
                                <button onClick={() => setShowCatModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Existing categories */}
                                {categories.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Categorias Existentes</label>
                                        <div className="space-y-2">
                                            {categories.map(c => (
                                                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-slate-800/30 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c.color }} />
                                                        <span className="text-sm">{c.emoji}</span>
                                                        <span className="text-sm text-white font-medium">{c.name}</span>
                                                        <span className="text-[9px] text-slate-600">{reasons.filter(r => r.categoryId === c.id).length} motivos</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button onClick={() => openEditCat(c)} className="p-1 rounded text-slate-600 hover:text-white"><Edit3 size={12} /></button>
                                                        <button onClick={() => setDeleteCatConfirm(c.id)} className="p-1 rounded text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <hr className="border-white/[0.04]" />

                                {/* Add / Edit form */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">{editCatId ? "Editar Categoria" : "Nova Categoria"}</label>
                                    <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Nome da categoria" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 mb-3" />

                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Emoji</label>
                                    <div className="flex gap-1.5 flex-wrap mb-3">
                                        {emojiPresets.map(em => (
                                            <button key={em} type="button" onClick={() => setCatEmoji(em)} className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border transition-all ${catEmoji === em ? 'border-white/30 bg-white/10 scale-110' : 'border-white/[0.04] hover:bg-white/5'}`}>{em}</button>
                                        ))}
                                    </div>

                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Cor</label>
                                    <div className="flex gap-2 flex-wrap mb-3">
                                        {colorPresets.map(cp => (
                                            <button key={cp.value} type="button" onClick={() => setCatColor(cp.value)} className={`w-7 h-7 rounded-lg transition-all ${catColor === cp.value ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white/30 scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'}`} style={{ backgroundColor: cp.value }} title={cp.name} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent" />
                                        <input type="text" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-24 px-3 py-1.5 bg-slate-800/50 border border-white/[0.08] rounded-lg text-xs text-white font-mono focus:outline-none" />
                                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={getCatStyle(catColor)}>{catEmoji} Preview</span>
                                    </div>
                                    <button onClick={saveCat} disabled={!catName.trim()} className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${editCatId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
                                        <Save size={14} /> {editCatId ? "Salvar Categoria" : "Criar Categoria"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Delete Category ═══ */}
            <AnimatePresence>
                {deleteCatConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setDeleteCatConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Excluir Categoria?</h3>
                                <p className="text-sm text-slate-400">Motivos desta categoria serão reatribuídos para outra categoria.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteCatConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => deleteCatConfirm && deleteCat(deleteCatConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
