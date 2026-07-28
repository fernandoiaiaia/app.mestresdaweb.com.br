"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft, Settings, Plus, Trash2, Edit3, MessageCircle, X, Save,
    Search, Eye, EyeOff, BarChart3, Copy, ChevronDown, ChevronUp, Zap,
    BookOpen, Shield, Tag, Loader2,
} from "lucide-react";

interface ObjCategory { id: string; name: string; emoji: string; color: string; _count?: { objections: number }; }
interface Objection { id: string; objection: string; categoryId: string; scripts: string[]; active: boolean; usageCount: number; successRate: number; category?: { id: string; name: string; emoji: string; color: string }; }

const colorPresets = [
    { name: "Vermelho", value: "#ef4444" }, { name: "Âmbar", value: "#f59e0b" }, { name: "Roxo", value: "#8b5cf6" },
    { name: "Azul", value: "#3b82f6" }, { name: "Laranja", value: "#f97316" }, { name: "Ciano", value: "#06b6d4" },
    { name: "Verde", value: "#22c55e" }, { name: "Rosa", value: "#ec4899" }, { name: "Indigo", value: "#6366f1" }, { name: "Teal", value: "#14b8a6" },
];
const emojiPresets = ["💰", "🤝", "⏰", "❓", "⚔️", "👔", "🛡️", "💬", "🙅", "🔒", "🎯", "💡"];
const getCatStyle = (color: string) => ({ color, backgroundColor: `${color}15`, borderColor: `${color}30` });

export default function ObjectionsPage() {
    const [categories, setCategories] = useState<ObjCategory[]>([]);
    const [objections, setObjections] = useState<Objection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Objection modal
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formObjection, setFormObjection] = useState("");
    const [formCategoryId, setFormCategoryId] = useState("");
    const [formScripts, setFormScripts] = useState<string[]>([""]);

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Category modal
    const [showCatModal, setShowCatModal] = useState(false);
    const [editCatId, setEditCatId] = useState<string | null>(null);
    const [catName, setCatName] = useState("");
    const [catEmoji, setCatEmoji] = useState("💰");
    const [catColor, setCatColor] = useState("#ef4444");
    const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);

    // Copied feedback
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // ═══ Load ═══
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [catsRes, objsRes] = await Promise.all([
                api<ObjCategory[]>("/api/objections/categories", { method: "GET" }),
                api<Objection[]>("/api/objections", { method: "GET" }),
            ]);
            if (catsRes?.success && catsRes.data) setCategories(catsRes.data);
            if (objsRes?.success && objsRes.data) setObjections(objsRes.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };
    useEffect(() => { loadData(); }, []);

    const getCat = (id: string) => categories.find(c => c.id === id) || objections.find(o => o.categoryId === id)?.category;

    const filtered = objections
        .filter(o => { const q = search.toLowerCase(); return o.objection.toLowerCase().includes(q) || o.scripts.some(s => s.toLowerCase().includes(q)); })
        .filter(o => filterCategory === "all" || o.categoryId === filterCategory)
        .sort((a, b) => b.usageCount - a.usageCount);

    const totalUsage = objections.reduce((s, o) => s + o.usageCount, 0);
    const avgSuccess = objections.length > 0 ? (objections.reduce((s, o) => s + o.successRate, 0) / objections.length).toFixed(0) : "0";
    const totalScripts = objections.reduce((s, o) => s + o.scripts.length, 0);

    // ═══ Category CRUD ═══
    const openCreateCat = () => { setEditCatId(null); setCatName(""); setCatEmoji("💰"); setCatColor("#ef4444"); setShowCatModal(true); };
    const openEditCat = (c: ObjCategory) => { setEditCatId(c.id); setCatName(c.name); setCatEmoji(c.emoji); setCatColor(c.color); setShowCatModal(true); };

    const saveCat = async () => {
        if (!catName.trim()) return;
        try {
            if (editCatId) {
                const res = await api<ObjCategory>(`/api/objections/categories/${editCatId}`, { method: "PUT", body: { name: catName.trim(), emoji: catEmoji, color: catColor } });
                if (res.success && res.data) setCategories(prev => prev.map(c => c.id === editCatId ? { ...c, ...res.data! } : c));
            } else {
                const res = await api<ObjCategory>("/api/objections/categories", { method: "POST", body: { name: catName.trim(), emoji: catEmoji, color: catColor } });
                if (res.success && res.data) setCategories(prev => [...prev, res.data!]);
            }
            setShowCatModal(false);
        } catch (e) { console.error(e); }
    };

    const deleteCat = async (id: string) => {
        try { await api(`/api/objections/categories/${id}`, { method: "DELETE" }); await loadData(); setDeleteCatConfirm(null); } catch (e) { console.error(e); }
    };

    // ═══ Objection CRUD ═══
    const openCreate = () => { setEditId(null); setFormObjection(""); setFormCategoryId(categories[0]?.id || ""); setFormScripts([""]); setShowModal(true); };
    const openEdit = (o: Objection) => { setEditId(o.id); setFormObjection(o.objection); setFormCategoryId(o.categoryId); setFormScripts(o.scripts.length > 0 ? [...o.scripts] : [""]); setShowModal(true); };

    const saveObjection = async () => {
        if (!formObjection.trim()) return;
        const cleanScripts = formScripts.map(s => s.trim()).filter(s => s.length > 0);
        try {
            if (editId) {
                const res = await api<Objection>(`/api/objections/${editId}`, { method: "PUT", body: { objection: formObjection.trim(), categoryId: formCategoryId, scripts: cleanScripts } });
                if (res.success && res.data) setObjections(prev => prev.map(o => o.id === editId ? res.data! : o));
            } else {
                const res = await api<Objection>("/api/objections", { method: "POST", body: { objection: formObjection.trim(), categoryId: formCategoryId, scripts: cleanScripts } });
                if (res.success && res.data) { setObjections(prev => [...prev, res.data!]); setExpandedId(res.data!.id); }
            }
            setShowModal(false);
        } catch (e) { console.error(e); }
    };

    const toggleActive = async (id: string) => {
        try {
            const res = await api<Objection>(`/api/objections/${id}/toggle`, { method: "PATCH" });
            if (res.success && res.data) setObjections(prev => prev.map(o => o.id === id ? res.data! : o));
        } catch (e) { console.error(e); }
    };

    const deleteObjection = async (id: string) => {
        try { await api(`/api/objections/${id}`, { method: "DELETE" }); setObjections(prev => prev.filter(o => o.id !== id)); setDeleteConfirm(null); if (expandedId === id) setExpandedId(null); } catch (e) { console.error(e); }
    };

    const addScriptField = () => setFormScripts(prev => [...prev, ""]);
    const removeScriptField = (idx: number) => setFormScripts(prev => prev.filter((_, i) => i !== idx));
    const updateScript = (idx: number, val: string) => setFormScripts(prev => prev.map((s, i) => i === idx ? val : s));

    const copyScript = (text: string, scriptKey: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(scriptKey);
        setTimeout(() => setCopiedId(null), 1500);
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
                    <span className="text-slate-300 text-sm font-medium">Objeções</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                            <Shield size={20} className="text-rose-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Objeções</h1>
                            <p className="text-sm text-slate-400">Banco de objeções comuns e scripts de contorno para advisors</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Nova Objeção
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Objeções", value: objections.length, icon: MessageCircle, color: "text-rose-400" },
                    { label: "Scripts de Contorno", value: totalScripts, icon: BookOpen, color: "text-blue-400" },
                    { label: "Total de Usos", value: totalUsage, icon: BarChart3, color: "text-purple-400" },
                    { label: "Taxa Média de Sucesso", value: avgSuccess + "%", icon: Zap, color: "text-blue-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-lg font-bold text-white block truncate">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar objeção ou script..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/40" />
                </div>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer min-w-[160px]">
                    <option value="all">Todas as categorias</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
                <button onClick={openCreateCat} className="flex items-center gap-1.5 px-3 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Gerenciar Categorias">
                    <Tag size={14} /> Categorias
                </button>
            </div>

            {/* Objections List */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-14 text-slate-600">
                        <MessageCircle size={36} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm mb-3">{objections.length === 0 ? "Nenhuma objeção cadastrada ainda" : "Nenhuma objeção encontrada"}</p>
                        <button onClick={openCreate} className="text-sm text-blue-400 hover:text-blue-300">+ Criar primeira objeção</button>
                    </div>
                )}

                {filtered.map((obj, i) => {
                    const cat = getCat(obj.categoryId);
                    const isExpanded = expandedId === obj.id;
                    return (
                        <motion.div key={obj.id} layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden ${!obj.active ? 'opacity-40' : ''}`}>
                            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors" onClick={() => setExpandedId(isExpanded ? null : obj.id)}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border shrink-0" style={getCatStyle(cat?.color || '#64748b')}>
                                        {cat?.emoji} {cat?.name || '—'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate">&ldquo;{obj.objection}&rdquo;</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 ml-3">
                                    <div className="hidden md:flex items-center gap-4">
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><BookOpen size={10} /> {obj.scripts.length} scripts</span>
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><BarChart3 size={10} /> {obj.usageCount}x</span>
                                        <span className={`text-[10px] font-bold flex items-center gap-1 ${obj.successRate >= 60 ? 'text-blue-400' : obj.successRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                            <Zap size={10} /> {obj.successRate}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); toggleActive(obj.id); }} className={`p-1.5 rounded-lg transition-colors ${obj.active ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:bg-white/5'}`}>
                                            {obj.active ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(obj); }} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors"><Edit3 size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(obj.id); }} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                        <div className="px-4 pb-4 border-t border-white/[0.04]">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-3 mb-2">Scripts de Contorno</h4>
                                            {obj.scripts.length === 0 ? (
                                                <p className="text-xs text-slate-600 py-4 text-center">Nenhum script de contorno cadastrado</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {obj.scripts.map((script, si) => {
                                                        const scriptKey = obj.id + "-" + si;
                                                        return (
                                                            <div key={si} className="relative p-3 bg-slate-800/60 border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition-colors group">
                                                                <div className="flex items-start gap-3">
                                                                    <span className="text-[9px] font-bold text-slate-600 bg-slate-700/40 rounded px-1.5 py-0.5 mt-0.5 shrink-0">#{si + 1}</span>
                                                                    <p className="text-[12px] text-slate-300 leading-relaxed flex-1">{script}</p>
                                                                    <button onClick={() => copyScript(script, scriptKey)} className={`p-1.5 rounded-lg shrink-0 transition-all ${copiedId === scriptKey ? 'text-blue-400 bg-blue-500/10' : 'text-slate-600 hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100'}`} title="Copiar script">
                                                                        {copiedId === scriptKey ? <Zap size={12} /> : <Copy size={12} />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-white/[0.04]">
                                                <span className="text-[10px] text-slate-600">Usado {obj.usageCount} vezes</span>
                                                <span className="text-[10px] text-slate-600">·</span>
                                                <span className={`text-[10px] font-medium ${obj.successRate >= 60 ? 'text-blue-400' : obj.successRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {obj.successRate}% taxa de sucesso
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* ═══ MODAL: Create/Edit Objection ═══ */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><Shield size={16} className="text-rose-400" /> {editId ? "Editar Objeção" : "Nova Objeção"}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Objeção do Cliente <span className="text-red-400">*</span></label>
                                    <input type="text" value={formObjection} onChange={(e) => setFormObjection(e.target.value)} placeholder='Ex: "Está muito caro para o nosso orçamento"' className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Categoria</label>
                                    {categories.length === 0 ? (
                                        <p className="text-sm text-slate-500">Crie uma categoria primeiro usando o botão &quot;Categorias&quot;.</p>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {categories.map(cat => (
                                                <button key={cat.id} type="button" onClick={() => setFormCategoryId(cat.id)} className={`p-2.5 rounded-xl text-left transition-all border ${formCategoryId === cat.id ? '' : 'border-white/[0.06] hover:border-white/[0.1]'}`} style={formCategoryId === cat.id ? getCatStyle(cat.color) : undefined}>
                                                    <span className="text-sm block">{cat.emoji}</span>
                                                    <span className={`text-[10px] font-bold ${formCategoryId === cat.id ? '' : 'text-slate-400'}`}>{cat.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Scripts de Contorno</label>
                                        <button type="button" onClick={addScriptField} className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"><Plus size={10} /> Adicionar</button>
                                    </div>
                                    <div className="space-y-2">
                                        {formScripts.map((script, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <textarea rows={3} value={script} onChange={(e) => updateScript(idx, e.target.value)} placeholder={`Script #${idx + 1} — Como contornar essa objeção...`} className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/40 resize-none" />
                                                {formScripts.length > 1 && (
                                                    <button type="button" onClick={() => removeScriptField(idx)} className="p-2 text-slate-600 hover:text-red-400 self-start mt-1"><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3 sticky bottom-0 bg-slate-900">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={saveObjection} disabled={!formObjection.trim() || !formCategoryId} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${editId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-rose-600 hover:bg-rose-500'} text-white`}>
                                    <Save size={14} /> {editId ? "Salvar" : "Criar Objeção"}
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
                                <h3 className="text-base font-bold text-white mb-1">Excluir Objeção?</h3>
                                <p className="text-sm text-slate-400">Todos os scripts de contorno associados serão removidos.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => deleteObjection(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Excluir</button>
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
                                                        <span className="text-[9px] text-slate-600">{c._count?.objections || 0} objeções</span>
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
                                <p className="text-sm text-slate-400">Objeções desta categoria serão reatribuídas para outra.</p>
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
