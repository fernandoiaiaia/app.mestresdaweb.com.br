"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft, Settings, ClipboardCheck, Plus, X, Edit3, Trash2,
    GripVertical, Save, CheckCircle2, Tag, Eye, Loader2,
} from "lucide-react";

interface ChecklistCat { id: string; name: string; color: string; _count?: { questions: number }; }
interface Question { id: string; text: string; categoryId: string; defaultValue: string | null; isRequired: boolean; sortOrder: number; category?: { id: string; name: string; color: string }; }

const colorPresets = [
    { name: "Azul", value: "#3b82f6" }, { name: "Roxo", value: "#8b5cf6" }, { name: "Âmbar", value: "#f59e0b" },
    { name: "Rosa", value: "#ec4899" }, { name: "Ciano", value: "#06b6d4" }, { name: "Verde", value: "#22c55e" },
    { name: "Laranja", value: "#f97316" }, { name: "Vermelho", value: "#ef4444" }, { name: "Indigo", value: "#6366f1" }, { name: "Teal", value: "#14b8a6" },
];
const getCatStyle = (color: string) => ({ color, backgroundColor: `${color}15`, borderColor: `${color}30` });

export default function ChecklistConfigPage() {
    const [categories, setCategories] = useState<ChecklistCat[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState("all");
    const [showPreview, setShowPreview] = useState(false);

    // Question modal
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formText, setFormText] = useState("");
    const [formCategoryId, setFormCategoryId] = useState("");
    const [formDefault, setFormDefault] = useState("");
    const [formRequired, setFormRequired] = useState(false);

    // Category modal
    const [showCatModal, setShowCatModal] = useState(false);
    const [editCatId, setEditCatId] = useState<string | null>(null);
    const [catName, setCatName] = useState("");
    const [catColor, setCatColor] = useState("#3b82f6");
    const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);

    // ═══ Load ═══
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [catsRes, qsRes] = await Promise.all([
                api<ChecklistCat[]>("/api/checklist/categories", { method: "GET" }),
                api<Question[]>("/api/checklist", { method: "GET" }),
            ]);
            if (catsRes?.success && catsRes.data) setCategories(catsRes.data);
            if (qsRes?.success && qsRes.data) setQuestions(qsRes.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };
    useEffect(() => { loadData(); }, []);

    const getCat = (id: string) => categories.find(c => c.id === id) || questions.find(q => q.categoryId === id)?.category;
    const filtered = filterCategory === "all" ? questions : questions.filter(q => q.categoryId === filterCategory);

    // ═══ Category CRUD ═══
    const openCreateCat = () => { setEditCatId(null); setCatName(""); setCatColor("#3b82f6"); setShowCatModal(true); };
    const openEditCat = (c: ChecklistCat) => { setEditCatId(c.id); setCatName(c.name); setCatColor(c.color); setShowCatModal(true); };

    const saveCat = async () => {
        if (!catName.trim()) return;
        try {
            if (editCatId) {
                const res = await api<ChecklistCat>(`/api/checklist/categories/${editCatId}`, { method: "PUT", body: { name: catName.trim(), color: catColor } });
                if (res.success && res.data) setCategories(prev => prev.map(c => c.id === editCatId ? { ...c, ...res.data! } : c));
            } else {
                const res = await api<ChecklistCat>("/api/checklist/categories", { method: "POST", body: { name: catName.trim(), color: catColor } });
                if (res.success && res.data) setCategories(prev => [...prev, res.data!]);
            }
            setShowCatModal(false);
        } catch (e) { console.error(e); }
    };

    const deleteCat = async (id: string) => {
        try { await api(`/api/checklist/categories/${id}`, { method: "DELETE" }); await loadData(); setDeleteCatConfirm(null); } catch (e) { console.error(e); }
    };

    // ═══ Question CRUD ═══
    const openCreate = () => { setEditId(null); setFormText(""); setFormCategoryId(categories[0]?.id || ""); setFormDefault(""); setFormRequired(false); setShowModal(true); };
    const openEdit = (q: Question) => { setEditId(q.id); setFormText(q.text); setFormCategoryId(q.categoryId); setFormDefault(q.defaultValue || ""); setFormRequired(q.isRequired); setShowModal(true); };

    const saveQuestion = async () => {
        if (!formText.trim()) return;
        try {
            if (editId) {
                const res = await api<Question>(`/api/checklist/${editId}`, { method: "PUT", body: { text: formText.trim(), categoryId: formCategoryId, defaultValue: formDefault.trim() || null, isRequired: formRequired } });
                if (res.success && res.data) setQuestions(prev => prev.map(q => q.id === editId ? res.data! : q));
            } else {
                const res = await api<Question>("/api/checklist", { method: "POST", body: { text: formText.trim(), categoryId: formCategoryId, defaultValue: formDefault.trim() || null, isRequired: formRequired } });
                if (res.success && res.data) setQuestions(prev => [...prev, res.data!]);
            }
            setShowModal(false);
        } catch (e) { console.error(e); }
    };

    const deleteQuestion = async (id: string) => {
        try { await api(`/api/checklist/${id}`, { method: "DELETE" }); setQuestions(prev => prev.filter(q => q.id !== id)); } catch (e) { console.error(e); }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-slate-500" /></div>;
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Checklist de Completude</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <ClipboardCheck size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Checklist de Completude</h1>
                            <p className="text-sm text-slate-400">Perguntas padrão usadas na etapa de completude do escopo</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-all">
                            <Eye size={14} /> Preview
                        </button>
                        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                            <Plus size={16} /> Nova Pergunta
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats + Filter */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    <span>{questions.length} perguntas</span>
                    <span>·</span>
                    <span>{questions.filter(q => q.isRequired).length} obrigatórias</span>
                    <span>·</span>
                    <span>{new Set(questions.map(q => q.categoryId)).size} categorias</span>
                </div>
                <div className="flex items-center gap-3">
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 bg-slate-800/50 border border-white/[0.08] rounded-xl text-xs text-slate-300 focus:outline-none">
                        <option value="all">Todas categorias</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button onClick={openCreateCat} className="flex items-center gap-1.5 px-3 py-2 border border-white/[0.08] rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Tag size={12} /> Categorias
                    </button>
                </div>
            </div>

            {/* Questions List */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 mb-6">
                {filtered.length === 0 && (
                    <div className="text-center py-14 text-slate-600">
                        <ClipboardCheck size={36} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm mb-3">{questions.length === 0 ? "Nenhuma pergunta cadastrada" : "Nenhuma pergunta nesta categoria"}</p>
                        <button onClick={openCreate} className="text-sm text-blue-400 hover:text-blue-300">+ Criar primeira pergunta</button>
                    </div>
                )}
                {filtered.map((q, i) => {
                    const cat = getCat(q.categoryId);
                    return (
                        <motion.div key={q.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-start gap-3 p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl group hover:bg-white/[0.02] transition-colors">
                            <GripVertical size={14} className="text-slate-700 cursor-grab mt-1 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-white">{q.text}</span>
                                    {q.isRequired && <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">Obrigatória</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border" style={getCatStyle(cat?.color || '#64748b')}>{cat?.name || '—'}</span>
                                    {q.defaultValue && <span className="text-[10px] text-slate-600 truncate">Padrão: {q.defaultValue}</span>}
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5"><Edit3 size={14} /></button>
                                <button onClick={() => deleteQuestion(q.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Preview Panel */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
                        <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-white mb-4">Preview do Checklist (como o consultor verá)</h3>
                            <div className="space-y-3">
                                {questions.map((q, i) => (
                                    <div key={q.id} className="p-3 bg-slate-800/50 border border-white/[0.04] rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                                            <span className="text-sm text-white">{q.text}</span>
                                            {q.isRequired && <span className="text-red-400 text-sm">*</span>}
                                        </div>
                                        <input type="text" placeholder={q.defaultValue || "Digite a resposta..."} className="w-full px-3 py-2 bg-slate-800 border border-white/[0.06] rounded-lg text-xs text-slate-400 placeholder:text-slate-600" readOnly />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Question ═══ */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                                <h2 className="text-base font-bold text-white">{editId ? "Editar Pergunta" : "Nova Pergunta"}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Pergunta <span className="text-red-400">*</span></label>
                                    <textarea value={formText} onChange={e => setFormText(e.target.value)} rows={2} placeholder="Ex: Qual modelo de autenticação?" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 resize-none" autoFocus />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Categoria</label>
                                    {categories.length === 0 ? (
                                        <p className="text-sm text-slate-500">Crie uma categoria primeiro.</p>
                                    ) : (
                                        <div className="flex gap-2 flex-wrap">
                                            {categories.map(c => (
                                                <button key={c.id} type="button" onClick={() => setFormCategoryId(c.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${formCategoryId === c.id ? '' : 'text-slate-500 border-white/[0.06] hover:text-white'}`} style={formCategoryId === c.id ? getCatStyle(c.color) : undefined}>{c.name}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Valor Padrão (opcional)</label>
                                    <input type="text" value={formDefault} onChange={e => setFormDefault(e.target.value)} placeholder="Resposta sugerida quando não informado" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formRequired} onChange={e => setFormRequired(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500/30" />
                                    <span className="text-sm text-slate-300">Pergunta obrigatória</span>
                                </label>
                            </div>
                            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
                                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
                                <button onClick={saveQuestion} disabled={!formText.trim() || !formCategoryId} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-all ${editId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                                    <Save size={14} /> {editId ? "Salvar" : "Criar"}
                                </button>
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
                                                        <span className="text-sm text-white font-medium">{c.name}</span>
                                                        <span className="text-[9px] text-slate-600">{c._count?.questions || 0} perguntas</span>
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
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Cor</label>
                                    <div className="flex gap-2 flex-wrap mb-3">
                                        {colorPresets.map(cp => (
                                            <button key={cp.value} type="button" onClick={() => setCatColor(cp.value)} className={`w-7 h-7 rounded-lg transition-all ${catColor === cp.value ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white/30 scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'}`} style={{ backgroundColor: cp.value }} title={cp.name} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent" />
                                        <input type="text" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-24 px-3 py-1.5 bg-slate-800/50 border border-white/[0.08] rounded-lg text-xs text-white font-mono focus:outline-none" />
                                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={getCatStyle(catColor)}>Preview</span>
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
                                <p className="text-sm text-slate-400">Perguntas desta categoria serão reatribuídas para outra.</p>
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
