"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Target,
    Plus,
    Trash2,
    Edit3,
    Rocket,
    X,
    Save,
    ToggleLeft,
    ToggleRight,
    Search,
    Calendar,
    Users
} from "lucide-react";

interface Campaign {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    participantsCount: number;
    active: boolean;
}

const MOCK_CAMPAIGNS: Campaign[] = [
    {
        id: "1",
        name: "Caçadores de Leads Q3",
        description: "Campanha focada em aumentar a captação de leads qualificados no terceiro trimestre.",
        startDate: "2026-07-01",
        endDate: "2026-09-30",
        participantsCount: 12,
        active: true
    },
    {
        id: "2",
        name: "Fechamento Ouro",
        description: "Bônus especial para quem fechar mais propostas de alto valor neste mês.",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        participantsCount: 8,
        active: true
    },
    {
        id: "3",
        name: "Recuperação de Inativos",
        description: "Reativar clientes antigos e gerar novas oportunidades.",
        startDate: "2026-01-15",
        endDate: "2026-02-15",
        participantsCount: 15,
        active: false
    }
];

export default function GrowthCampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
    const [searchQuery, setSearchQuery] = useState("");

    // Form
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formStart, setFormStart] = useState("");
    const [formEnd, setFormEnd] = useState("");

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const filtered = campaigns.filter(c => {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    });

    const openCreate = () => {
        setEditId(null);
        setFormName("");
        setFormDesc("");
        setFormStart("");
        setFormEnd("");
        setShowModal(true);
    };

    const openEdit = (c: Campaign) => {
        setEditId(c.id);
        setFormName(c.name);
        setFormDesc(c.description);
        setFormStart(c.startDate);
        setFormEnd(c.endDate);
        setShowModal(true);
    };

    const saveCampaign = () => {
        if (!formName.trim() || !formStart || !formEnd) return;

        if (editId) {
            setCampaigns(prev => prev.map(c => 
                c.id === editId 
                    ? { ...c, name: formName, description: formDesc, startDate: formStart, endDate: formEnd } 
                    : c
            ));
        } else {
            const newCampaign: Campaign = {
                id: Math.random().toString(36).substring(7),
                name: formName,
                description: formDesc,
                startDate: formStart,
                endDate: formEnd,
                participantsCount: 0,
                active: true
            };
            setCampaigns(prev => [...prev, newCampaign]);
        }
        setShowModal(false);
    };

    const toggleActive = (id: string) => {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    };

    const deleteCampaign = (id: string) => {
        setCampaigns(prev => prev.filter(c => c.id !== id));
        setDeleteConfirm(null);
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings/gamification/campaigns" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Target size={14} /><span>Campanhas</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Time Growth</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Rocket size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Campanhas de Growth</h1>
                            <p className="text-sm text-slate-400">Gerencie as campanhas do time de vendas e aquisição</p>
                        </div>
                    </div>
                    <Link href="/dashboard/settings/gamification/campaigns/growth/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Nova Campanha
                    </Link>
                </div>
            </motion.div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Buscar campanha..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 transition-colors" 
                    />
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-slate-600">
                        <Rocket size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma campanha encontrada</p>
                    </div>
                )}
                {filtered.map((campaign, i) => (
                    <motion.div 
                        key={campaign.id} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.05 }} 
                        className={`flex flex-col md:flex-row md:items-center gap-4 p-5 bg-slate-800/40 border border-white/[0.06] rounded-xl hover:border-white/[0.1] transition-colors group ${!campaign.active ? 'opacity-50' : ''}`}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-semibold text-white truncate">{campaign.name}</h3>
                                {campaign.active ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Em Andamento</span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">Inativa</span>
                                )}
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-1">{campaign.description}</p>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 text-sm text-slate-400">
                            <div className="flex items-center gap-1.5" title="Período da Campanha">
                                <Calendar size={14} className="text-slate-500" />
                                <span>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5" title="Participantes">
                                <Users size={14} className="text-slate-500" />
                                <span>{campaign.participantsCount}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 mt-4 md:mt-0">
                            <button 
                                onClick={() => toggleActive(campaign.id)} 
                                className={`p-2 rounded-lg transition-colors ${campaign.active ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-500 hover:bg-white/5'}`}
                                title={campaign.active ? "Desativar" : "Ativar"}
                            >
                                {campaign.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button 
                                onClick={() => openEdit(campaign)} 
                                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                                title="Editar"
                            >
                                <Edit3 size={16} />
                            </button>
                            <button 
                                onClick={() => setDeleteConfirm(campaign.id)} 
                                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Excluir"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* MODAL: Create/Edit */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <Rocket size={16} className="text-blue-400" />
                                    {editId ? "Editar Campanha" : "Nova Campanha de Growth"}
                                </h2>
                                <button title="Fechar Modal" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome da Campanha <span className="text-blue-400">*</span></label>
                                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Caçadores de Leads" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Descrição</label>
                                    <textarea rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Objetivo da campanha..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Data de Início <span className="text-blue-400">*</span></label>
                                        <input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" style={{ colorScheme: "dark" }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Data de Término <span className="text-blue-400">*</span></label>
                                        <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" style={{ colorScheme: "dark" }} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">Cancelar</button>
                                <button onClick={saveCampaign} disabled={!formName.trim() || !formStart || !formEnd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Save size={14} /> {editId ? "Salvar" : "Criar Campanha"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL: Delete */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Excluir Campanha?</h3>
                                <p className="text-sm text-slate-400">Esta ação não poderá ser desfeita. Todo o progresso associado será perdido.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5 transition-colors">Cancelar</button>
                                <button onClick={() => deleteConfirm && deleteCampaign(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition-colors">Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
