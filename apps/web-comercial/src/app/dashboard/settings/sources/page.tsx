"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft, Settings, Plus, Trash2, Edit3, Megaphone, X, Save, Search,
    ToggleLeft, ToggleRight, Users, TrendingUp, BarChart3, Eye, EyeOff, Copy,
    ChevronDown, ChevronUp, Tag, Loader2,
} from "lucide-react";

interface SourceTypeObj { id: string; name: string; emoji: string; color: string; _count?: { sources: number }; }
interface Campaign { id: string; name: string; utm: string | null; leads: number; active: boolean; }
interface Source { id: string; name: string; description: string | null; typeId: string; active: boolean; leads: number; conversions: number; campaigns: Campaign[]; createdAt: string; type?: { id: string; name: string; emoji: string; color: string }; }

const colorPresets = [
    { name: "Verde", value: "#22c55e" }, { name: "Azul", value: "#3b82f6" }, { name: "Roxo", value: "#8b5cf6" },
    { name: "Ciano", value: "#06b6d4" }, { name: "Rosa", value: "#ec4899" }, { name: "Âmbar", value: "#f59e0b" },
    { name: "Laranja", value: "#f97316" }, { name: "Vermelho", value: "#ef4444" }, { name: "Indigo", value: "#6366f1" }, { name: "Teal", value: "#14b8a6" },
];
const emojiPresets = ["🌐", "📢", "👥", "🔗", "📱", "🎪", "📧", "📞", "🎯", "📊", "🔍", "💡"];
const getCatStyle = (color: string) => ({ color, backgroundColor: `${color}15`, borderColor: `${color}30` });

export default function SourcesPage() {
    const [sourceTypes, setSourceTypes] = useState<SourceTypeObj[]>([]);
    const [sources, setSources] = useState<Source[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Source modal
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formTypeId, setFormTypeId] = useState("");

    // Campaign modal
    const [campModal, setCampModal] = useState<string | null>(null);
    const [editCampId, setEditCampId] = useState<string | null>(null);
    const [campName, setCampName] = useState("");
    const [campUtm, setCampUtm] = useState("");

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: "source" | "campaign"; sourceId: string; campaignId?: string } | null>(null);

    // Type modal
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [editTypeId, setEditTypeId] = useState<string | null>(null);
    const [typeName, setTypeName] = useState("");
    const [typeEmoji, setTypeEmoji] = useState("🌐");
    const [typeColor, setTypeColor] = useState("#22c55e");
    const [deleteTypeConfirm, setDeleteTypeConfirm] = useState<string | null>(null);

    // ═══ Load ═══
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [typesRes, sourcesRes] = await Promise.all([
                api<SourceTypeObj[]>("/api/sources/types", { method: "GET" }),
                api<Source[]>("/api/sources", { method: "GET" }),
            ]);
            if (typesRes?.success && typesRes.data) setSourceTypes(typesRes.data);
            if (sourcesRes?.success && sourcesRes.data) setSources(sourcesRes.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const getType = (id: string) => sourceTypes.find(t => t.id === id) || sources.find(s => s.typeId === id)?.type;
    const getTypeColor = (id: string) => getType(id)?.color || "#64748b";

    const filtered = sources
        .filter(s => { const q = search.toLowerCase(); return s.name.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q); })
        .filter(s => filterType === "all" || s.typeId === filterType)
        .sort((a, b) => b.leads - a.leads);

    const totalLeads = sources.reduce((s, src) => s + src.leads, 0);
    const totalConversions = sources.reduce((s, src) => s + src.conversions, 0);
    const avgConversion = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : "0";

    // ═══ Type CRUD ═══
    const openCreateType = () => { setEditTypeId(null); setTypeName(""); setTypeEmoji("🌐"); setTypeColor("#22c55e"); setShowTypeModal(true); };
    const openEditType = (t: SourceTypeObj) => { setEditTypeId(t.id); setTypeName(t.name); setTypeEmoji(t.emoji); setTypeColor(t.color); setShowTypeModal(true); };

    const saveType = async () => {
        if (!typeName.trim()) return;
        try {
            if (editTypeId) {
                const res = await api<SourceTypeObj>(`/api/sources/types/${editTypeId}`, { method: "PUT", body: { name: typeName.trim(), emoji: typeEmoji, color: typeColor } });
                if (res.success && res.data) setSourceTypes(prev => prev.map(t => t.id === editTypeId ? { ...t, ...res.data! } : t));
            } else {
                const res = await api<SourceTypeObj>("/api/sources/types", { method: "POST", body: { name: typeName.trim(), emoji: typeEmoji, color: typeColor } });
                if (res.success && res.data) setSourceTypes(prev => [...prev, res.data!]);
            }
            setShowTypeModal(false);
        } catch (e) { console.error(e); }
    };

    const deleteType = async (id: string) => {
        try { await api(`/api/sources/types/${id}`, { method: "DELETE" }); await loadData(); setDeleteTypeConfirm(null); } catch (e) { console.error(e); }
    };

    // ═══ Source CRUD ═══
    const openCreateSource = () => { setEditId(null); setFormName(""); setFormDesc(""); setFormTypeId(sourceTypes[0]?.id || ""); setShowModal(true); };
    const openEditSource = (s: Source) => { setEditId(s.id); setFormName(s.name); setFormDesc(s.description || ""); setFormTypeId(s.typeId); setShowModal(true); };

    const saveSource = async () => {
        if (!formName.trim() || !formTypeId) return;
        try {
            if (editId) {
                const res = await api<Source>(`/api/sources/${editId}`, { method: "PUT", body: { name: formName.trim(), description: formDesc.trim() || null, typeId: formTypeId } });
                if (res.success && res.data) setSources(prev => prev.map(s => s.id === editId ? res.data! : s));
            } else {
                const res = await api<Source>("/api/sources", { method: "POST", body: { name: formName.trim(), description: formDesc.trim() || null, typeId: formTypeId } });
                if (res.success && res.data) { setSources(prev => [...prev, res.data!]); setExpandedId(res.data!.id); }
            }
            setShowModal(false);
        } catch (e) { console.error(e); }
    };

    const toggleSource = async (id: string) => {
        try {
            const res = await api<Source>(`/api/sources/${id}/toggle`, { method: "PATCH" });
            if (res.success && res.data) setSources(prev => prev.map(s => s.id === id ? res.data! : s));
        } catch (e) { console.error(e); }
    };

    const deleteSource = async (id: string) => {
        try { await api(`/api/sources/${id}`, { method: "DELETE" }); setSources(prev => prev.filter(s => s.id !== id)); setDeleteConfirm(null); if (expandedId === id) setExpandedId(null); } catch (e) { console.error(e); }
    };

    // ═══ Campaign CRUD ═══
    const openAddCampaign = (sourceId: string) => { setCampModal(sourceId); setEditCampId(null); setCampName(""); setCampUtm(""); };
    const openEditCampaign = (sourceId: string, c: Campaign) => { setCampModal(sourceId); setEditCampId(c.id); setCampName(c.name); setCampUtm(c.utm || ""); };

    const saveCampaign = async () => {
        if (!campModal || !campName.trim()) return;
        try {
            if (editCampId) {
                const res = await api<Campaign>(`/api/sources/${campModal}/campaigns/${editCampId}`, { method: "PUT", body: { name: campName.trim(), utm: campUtm.trim() || null } });
                if (res.success && res.data) setSources(prev => prev.map(s => s.id === campModal ? { ...s, campaigns: s.campaigns.map(c => c.id === editCampId ? res.data! : c) } : s));
            } else {
                const res = await api<Campaign>(`/api/sources/${campModal}/campaigns`, { method: "POST", body: { name: campName.trim(), utm: campUtm.trim() || null } });
                if (res.success && res.data) setSources(prev => prev.map(s => s.id === campModal ? { ...s, campaigns: [...s.campaigns, res.data!] } : s));
            }
            setCampModal(null);
        } catch (e) { console.error(e); }
    };

    const toggleCampaign = async (sourceId: string, campId: string) => {
        try {
            const res = await api<Campaign>(`/api/sources/${sourceId}/campaigns/${campId}/toggle`, { method: "PATCH" });
            if (res.success && res.data) setSources(prev => prev.map(s => s.id === sourceId ? { ...s, campaigns: s.campaigns.map(c => c.id === campId ? res.data! : c) } : s));
        } catch (e) { console.error(e); }
    };

    const deleteCampaign = async (sourceId: string, campId: string) => {
        try { await api(`/api/sources/${sourceId}/campaigns/${campId}`, { method: "DELETE" }); setSources(prev => prev.map(s => s.id === sourceId ? { ...s, campaigns: s.campaigns.filter(c => c.id !== campId) } : s)); setDeleteConfirm(null); } catch (e) { console.error(e); }
    };

    const copyUtm = (utm: string) => { navigator.clipboard.writeText(utm); };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-slate-500" /></div>;
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
                    <span className="text-slate-300 text-sm font-medium">Fontes e Campanhas</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Megaphone size={20} className="text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Fontes e Campanhas</h1>
                            <p className="text-sm text-slate-400">Gerencie origens de leads, UTMs e campanhas de marketing</p>
                        </div>
                    </div>
                    <button onClick={openCreateSource} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Nova Fonte
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Fontes Ativas", value: sources.filter(s => s.active).length, icon: Megaphone, color: "text-orange-400" },
                    { label: "Total de Leads", value: totalLeads, icon: Users, color: "text-blue-400" },
                    { label: "Conversões", value: totalConversions, icon: TrendingUp, color: "text-blue-400" },
                    { label: "Taxa Média", value: avgConversion + "%", icon: BarChart3, color: "text-amber-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-xl font-bold text-white block">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar fonte..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/40" />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer min-w-[160px]">
                    <option value="all">Todos os tipos</option>
                    {sourceTypes.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
                </select>
                <button onClick={openCreateType} className="flex items-center gap-1.5 px-3 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Gerenciar Tipos">
                    <Tag size={14} /> Tipos
                </button>
            </div>

            {/* Sources List */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-16 text-slate-600">
                        <Megaphone size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm mb-3">{sources.length === 0 ? "Nenhuma fonte cadastrada ainda" : "Nenhuma fonte encontrada"}</p>
                        <button onClick={openCreateSource} className="text-sm text-blue-400 hover:text-blue-300">+ Criar primeira fonte</button>
                    </div>
                )}

                {filtered.map((source, i) => {
                    const sType = getType(source.typeId);
                    const isExpanded = expandedId === source.id;
                    const convRate = source.leads > 0 ? ((source.conversions / source.leads) * 100).toFixed(1) : "0";
                    const maxLeads = Math.max(...sources.map(s => s.leads), 1);
                    const barW = Math.max((source.leads / maxLeads) * 100, 3);

                    return (
                        <motion.div key={source.id} layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden ${!source.active ? 'opacity-50' : ''}`}>
                            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors" onClick={() => setExpandedId(isExpanded ? null : source.id)}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-2 rounded-lg border text-sm" style={getCatStyle(sType?.color || '#64748b')}>{sType?.emoji || '📋'}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-sm font-bold text-white truncate">{source.name}</h3>
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0" style={getCatStyle(sType?.color || '#64748b')}>{sType?.name || '—'}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">{source.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 shrink-0 ml-4">
                                    <div className="hidden md:block w-24">
                                        <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500/40 rounded-full transition-all flex items-center justify-end pr-1.5" style={{ width: `${barW}%`, minWidth: '16px' }}>
                                                <span className="text-[8px] font-bold text-white/80">{source.leads}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex items-center gap-5">
                                        <div className="text-center"><span className="text-sm font-bold text-white block">{source.leads}</span><span className="text-[9px] text-slate-600 uppercase tracking-widest">Leads</span></div>
                                        <div className="text-center"><span className={`text-sm font-bold block ${parseFloat(convRate) > 30 ? 'text-blue-400' : parseFloat(convRate) > 15 ? 'text-amber-400' : 'text-slate-400'}`}>{convRate}%</span><span className="text-[9px] text-slate-600 uppercase tracking-widest">Conv.</span></div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); toggleSource(source.id); }} className={`p-1.5 rounded-lg transition-colors ${source.active ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:bg-white/5'}`}>{source.active ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                                        <button onClick={(e) => { e.stopPropagation(); openEditSource(source); }} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors"><Edit3 size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: "source", sourceId: source.id }); }} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-500 ml-0.5" /> : <ChevronDown size={16} className="text-slate-500 ml-0.5" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded: Campaigns */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                        <div className="px-4 pb-4 border-t border-white/[0.04]">
                                            <div className="flex items-center justify-between mt-3 mb-2">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Campanhas ({source.campaigns.length})</h4>
                                                <button onClick={() => openAddCampaign(source.id)} className="flex items-center gap-1 text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"><Plus size={12} /> Campanha</button>
                                            </div>
                                            {source.campaigns.length === 0 ? (
                                                <div className="text-center py-6 text-slate-600">
                                                    <p className="text-xs mb-2">Nenhuma campanha nesta fonte</p>
                                                    <button onClick={() => openAddCampaign(source.id)} className="text-xs text-orange-400 hover:text-orange-300">+ Criar campanha</button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {source.campaigns.map(camp => (
                                                        <div key={camp.id} className={`flex items-center gap-3 p-3 bg-slate-800/50 border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition-colors group ${!camp.active ? 'opacity-40' : ''}`}>
                                                            <Megaphone size={12} className="text-slate-600 shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-xs font-medium text-white block truncate">{camp.name}</span>
                                                                {camp.utm && (
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <span className="text-[9px] text-slate-600 font-mono truncate max-w-[300px]">{camp.utm}</span>
                                                                        <button onClick={() => copyUtm(camp.utm!)} className="text-slate-600 hover:text-white shrink-0 opacity-0 group-hover:opacity-100 transition-all"><Copy size={10} /></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 shrink-0">{camp.leads} leads</span>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button onClick={() => toggleCampaign(source.id, camp.id)} className={`p-1 rounded transition-colors ${camp.active ? 'text-blue-400' : 'text-slate-600'}`}>{camp.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
                                                                <button onClick={() => openEditCampaign(source.id, camp)} className="p-1 rounded text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={11} /></button>
                                                                <button onClick={() => setDeleteConfirm({ type: "campaign", sourceId: source.id, campaignId: camp.id })} className="p-1 rounded text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={11} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-white/[0.04]">
                                                <span className="text-[10px] text-slate-600">Criado em {new Date(source.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                                <span className="text-[10px] text-slate-600">·</span>
                                                <span className="text-[10px] text-slate-600">{source.conversions} conversões de {source.leads} leads</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* ═══ MODAL: Source Create/Edit ═══ */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><Megaphone size={16} className="text-orange-400" /> {editId ? "Editar Fonte" : "Nova Fonte"}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome <span className="text-red-400">*</span></label>
                                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Google Ads" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Descrição</label>
                                    <textarea rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Detalhes desta fonte de leads..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Tipo</label>
                                    {sourceTypes.length === 0 ? (
                                        <p className="text-sm text-slate-500">Crie um tipo primeiro usando o botão "Tipos".</p>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {sourceTypes.map(t => (
                                                <button key={t.id} type="button" onClick={() => setFormTypeId(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium border transition-all ${formTypeId === t.id ? '' : 'border-white/[0.06] text-slate-500 hover:text-white'}`} style={formTypeId === t.id ? getCatStyle(t.color) : undefined}>
                                                    <span>{t.emoji}</span> {t.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={saveSource} disabled={!formName.trim() || !formTypeId} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${editId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-orange-600 hover:bg-orange-500'} text-white`}>
                                    <Save size={14} /> {editId ? "Salvar" : "Criar Fonte"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Campaign Create/Edit ═══ */}
            <AnimatePresence>
                {campModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setCampModal(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white">{editCampId ? "Editar Campanha" : "Nova Campanha"}</h2>
                                <button onClick={() => setCampModal(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome da Campanha <span className="text-red-400">*</span></label>
                                    <input type="text" value={campName} onChange={(e) => setCampName(e.target.value)} placeholder="Ex: Busca — Sites Profissionais" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Parâmetros UTM</label>
                                    <input type="text" value={campUtm} onChange={(e) => setCampUtm(e.target.value)} placeholder="utm_source=google&utm_medium=cpc&utm_campaign=..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-[11px] font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/40" />
                                    <p className="text-[9px] text-slate-600 mt-1">Cole aqui os parâmetros UTM completos para rastreamento</p>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setCampModal(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={saveCampaign} disabled={!campName.trim()} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${editCampId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
                                    <Save size={14} /> {editCampId ? "Salvar" : "Criar"}
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
                                <h3 className="text-base font-bold text-white mb-1">Excluir {deleteConfirm.type === "source" ? "Fonte" : "Campanha"}?</h3>
                                <p className="text-sm text-slate-400">{deleteConfirm.type === "source" ? "Todas as campanhas desta fonte serão removidas." : "Os dados históricos de leads serão mantidos."}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => { if (deleteConfirm.type === "source") deleteSource(deleteConfirm.sourceId); else if (deleteConfirm.campaignId) deleteCampaign(deleteConfirm.sourceId, deleteConfirm.campaignId); }} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Type CRUD ═══ */}
            <AnimatePresence>
                {showTypeModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowTypeModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><Tag size={16} className="text-blue-400" /> Gerenciar Tipos</h2>
                                <button onClick={() => setShowTypeModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                {sourceTypes.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Tipos Existentes</label>
                                        <div className="space-y-2">
                                            {sourceTypes.map(t => (
                                                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-slate-800/30 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: t.color }} />
                                                        <span className="text-sm">{t.emoji}</span>
                                                        <span className="text-sm text-white font-medium">{t.name}</span>
                                                        <span className="text-[9px] text-slate-600">{t._count?.sources || 0} fontes</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button onClick={() => openEditType(t)} className="p-1 rounded text-slate-600 hover:text-white"><Edit3 size={12} /></button>
                                                        <button onClick={() => setDeleteTypeConfirm(t.id)} className="p-1 rounded text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <hr className="border-white/[0.04]" />
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">{editTypeId ? "Editar Tipo" : "Novo Tipo"}</label>
                                    <input type="text" value={typeName} onChange={e => setTypeName(e.target.value)} placeholder="Nome do tipo" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 mb-3" />
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Emoji</label>
                                    <div className="flex gap-1.5 flex-wrap mb-3">
                                        {emojiPresets.map(em => (
                                            <button key={em} type="button" onClick={() => setTypeEmoji(em)} className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border transition-all ${typeEmoji === em ? 'border-white/30 bg-white/10 scale-110' : 'border-white/[0.04] hover:bg-white/5'}`}>{em}</button>
                                        ))}
                                    </div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Cor</label>
                                    <div className="flex gap-2 flex-wrap mb-3">
                                        {colorPresets.map(cp => (
                                            <button key={cp.value} type="button" onClick={() => setTypeColor(cp.value)} className={`w-7 h-7 rounded-lg transition-all ${typeColor === cp.value ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white/30 scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'}`} style={{ backgroundColor: cp.value }} title={cp.name} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <input type="color" value={typeColor} onChange={e => setTypeColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent" />
                                        <input type="text" value={typeColor} onChange={e => setTypeColor(e.target.value)} className="w-24 px-3 py-1.5 bg-slate-800/50 border border-white/[0.08] rounded-lg text-xs text-white font-mono focus:outline-none" />
                                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={getCatStyle(typeColor)}>{typeEmoji} Preview</span>
                                    </div>
                                    <button onClick={saveType} disabled={!typeName.trim()} className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${editTypeId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
                                        <Save size={14} /> {editTypeId ? "Salvar Tipo" : "Criar Tipo"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Delete Type ═══ */}
            <AnimatePresence>
                {deleteTypeConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setDeleteTypeConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Excluir Tipo?</h3>
                                <p className="text-sm text-slate-400">Fontes deste tipo serão reatribuídas para outro tipo.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTypeConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => deleteTypeConfirm && deleteType(deleteTypeConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
