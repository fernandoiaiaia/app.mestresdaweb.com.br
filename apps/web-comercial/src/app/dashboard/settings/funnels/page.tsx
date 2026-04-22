"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import Link from "next/link";
import {
    ChevronLeft,
    Settings,
    Plus,
    Trash2,
    Edit3,
    Copy,
    Filter,
    X,
    Save,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    GripVertical,
    Play,
    Pause,
    Users,
    Target,
    TrendingUp,
    DollarSign,
    Zap,
    Eye,
} from "lucide-react";

const uid = () => "id-" + Math.random().toString(36).slice(2, 9);

const stageColors = [
    { name: "Azul", value: "blue", bg: "bg-blue-500", ring: "ring-blue-500/30", text: "text-blue-400", light: "bg-blue-500/10 border-blue-500/20" },
    { name: "Verde", value: "green", bg: "bg-blue-500", ring: "ring-blue-500/30", text: "text-blue-400", light: "bg-blue-500/10 border-blue-500/20" },
    { name: "Amarelo", value: "amber", bg: "bg-amber-500", ring: "ring-amber-500/30", text: "text-amber-400", light: "bg-amber-500/10 border-amber-500/20" },
    { name: "Roxo", value: "purple", bg: "bg-purple-500", ring: "ring-purple-500/30", text: "text-purple-400", light: "bg-purple-500/10 border-purple-500/20" },
    { name: "Ciano", value: "cyan", bg: "bg-cyan-500", ring: "ring-cyan-500/30", text: "text-cyan-400", light: "bg-cyan-500/10 border-cyan-500/20" },
    { name: "Rosa", value: "pink", bg: "bg-pink-500", ring: "ring-pink-500/30", text: "text-pink-400", light: "bg-pink-500/10 border-pink-500/20" },
    { name: "Laranja", value: "orange", bg: "bg-orange-500", ring: "ring-orange-500/30", text: "text-orange-400", light: "bg-orange-500/10 border-orange-500/20" },
    { name: "Vermelho", value: "red", bg: "bg-red-500", ring: "ring-red-500/30", text: "text-red-400", light: "bg-red-500/10 border-red-500/20" },
];

const getColor = (val: string) => stageColors.find(c => c.value === val) || stageColors[0];

interface Stage {
    id: string;
    name: string;
    color: string;
    deals: number;
    value: number;
}

interface Funnel {
    id: string;
    name: string;
    description: string;
    isDefault: boolean;
    active: boolean;
    stages: Stage[];
    assigneeIds: string[];
    createdAt: string;
}

interface AppUser {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

const initialFunnels: Funnel[] = [
    {
        id: uid(), name: "Funil Comercial Principal", description: "Funil padrão para propostas de projetos de tecnologia.",
        isDefault: true, active: true, createdAt: "10 Jan 2026",
        stages: [
            { id: uid(), name: "Novo Lead", color: "blue", deals: 24, value: 0 },
            { id: uid(), name: "Contato Realizado", color: "cyan", deals: 18, value: 0 },
            { id: uid(), name: "Reunião Agendada", color: "purple", deals: 12, value: 480000 },
            { id: uid(), name: "Proposta Enviada", color: "amber", deals: 8, value: 920000 },
            { id: uid(), name: "Negociação", color: "orange", deals: 5, value: 650000 },
            { id: uid(), name: "Fechado — Ganho", color: "green", deals: 3, value: 385000 },
            { id: uid(), name: "Fechado — Perdido", color: "red", deals: 4, value: 0 },
        ],
    },
    {
        id: uid(), name: "Funil Inbound (Marketing)", description: "Leads vindos de campanhas de marketing digital.",
        isDefault: false, active: true, createdAt: "15 Fev 2026",
        stages: [
            { id: uid(), name: "Lead Capturado", color: "blue", deals: 56, value: 0 },
            { id: uid(), name: "MQL (Qualificado Mkt)", color: "cyan", deals: 28, value: 0 },
            { id: uid(), name: "SQL (Qualificado Vendas)", color: "purple", deals: 14, value: 350000 },
            { id: uid(), name: "Demo Realizada", color: "amber", deals: 8, value: 280000 },
            { id: uid(), name: "Ganho", color: "green", deals: 4, value: 160000 },
        ],
    },
    {
        id: uid(), name: "Funil Parcerias", description: "Oportunidades via parceiros e indicações.",
        isDefault: false, active: false, createdAt: "01 Mar 2026",
        stages: [
            { id: uid(), name: "Indicação Recebida", color: "blue", deals: 10, value: 0 },
            { id: uid(), name: "Primeiro Contato", color: "purple", deals: 6, value: 180000 },
            { id: uid(), name: "Proposta", color: "amber", deals: 3, value: 120000 },
            { id: uid(), name: "Fechado", color: "green", deals: 2, value: 95000 },
        ],
    },
];

export default function FunnelsPage() {
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<AppUser[]>([]);

    const loadFunnels = async () => {
        try {
            setIsLoading(true);
            const { data } = await api<Funnel[]>('/api/funnels', { method: "GET" });
            setFunnels(data || []);
            if (data && data.length > 0 && !expandedId) {
                setExpandedId(data[0].id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const { data } = await api<AppUser[]>('/api/users');
            setUsers((data || []).filter((u: AppUser) => u.role !== "CLIENT"));
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        loadFunnels();
        loadUsers();
    }, []);

    // New funnel modal
    const [showNewModal, setShowNewModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newAssignees, setNewAssignees] = useState<string[]>([]);

    // Add stage modal
    const [addStageFor, setAddStageFor] = useState<string | null>(null);
    const [newStageName, setNewStageName] = useState("");
    const [newStageColor, setNewStageColor] = useState("blue");

    // Edit stage modal
    const [editingStage, setEditingStage] = useState<{ funnelId: string; stage: Stage } | null>(null);
    const [editStageName, setEditStageName] = useState("");
    const [editStageColor, setEditStageColor] = useState("blue");

    // Edit funnel modal
    const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
    const [editFunnelName, setEditFunnelName] = useState("");
    const [editFunnelDesc, setEditFunnelDesc] = useState("");
    const [editAssignees, setEditAssignees] = useState<string[]>([]);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // --- Funnel Actions ---
    const createFunnel = async () => {
        if (!newName.trim()) return;
        try {
            const response = await api<Funnel>('/api/funnels', {
                method: "POST",
                body: { name: newName.trim(), description: newDesc.trim(), assigneeIds: newAssignees }
            });
            await loadFunnels();
            if (response.data) setExpandedId(response.data.id);
            setShowNewModal(false);
            setNewName(""); setNewDesc(""); setNewAssignees([]);
        } catch (e) { console.error(e); }
    };

    const duplicateFunnel = async (id: string) => {
        const src = funnels.find(f => f.id === id);
        if (!src) return;
        try {
            await api('/api/funnels', {
                method: "POST",
                body: { name: src.name + " (cópia)", description: src.description }
            });
            await loadFunnels();
        } catch (e) { console.error(e); }
    };

    const deleteFunnel = async (id: string) => {
        try {
            await api(`/api/funnels/${id}`, { method: "DELETE" });
            setFunnels(prev => prev.filter(f => f.id !== id));
            setDeleteConfirm(null);
            if (expandedId === id) setExpandedId(null);
        } catch (e) { console.error(e); }
    };

    const toggleActive = async (id: string) => {
        const f = funnels.find(x => x.id === id);
        if (!f) return;
        try {
            await api(`/api/funnels/${id}`, { method: "PUT", body: { active: !f.active } });
            setFunnels(prev => prev.map(x => x.id === id ? { ...x, active: !x.active } : x));
        } catch (e) { console.error(e); }
    };

    const setDefault = async (id: string) => {
        try {
            await api(`/api/funnels/${id}`, { method: "PUT", body: { isDefault: true } });
            setFunnels(prev => prev.map(f => ({ ...f, isDefault: f.id === id })));
        } catch (e) { console.error(e); }
    };

    const openEditFunnel = (f: Funnel) => {
        setEditingFunnel(f);
        setEditFunnelName(f.name);
        setEditFunnelDesc(f.description);
        setEditAssignees(f.assigneeIds || []);
    };

    const saveEditFunnel = async () => {
        if (!editingFunnel || !editFunnelName.trim()) return;
        try {
            await api(`/api/funnels/${editingFunnel.id}`, {
                method: "PUT",
                body: { name: editFunnelName.trim(), description: editFunnelDesc.trim(), assigneeIds: editAssignees }
            });
            setFunnels(prev => prev.map(f => f.id === editingFunnel.id ? { ...f, name: editFunnelName.trim(), description: editFunnelDesc.trim(), assigneeIds: editAssignees } : f));
            setEditingFunnel(null);
        } catch (e) { console.error(e); }
    };

    const moveFunnel = async (funnelId: string, dir: -1 | 1) => {
        const idx = funnels.findIndex(f => f.id === funnelId);
        if (idx < 0 || idx + dir < 0 || idx + dir >= funnels.length) return;

        const arr = [...funnels];
        [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];

        // Optimistic UI update
        setFunnels(arr);

        try {
            const funnelIds = arr.map(f => f.id);
            await api(`/api/funnels/reorder`, {
                method: "PUT",
                body: { funnelIds }
            });
        } catch (e) {
            console.error(e);
            loadFunnels(); // Rollback if error
        }
    };

    // --- Stage Actions ---
    const addStage = async () => {
        if (!addStageFor || !newStageName.trim()) return;
        try {
            await api(`/api/funnels/${addStageFor}/stages`, {
                method: "POST",
                body: { name: newStageName.trim(), color: newStageColor }
            });
            await loadFunnels();
            setAddStageFor(null);
            setNewStageName(""); setNewStageColor("blue");
        } catch (e) { console.error(e); }
    };

    const deleteStage = async (funnelId: string, stageId: string) => {
        try {
            await api(`/api/funnels/${funnelId}/stages/${stageId}`, { method: "DELETE" });
            setFunnels(prev => prev.map(f => f.id === funnelId ? { ...f, stages: f.stages.filter(s => s.id !== stageId) } : f));
        } catch (e) { console.error(e); }
    };

    const openEditStage = (funnelId: string, stage: Stage) => {
        setEditingStage({ funnelId, stage });
        setEditStageName(stage.name);
        setEditStageColor(stage.color);
    };

    const saveEditStage = async () => {
        if (!editingStage || !editStageName.trim()) return;
        const { funnelId, stage } = editingStage;
        try {
            await api(`/api/funnels/${funnelId}/stages/${stage.id}`, {
                method: "PUT",
                body: { name: editStageName.trim(), color: editStageColor }
            });
            setFunnels(prev => prev.map(f => f.id === funnelId ? {
                ...f, stages: f.stages.map(s => s.id === stage.id ? { ...s, name: editStageName.trim(), color: editStageColor } : s)
            } : f));
            setEditingStage(null);
        } catch (e) { console.error(e); }
    };

    const moveStage = async (funnelId: string, stageId: string, dir: -1 | 1) => {
        const funnel = funnels.find(f => f.id === funnelId);
        if (!funnel) return;
        const idx = funnel.stages.findIndex(s => s.id === stageId);
        if (idx < 0 || idx + dir < 0 || idx + dir >= funnel.stages.length) return;

        const arr = [...funnel.stages];
        [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];

        // Optimistic UI update
        setFunnels(prev => prev.map(f => f.id === funnelId ? { ...f, stages: arr } : f));

        try {
            const stageIds = arr.map(s => s.id);
            await api(`/api/funnels/${funnelId}/stages/reorder`, {
                method: "PUT",
                body: { stageIds }
            });
        } catch (e) {
            console.error(e);
            loadFunnels(); // Rollback if error
        }
    };

    // Stats
    const totalDeals = funnels.reduce((s, f) => s + f.stages.reduce((ss, st) => ss + st.deals, 0), 0);
    const totalValue = funnels.reduce((s, f) => s + f.stages.reduce((ss, st) => ss + st.value, 0), 0);

    const ColorPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
        <div className="flex gap-2 flex-wrap">
            {stageColors.map(c => (
                <button key={c.value} type="button" onClick={() => onChange(c.value)} className={`w-7 h-7 rounded-lg ${c.bg} transition-all ${value === c.value ? 'ring-2 ring-offset-2 ring-offset-slate-900 ' + c.ring : 'opacity-50 hover:opacity-80'}`} title={c.name} />
            ))}
        </div>
    );

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Funis de Venda</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Filter size={20} className="text-cyan-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Funis de Venda</h1>
                            <p className="text-sm text-slate-400">Crie e gerencie etapas dos funis de vendas e conversão</p>
                        </div>
                    </div>
                    <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Novo Funil
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Funis Ativos", value: funnels.filter(f => f.active).length, icon: Zap, color: "text-blue-400" },
                    { label: "Total de Funis", value: funnels.length, icon: Filter, color: "text-cyan-400" },
                    { label: "Deals em Aberto", value: totalDeals, icon: Users, color: "text-purple-400" },
                    { label: "Valor Total", value: `R$ ${(totalValue / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-amber-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-xl font-bold text-white block">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Funnels List */}
            <div className="space-y-4">
                {funnels.length === 0 && (
                    <div className="text-center py-16 text-slate-600">
                        <Filter size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm mb-3">Nenhum funil criado ainda</p>
                        <button onClick={() => setShowNewModal(true)} className="text-sm text-blue-400 hover:text-blue-300">+ Criar primeiro funil</button>
                    </div>
                )}

                {funnels.map((funnel, i) => {
                    const isExpanded = expandedId === funnel.id;
                    const totalFunnelDeals = funnel.stages.reduce((s, st) => s + st.deals, 0);
                    const maxDeals = Math.max(...funnel.stages.map(s => s.deals), 1);

                    return (
                        <motion.div key={funnel.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                            {/* Header */}
                            <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors" onClick={() => setExpandedId(isExpanded ? null : funnel.id)}>
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`p-2 rounded-lg border ${funnel.active ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                                        <Filter size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-sm font-bold text-white truncate">{funnel.name}</h3>
                                            {funnel.isDefault && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shrink-0">Padrão</span>}
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 ${funnel.active ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                                                {funnel.active ? "Ativo" : "Inativo"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">{funnel.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 shrink-0 ml-4">
                                    <div className="flex flex-col gap-0.5 shrink-0 mr-2">
                                        <button onClick={(e) => { e.stopPropagation(); moveFunnel(funnel.id, -1); }} disabled={i === 0} className="text-slate-700 hover:text-white disabled:opacity-20 transition-colors"><ChevronUp size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); moveFunnel(funnel.id, 1); }} disabled={i === funnels.length - 1} className="text-slate-700 hover:text-white disabled:opacity-20 transition-colors"><ChevronDown size={12} /></button>
                                    </div>
                                    <div className="hidden md:flex items-center gap-6">
                                        <div className="text-center"><span className="text-sm font-bold text-white block">{funnel.stages.length}</span><span className="text-[9px] text-slate-600 uppercase tracking-widest">Etapas</span></div>
                                        <div className="text-center"><span className="text-sm font-bold text-white block">{totalFunnelDeals}</span><span className="text-[9px] text-slate-600 uppercase tracking-widest">Deals</span></div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); toggleActive(funnel.id); }} className={`p-1.5 rounded-lg transition-colors ${funnel.active ? 'text-amber-400 hover:bg-amber-500/10' : 'text-blue-400 hover:bg-blue-500/10'}`} title={funnel.active ? 'Desativar' : 'Ativar'}>
                                            {funnel.active ? <Pause size={14} /> : <Play size={14} />}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); openEditFunnel(funnel); }} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors" title="Editar"><Edit3 size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); duplicateFunnel(funnel.id); }} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors" title="Duplicar"><Copy size={14} /></button>
                                        {!funnel.isDefault && <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(funnel.id); }} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Excluir"><Trash2 size={14} /></button>}
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-500 ml-1" /> : <ChevronDown size={16} className="text-slate-500 ml-1" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                        <div className="px-5 pb-5">
                                            <div className="border-t border-white/[0.04] pt-4">

                                                {/* Visual Funnel Bar */}
                                                <div className="mb-5">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Visualização do Funil</h4>
                                                    <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                                                        {funnel.stages.map(stage => {
                                                            const c = getColor(stage.color);
                                                            const pct = Math.max((stage.deals / Math.max(totalFunnelDeals, 1)) * 100, 4);
                                                            return (
                                                                <div key={stage.id} className={`${c.bg} relative group cursor-pointer transition-all hover:opacity-90`} style={{ width: `${pct}%` }} title={`${stage.name}: ${stage.deals} deals`}>
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <span className="text-[8px] font-bold text-white/80 truncate px-1">{stage.deals}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Stages Table */}
                                                <div className="space-y-2">
                                                    {funnel.stages.map((stage, si) => {
                                                        const c = getColor(stage.color);
                                                        const barW = Math.max((stage.deals / maxDeals) * 100, 2);
                                                        return (
                                                            <div key={stage.id} className="flex items-center gap-3 p-3 bg-slate-800/50 border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition-colors group">
                                                                {/* Reorder */}
                                                                <div className="flex flex-col gap-0.5 shrink-0">
                                                                    <button onClick={() => moveStage(funnel.id, stage.id, -1)} disabled={si === 0} className="text-slate-700 hover:text-white disabled:opacity-20 transition-colors"><ChevronUp size={12} /></button>
                                                                    <button onClick={() => moveStage(funnel.id, stage.id, 1)} disabled={si === funnel.stages.length - 1} className="text-slate-700 hover:text-white disabled:opacity-20 transition-colors"><ChevronDown size={12} /></button>
                                                                </div>

                                                                {/* Color dot + name */}
                                                                <div className={`w-3 h-3 rounded-full ${c.bg} shrink-0`} />
                                                                <span className="text-sm font-medium text-white w-48 truncate shrink-0">{stage.name}</span>

                                                                {/* Bar */}
                                                                <div className="flex-1 h-5 bg-slate-900/50 rounded-full overflow-hidden">
                                                                    <div className={`h-full ${c.bg} rounded-full transition-all duration-300 flex items-center justify-end pr-2`} style={{ width: `${barW}%`, minWidth: '20px' }}>
                                                                        <span className="text-[8px] font-bold text-white/90">{stage.deals}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Value */}
                                                                <span className="text-xs text-slate-500 w-24 text-right shrink-0">
                                                                    {stage.value > 0 ? `R$ ${(stage.value / 1000).toFixed(0)}k` : "—"}
                                                                </span>

                                                                {/* Actions */}
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                                    <button onClick={() => openEditStage(funnel.id, stage)} className="p-1 rounded text-slate-600 hover:text-white"><Edit3 size={12} /></button>
                                                                    {funnel.stages.length > 2 && <button onClick={() => deleteStage(funnel.id, stage.id)} className="p-1 rounded text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Add Stage */}
                                                <button onClick={() => { setAddStageFor(funnel.id); setNewStageName(""); setNewStageColor("blue"); }} className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-400 py-2 px-3 rounded-xl hover:bg-blue-500/5 border border-dashed border-white/[0.06] hover:border-blue-500/20 transition-all w-full justify-center">
                                                    <Plus size={14} /> Adicionar Etapa
                                                </button>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] text-slate-600">Criado em {funnel.createdAt}</span>
                                                        <span className="text-[10px] text-slate-600">·</span>
                                                        <span className="text-[10px] text-slate-600">{funnel.stages.length} etapas</span>
                                                    </div>
                                                    {!funnel.isDefault && (
                                                        <button onClick={() => setDefault(funnel.id)} className="text-[10px] text-cyan-500 hover:text-cyan-400 font-medium transition-colors">
                                                            Definir como padrão
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* ═══ MODAL: New Funnel ═══ */}
            <AnimatePresence>
                {showNewModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Filter size={18} className="text-cyan-400" /> Novo Funil</h2>
                                <button onClick={() => setShowNewModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome do Funil <span className="text-red-400">*</span></label>
                                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Funil Enterprise" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Descrição</label>
                                    <textarea rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Para que tipo de venda este funil será usado..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Distribuir Leads para (Round-Robin)</label>
                                    <p className="text-[10px] text-slate-600 mb-2">Os leads serão distribuídos igualitariamente entre os vendedores selecionados, independentemente do canal de entrada (WhatsApp, formulário, webhook).</p>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {users.map(u => (
                                            <button key={u.id} type="button" onClick={() => setNewAssignees(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${newAssignees.includes(u.id) ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300' : 'bg-slate-800/30 border border-white/[0.04] text-slate-400 hover:border-white/[0.08]'}`}>
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-bold transition-all ${newAssignees.includes(u.id) ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-600'}`}>{newAssignees.includes(u.id) ? '✓' : ''}</div>
                                                <span className="truncate">{u.name}</span>
                                                <span className="text-[10px] text-slate-600 ml-auto">{u.role}</span>
                                            </button>
                                        ))}
                                        {users.length === 0 && <p className="text-xs text-slate-600 py-2">Nenhum usuário encontrado</p>}
                                    </div>
                                    {newAssignees.length > 0 && <p className="text-[10px] text-blue-400 mt-1.5">{newAssignees.length} vendedor(es) selecionado(s)</p>}
                                </div>
                                <p className="text-[10px] text-slate-600">O funil será criado com 3 etapas iniciais: <span className="text-slate-400">Novo Lead → Ganho → Perdido</span></p>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={createFunnel} disabled={!newName.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-40">
                                    <Save size={14} /> Criar Funil
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Edit Funnel ═══ */}
            <AnimatePresence>
                {editingFunnel && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setEditingFunnel(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white">Editar Funil</h2>
                                <button onClick={() => setEditingFunnel(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome</label>
                                    <input type="text" value={editFunnelName} onChange={(e) => setEditFunnelName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Descrição</label>
                                    <textarea rows={2} value={editFunnelDesc} onChange={(e) => setEditFunnelDesc(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Distribuir Leads para (Round-Robin)</label>
                                    <p className="text-[10px] text-slate-600 mb-2">Os leads serão distribuídos igualitariamente entre os vendedores selecionados.</p>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {users.map(u => (
                                            <button key={u.id} type="button" onClick={() => setEditAssignees(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${editAssignees.includes(u.id) ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300' : 'bg-slate-800/30 border border-white/[0.04] text-slate-400 hover:border-white/[0.08]'}`}>
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-bold transition-all ${editAssignees.includes(u.id) ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-600'}`}>{editAssignees.includes(u.id) ? '✓' : ''}</div>
                                                <span className="truncate">{u.name}</span>
                                                <span className="text-[10px] text-slate-600 ml-auto">{u.role}</span>
                                            </button>
                                        ))}
                                        {users.length === 0 && <p className="text-xs text-slate-600 py-2">Nenhum usuário encontrado</p>}
                                    </div>
                                    {editAssignees.length > 0 && <p className="text-[10px] text-blue-400 mt-1.5">{editAssignees.length} vendedor(es) selecionado(s)</p>}
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setEditingFunnel(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={saveEditFunnel} disabled={!editFunnelName.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-40">
                                    <Save size={14} /> Salvar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Add Stage ═══ */}
            <AnimatePresence>
                {addStageFor && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setAddStageFor(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white">Adicionar Etapa</h2>
                                <button onClick={() => setAddStageFor(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome da Etapa <span className="text-red-400">*</span></label>
                                    <input type="text" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="Ex: Qualificação" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Cor</label>
                                    <ColorPicker value={newStageColor} onChange={setNewStageColor} />
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setAddStageFor(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={addStage} disabled={!newStageName.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-40">
                                    <Plus size={14} /> Adicionar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Edit Stage ═══ */}
            <AnimatePresence>
                {editingStage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setEditingStage(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white">Editar Etapa</h2>
                                <button onClick={() => setEditingStage(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome da Etapa</label>
                                    <input type="text" value={editStageName} onChange={(e) => setEditStageName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Cor</label>
                                    <ColorPicker value={editStageColor} onChange={setEditStageColor} />
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setEditingStage(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={saveEditStage} disabled={!editStageName.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-40">
                                    <Save size={14} /> Salvar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Delete Confirmation ═══ */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Excluir Funil?</h3>
                                <p className="text-sm text-slate-400">Todos os deals associados serão desvinculados deste funil.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5 transition-colors">Cancelar</button>
                                <button onClick={() => deleteFunnel(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition-colors">Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
