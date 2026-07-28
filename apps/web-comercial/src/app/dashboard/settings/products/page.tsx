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
    Package,
    X,
    Save,
    Search,
    DollarSign,
    Tag,
    Layers,
    BarChart3,
    Eye,
    EyeOff,
    Loader2,
} from "lucide-react";

type ProductType = "produto" | "servico" | "combo" | "assinatura";

interface ProductCategory {
    id: string;
    name: string;
    color: string;
    _count?: { products: number };
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    type: ProductType;
    categoryId: string;
    priceMin: number;
    priceMax: number;
    billingModel: string;
    active: boolean;
    usageCount: number;
    category?: { id: string; name: string; color: string };
}

const typeConfig: Record<ProductType, { label: string; color: string; emoji: string }> = {
    produto: { label: "Produto", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", emoji: "📦" },
    servico: { label: "Serviço", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", emoji: "⚙️" },
    combo: { label: "Combo", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", emoji: "🎁" },
    assinatura: { label: "Assinatura", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", emoji: "🔄" },
};

const recurrenceLabels: Record<string, string> = {
    unico: "Único", mensal: "Mensal", trimestral: "Trimestral", semestral: "Semestral",
    anual: "Anual", "sob-demanda": "Sob Demanda", "por-hora": "Por Hora",
};

const colorPresets = [
    { name: "Azul", value: "#3b82f6" }, { name: "Roxo", value: "#8b5cf6" },
    { name: "Verde", value: "#22c55e" }, { name: "Âmbar", value: "#f59e0b" },
    { name: "Ciano", value: "#06b6d4" }, { name: "Rosa", value: "#ec4899" },
    { name: "Laranja", value: "#f97316" }, { name: "Vermelho", value: "#ef4444" },
    { name: "Indigo", value: "#6366f1" }, { name: "Teal", value: "#14b8a6" },
];

const getCatStyle = (color: string) => ({ color, backgroundColor: `${color}15`, borderColor: `${color}30` });

const getRecurrenceBadgeColor = (r: string) => {
    switch (r) {
        case "mensal": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
        case "trimestral": case "semestral": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
        case "anual": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
        case "sob-demanda": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
        case "por-hora": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
        default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Category modal
    const [showCatModal, setShowCatModal] = useState(false);
    const [editCatId, setEditCatId] = useState<string | null>(null);
    const [catName, setCatName] = useState("");
    const [catColor, setCatColor] = useState("#3b82f6");
    const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);

    // ═══ Load Data ═══
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [catRes, prodRes] = await Promise.all([
                api<ProductCategory[]>("/api/products/categories", { method: "GET" }),
                api<Product[]>("/api/products", { method: "GET" }),
            ]);
            if (catRes?.success && catRes.data) setCategories(catRes.data);
            if (prodRes?.success && prodRes.data) setProducts(prodRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Filters
    const filtered = products
        .filter(p => {
            const q = search.toLowerCase();
            return p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
        })
        .filter(p => filterType === "all" || p.type === filterType)
        .filter(p => filterCategory === "all" || p.categoryId === filterCategory)
        .sort((a, b) => b.usageCount - a.usageCount);

    // Category CRUD
    const openCreateCat = () => { setEditCatId(null); setCatName(""); setCatColor("#3b82f6"); setShowCatModal(true); };
    const openEditCat = (c: ProductCategory) => { setEditCatId(c.id); setCatName(c.name); setCatColor(c.color); setShowCatModal(true); };

    const saveCat = async () => {
        if (!catName.trim()) return;
        try {
            if (editCatId) {
                const res = await api<ProductCategory>(`/api/products/categories/${editCatId}`, { method: "PUT", body: { name: catName.trim(), color: catColor } });
                if (res.success && res.data) setCategories(prev => prev.map(c => c.id === editCatId ? { ...c, ...res.data! } : c));
            } else {
                const res = await api<ProductCategory>("/api/products/categories", { method: "POST", body: { name: catName.trim(), color: catColor } });
                if (res.success && res.data) setCategories(prev => [...prev, res.data!]);
            }
            setShowCatModal(false);
        } catch (e) { console.error(e); }
    };

    const deleteCat = async (id: string) => {
        try {
            await api(`/api/products/categories/${id}`, { method: "DELETE" });
            await loadData();
            setDeleteCatConfirm(null);
        } catch (e) { console.error(e); }
    };

    const toggleActive = async (id: string) => {
        try {
            const res = await api<Product>(`/api/products/${id}/toggle`, { method: "PATCH" });
            if (res.success && res.data) setProducts(prev => prev.map(p => p.id === id ? res.data! : p));
        } catch (e) { console.error(e); }
    };

    const deleteProduct = async (id: string) => {
        try {
            await api(`/api/products/${id}`, { method: "DELETE" });
            setProducts(prev => prev.filter(p => p.id !== id));
            setDeleteConfirm(null);
        } catch (e) { console.error(e); }
    };

    // Stats
    const totalRevenue = products.filter(p => p.active).reduce((s, p) => s + ((p.priceMin || 0) * p.usageCount), 0);
    const fmt = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `R$ ${v.toLocaleString("pt-BR")}`;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Produtos e Serviços</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Package size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Produtos e Serviços</h1>
                            <p className="text-sm text-slate-400">Catálogo completo de soluções para propostas comerciais</p>
                        </div>
                    </div>
                    <Link href="/dashboard/settings/products/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Novo Item
                    </Link>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total de Itens", value: products.length, icon: Package, color: "text-blue-400" },
                    { label: "Ativos", value: products.filter(p => p.active).length, icon: Eye, color: "text-blue-400" },
                    { label: "Categorias", value: categories.length, icon: Layers, color: "text-blue-400" },
                    { label: "Receita Estimada", value: fmt(totalRevenue), icon: DollarSign, color: "text-amber-400" },
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
                    <input type="text" placeholder="Buscar produto ou serviço..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40" />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer min-w-[130px]">
                    <option value="all">Todos os tipos</option>
                    {(Object.keys(typeConfig) as ProductType[]).map(t => <option key={t} value={t}>{typeConfig[t].emoji} {typeConfig[t].label}</option>)}
                </select>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer min-w-[180px]">
                    <option value="all">Todas as categorias</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={openCreateCat} className="flex items-center gap-1.5 px-3 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Gerenciar Categorias">
                    <Tag size={14} /> Categorias
                </button>
            </div>

            {/* Products Grid */}
            {filtered.length === 0 && (
                <div className="text-center py-16 text-slate-600">
                    <Package size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm mb-3">{products.length === 0 ? "Nenhum item cadastrado ainda" : "Nenhum item encontrado"}</p>
                    <Link href="/dashboard/settings/products/new" className="text-sm text-blue-400 hover:text-blue-300">+ Adicionar primeiro item</Link>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((product, i) => {
                    const tc = typeConfig[product.type] || typeConfig.servico;
                    const catColor = product.category?.color || "#64748b";
                    return (
                        <motion.div key={product.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className={`bg-slate-800/40 border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-colors group ${!product.active ? 'opacity-50' : ''}`}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${tc.color}`}>{tc.emoji} {tc.label}</span>
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0" style={getCatStyle(catColor)}>{product.category?.name || "—"}</span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0 ml-2">
                                    <button onClick={() => toggleActive(product.id)} className={`p-1 rounded transition-colors ${product.active ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:bg-white/5'}`}>{product.active ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                                    <Link href={`/dashboard/settings/products/${product.id}/edit`} className="p-1 rounded text-slate-600 hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"><Edit3 size={13} /></Link>
                                    <button onClick={() => setDeleteConfirm(product.id)} className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-white mb-1 truncate">{product.name}</h3>
                            <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">{product.description || ""}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-blue-400">
                                        R$ {(product.priceMin || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                                        {product.priceMax && product.priceMax > (product.priceMin || 0) ? ` — ${product.priceMax.toLocaleString("pt-BR")}` : ""}
                                    </span>
                                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${getRecurrenceBadgeColor(product.billingModel)}`}>{recurrenceLabels[product.billingModel] || product.billingModel}</span>
                                </div>
                                <span className="text-[10px] text-slate-600 flex items-center gap-1"><BarChart3 size={10} /> {product.usageCount} usos</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ═══ MODAL: Delete ═══ */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Excluir Item?</h3>
                                <p className="text-sm text-slate-400">Propostas existentes que usam este item não serão afetadas.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => deleteProduct(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Excluir</button>
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
                                        <div className="space-y-2 max-h-[240px] overflow-y-auto">
                                            {categories.map(c => (
                                                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-slate-800/30 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c.color }} />
                                                        <span className="text-sm text-white font-medium">{c.name}</span>
                                                        <span className="text-[9px] text-slate-600">{c._count?.products || 0} itens</span>
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
                                <p className="text-sm text-slate-400">Produtos desta categoria serão reatribuídos para outra.</p>
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
