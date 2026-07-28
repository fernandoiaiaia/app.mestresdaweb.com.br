"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    CheckCircle2,
    XCircle,
    MessageSquare,
    Clock,
    Eye,
    Filter,
    Search,
    ChevronRight,
    AlertTriangle,
    Flame,
    ArrowUpRight,
    User,
    Calendar,
    DollarSign,
    FileText,
    Send,
    X,
    History,
    CheckSquare,
    ArrowLeft,
    Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

/* ═══════════════════════════════════════ */
/* TYPES                                   */
/* ═══════════════════════════════════════ */
type Urgency = "alta" | "media" | "baixa";

interface HistoryEntry {
    id: string;
    action: string;
    by: string;
    date: string;
    comment?: string;
}

interface QueueProposal {
    id: string;
    clientName: string;
    contactName?: string;
    totalValue?: number;
    totalHours?: number;
    createdAt: string;
    deadline?: string;
    urgency: Urgency;
    status: string;
    projectType: string[];
    scope?: any;
    reviewHistory: HistoryEntry[];
    user: { id: string; name: string; avatar?: string };
}

const urgencyConfig: Record<Urgency, { label: string; color: string; icon: any; bg: string }> = {
    alta: { label: "Alta", color: "text-red-400", icon: Flame, bg: "bg-red-500/10 border-red-500/20" },
    media: { label: "Média", color: "text-amber-400", icon: AlertTriangle, bg: "bg-amber-500/10 border-amber-500/20" },
    baixa: { label: "Baixa", color: "text-blue-400", icon: Clock, bg: "bg-blue-500/10 border-blue-500/20" },
};

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (d: string) => {
    try {
        return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return d; }
};

const getInitials = (name: string) => name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase();

const gradients = ["from-blue-600 to-cyan-400", "from-purple-600 to-violet-400", "from-teal-600 to-blue-400", "from-rose-600 to-pink-400", "from-amber-600 to-yellow-400"];
const getGradient = (name: string) => gradients[name.length % gradients.length];

const countScope = (scope: any) => {
    if (!scope) return { modules: 0, screens: 0, platforms: [] as string[] };
    const platforms = scope.platforms || scope;
    if (!Array.isArray(platforms)) return { modules: 0, screens: 0, platforms: [] };
    let modules = 0, screens = 0;
    const platNames: string[] = [];
    platforms.forEach((p: any) => {
        platNames.push(p.name || p.title || "Plataforma");
        const mods = p.modules || [];
        modules += mods.length;
        mods.forEach((m: any) => { screens += (m.screens || []).length; });
    });
    return { modules, screens, platforms: platNames };
};

/* ═══════════════════════════════════════ */
/* COMPONENT                               */
/* ═══════════════════════════════════════ */
export default function ManagerQueuePage() {
    const [proposals, setProposals] = useState<QueueProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [consultantFilter, setConsultantFilter] = useState("all");
    const [urgencyFilter, setUrgencyFilter] = useState<"all" | Urgency>("all");
    const [showFilters, setShowFilters] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [actionModal, setActionModal] = useState<{ type: "approve" | "adjust" | "reject"; proposalId: string } | null>(null);
    const [actionComment, setActionComment] = useState("");
    const [actionSaving, setActionSaving] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);

    // Load queue
    useEffect(() => { loadQueue(); }, []);

    const loadQueue = async () => {
        setLoading(true);
        try {
            const res = await api<any>(`/api/proposals/queue`);
            if (res.success && Array.isArray(res.data)) {
                setProposals(res.data.map((p: any) => ({
                    ...p,
                    urgency: p.urgency || "media",
                    reviewHistory: Array.isArray(p.reviewHistory) ? p.reviewHistory : [],
                })));
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const consultants = [...new Set(proposals.map((p) => p.user?.name).filter(Boolean))];

    const filtered = proposals
        .filter((p) => {
            const q = searchQuery.toLowerCase();
            return p.clientName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.contactName || "").toLowerCase().includes(q);
        })
        .filter((p) => consultantFilter === "all" || p.user?.name === consultantFilter)
        .filter((p) => urgencyFilter === "all" || p.urgency === urgencyFilter)
        .sort((a, b) => {
            const urgOrder: Record<Urgency, number> = { alta: 0, media: 1, baixa: 2 };
            return urgOrder[a.urgency] - urgOrder[b.urgency];
        });

    const handleAction = async () => {
        if (!actionModal) return;
        setActionSaving(true);
        try {
            const res = await api<any>(`/api/proposals/${actionModal.proposalId}/review`, {
                method: "POST",
                body: { action: actionModal.type, comment: actionComment },
            });
            if (res.success) {
                // Remove from local list (it's no longer IN_REVIEW)
                setProposals((prev) => prev.filter((p) => p.id !== actionModal.proposalId));
            }
        } catch (e) { console.error(e); }
        setActionSaving(false);
        setActionModal(null);
        setActionComment("");
    };

    const previewProposal = previewId ? proposals.find((p) => p.id === previewId) : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <CheckSquare size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Fila de Aprovação</h1>
                            <p className="text-sm text-slate-400">Revise e aprove propostas antes do envio ao cliente</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <Clock size={16} className="text-amber-400" />
                            <span className="text-amber-400 text-sm font-bold">{filtered.length}</span>
                            <span className="text-amber-400/70 text-sm">pendentes</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Pendentes", value: proposals.length, color: "text-amber-400", icon: Clock },
                    { label: "Urgentes", value: proposals.filter((p) => p.urgency === "alta").length, color: "text-red-400", icon: Flame },
                    { label: "Valor Total na Fila", value: fmt(proposals.reduce((s, p) => s + (p.totalValue || 0), 0)), color: "text-blue-400", icon: DollarSign },
                    { label: "Advisors Ativos", value: consultants.length, color: "text-blue-400", icon: User },
                ].map((stat) => (
                    <div key={stat.label} className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon size={14} className={stat.color} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</span>
                        </div>
                        <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                ))}
            </motion.div>

            {/* Search + Filters */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${showFilters ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-slate-800/50 border-white/[0.08] text-slate-400 hover:text-white"}`}
                    >
                        <Filter size={16} />
                        Filtros
                        {(consultantFilter !== "all" || urgencyFilter !== "all") && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </button>
                </div>
                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="flex flex-wrap gap-4 mt-3 p-4 bg-slate-800/30 border border-white/[0.04] rounded-xl">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Advisor</label>
                                    <select value={consultantFilter} onChange={(e) => setConsultantFilter(e.target.value)} className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40 min-w-[160px]">
                                        <option value="all">Todos</option>
                                        {consultants.map((c) => (<option key={c} value={c}>{c}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Urgência</label>
                                    <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value as any)} className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40 min-w-[140px]">
                                        <option value="all">Todas</option>
                                        <option value="alta">Alta</option>
                                        <option value="media">Média</option>
                                        <option value="baixa">Baixa</option>
                                    </select>
                                </div>
                                {(consultantFilter !== "all" || urgencyFilter !== "all") && (
                                    <button onClick={() => { setConsultantFilter("all"); setUrgencyFilter("all"); }} className="self-end px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors">
                                        Limpar filtros
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Proposals List */}
            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <CheckCircle2 size={48} className="mb-3 opacity-20" />
                        <p className="text-lg font-semibold text-slate-400">Nenhuma proposta pendente</p>
                        <p className="text-sm text-slate-600 mt-1">Todas as propostas foram revisadas 🎉</p>
                    </motion.div>
                ) : (
                    filtered.map((proposal, index) => {
                        const urg = urgencyConfig[proposal.urgency] || urgencyConfig.media;
                        const UrgIcon = urg.icon;
                        const isExpanded = expandedId === proposal.id;
                        const scopeInfo = countScope(proposal.scope);
                        const initials = getInitials(proposal.user?.name || "?");
                        const hasResubmissions = (proposal.reviewHistory || []).length > 0;
                        return (
                            <motion.div
                                key={proposal.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition-all"
                            >
                                {/* Main Row */}
                                <div className="p-5">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* Left: Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${urg.bg}`}>
                                                    <UrgIcon size={10} className={urg.color} />
                                                    <span className={urg.color}>{urg.label}</span>
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-600">{proposal.id.slice(0, 8)}</span>
                                                {hasResubmissions && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                        <History size={10} />
                                                        Resubmissão
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-[15px] font-bold text-white mb-1 truncate">{proposal.clientName}</h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                                <span className="flex items-center gap-1"><User size={12} />{proposal.user?.name || "—"}</span>
                                                <span className="flex items-center gap-1"><Calendar size={12} />{fmtDate(proposal.createdAt)}</span>
                                                {scopeInfo.modules > 0 && (
                                                    <span className="flex items-center gap-1"><FileText size={12} />{scopeInfo.modules} módulos · {scopeInfo.screens} telas</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Middle: Consultant + Value */}
                                        <div className="flex items-center gap-6 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getGradient(proposal.user?.name || "")} flex items-center justify-center text-white text-[10px] font-bold`}>
                                                    {initials}
                                                </div>
                                                <span className="text-xs text-slate-400">{proposal.user?.name || "—"}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-white">{proposal.totalValue ? fmt(proposal.totalValue) : "—"}</span>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => setPreviewId(proposal.id)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-white/5 border border-white/[0.06] transition-all"
                                            >
                                                <Eye size={14} />
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => setActionModal({ type: "adjust", proposalId: proposal.id })}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-all"
                                            >
                                                <MessageSquare size={14} />
                                                Ajustes
                                            </button>
                                            <button
                                                onClick={() => setActionModal({ type: "reject", proposalId: proposal.id })}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all"
                                            >
                                                <XCircle size={14} />
                                            </button>
                                            <button
                                                onClick={() => setActionModal({ type: "approve", proposalId: proposal.id })}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                                            >
                                                <CheckCircle2 size={14} />
                                                Aprovar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable: History */}
                                {(proposal.reviewHistory || []).length > 0 && (
                                    <>
                                        <div className="px-5 pb-1">
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                                                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-600 hover:text-slate-300 transition-colors pb-3"
                                            >
                                                <ChevronRight size={14} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                                Histórico de Revisão ({(proposal.reviewHistory || []).length})
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 pb-5 border-t border-white/[0.04] pt-4">
                                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                                                            <History size={12} /> Histórico
                                                        </h4>
                                                        <div className="space-y-0">
                                                            {(proposal.reviewHistory || []).map((h: HistoryEntry, hi: number) => (
                                                                <div key={h.id || hi} className="flex gap-3 relative">
                                                                    <div className="flex flex-col items-center shrink-0 w-3">
                                                                        <div className="w-2 h-2 rounded-full bg-slate-600 z-10 mt-1.5" />
                                                                        {hi < (proposal.reviewHistory || []).length - 1 && <div className="w-px flex-1 bg-slate-800" />}
                                                                    </div>
                                                                    <div className="pb-3 flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-semibold text-white">{h.action}</span>
                                                                            <span className="text-[10px] text-slate-600">por {h.by}</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-slate-600">{fmtDate(h.date)}</span>
                                                                        {h.comment && (
                                                                            <p className="text-[11px] text-slate-500 mt-1 italic border-l-2 border-slate-700 pl-2">&ldquo;{h.comment}&rdquo;</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* ═══ ACTION MODAL ═══ */}
            <AnimatePresence>
                {actionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setActionModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${actionModal.type === "approve" ? "bg-blue-500/10 border border-blue-500/20" :
                                        actionModal.type === "adjust" ? "bg-amber-500/10 border border-amber-500/20" :
                                            "bg-red-500/10 border border-red-500/20"
                                        }`}>
                                        {actionModal.type === "approve" ? <CheckCircle2 size={16} className="text-blue-500" /> :
                                            actionModal.type === "adjust" ? <MessageSquare size={16} className="text-amber-500" /> :
                                                <XCircle size={16} className="text-red-500" />}
                                    </div>
                                    <h2 className="text-lg font-bold text-white">
                                        {actionModal.type === "approve" ? "Aprovar Proposta" :
                                            actionModal.type === "adjust" ? "Solicitar Ajustes" :
                                                "Rejeitar Proposta"}
                                    </h2>
                                </div>
                                <button onClick={() => setActionModal(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-6 py-5">
                                <p className="text-sm text-slate-400 mb-4">
                                    {actionModal.type === "approve"
                                        ? "A proposta será liberada para envio ao cliente. Deseja adicionar algum comentário interno?"
                                        : actionModal.type === "adjust"
                                            ? "A proposta voltará para o advisor com seus comentários. Descreva os ajustes necessários."
                                            : "A proposta será rejeitada. Explique o motivo para o advisor."}
                                </p>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                                    Comentário {actionModal.type !== "approve" ? "*" : "(opcional)"}
                                </label>
                                <textarea
                                    value={actionComment}
                                    onChange={(e) => setActionComment(e.target.value)}
                                    rows={4}
                                    placeholder={
                                        actionModal.type === "approve" ? "Ótima proposta! Pode enviar ao cliente..." :
                                            actionModal.type === "adjust" ? "Descreva os ajustes necessários..." :
                                                "Motivo da rejeição..."
                                    }
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                                />
                                {actionModal.type !== "approve" && (
                                    <div className="flex items-start gap-2 mt-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                        <Send size={14} className="text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-blue-300/70 leading-relaxed">
                                            O advisor será notificado sobre esta ação.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                                <button onClick={() => setActionModal(null)} className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAction}
                                    disabled={(actionModal.type !== "approve" && !actionComment) || actionSaving}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${actionModal.type === "approve" ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20" :
                                        actionModal.type === "adjust" ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20" :
                                            "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20"
                                        }`}
                                >
                                    {actionSaving ? <Loader2 size={15} className="animate-spin" /> :
                                        actionModal.type === "approve" ? <><CheckCircle2 size={15} /> Aprovar e Liberar</> :
                                            actionModal.type === "adjust" ? <><MessageSquare size={15} /> Solicitar Ajustes</> :
                                                <><XCircle size={15} /> Rejeitar Proposta</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ PREVIEW PANEL ═══ */}
            <AnimatePresence>
                {previewProposal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-stretch justify-end"
                        onClick={() => setPreviewId(null)}
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border-l border-white/10 w-full max-w-xl overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setPreviewId(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div>
                                        <h2 className="text-base font-bold text-white">Preview da Proposta</h2>
                                        <span className="text-[10px] text-slate-500 font-mono">{previewProposal.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                                <Link href={`/dashboard/proposals`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 transition-all">
                                    <ArrowUpRight size={14} />
                                    Ver Propostas
                                </Link>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Title */}
                                <div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border mb-3 ${(urgencyConfig[previewProposal.urgency] || urgencyConfig.media).bg}`}>
                                        <Flame size={10} className={(urgencyConfig[previewProposal.urgency] || urgencyConfig.media).color} />
                                        <span className={(urgencyConfig[previewProposal.urgency] || urgencyConfig.media).color}>Urgência {(urgencyConfig[previewProposal.urgency] || urgencyConfig.media).label}</span>
                                    </span>
                                    <h3 className="text-xl font-bold text-white mb-1">{previewProposal.clientName}</h3>
                                    <p className="text-sm text-slate-400">{previewProposal.contactName || "Sem contato definido"}</p>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Advisor", value: previewProposal.user?.name || "—" },
                                        { label: "Valor", value: previewProposal.totalValue ? fmt(previewProposal.totalValue) : "—" },
                                        { label: "Deadline", value: previewProposal.deadline || "—" },
                                        { label: "Submetida em", value: fmtDate(previewProposal.createdAt) },
                                    ].map((info) => (
                                        <div key={info.label} className="bg-slate-800/50 border border-white/[0.04] rounded-xl p-3">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mb-1">{info.label}</span>
                                            <span className="text-sm font-semibold text-white">{info.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Platforms */}
                                {countScope(previewProposal.scope).platforms.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Plataformas</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {countScope(previewProposal.scope).platforms.map((p) => (
                                                <span key={p} className="px-3 py-1.5 bg-slate-800/50 border border-white/[0.06] rounded-lg text-xs text-slate-300 font-medium">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Scope */}
                                {countScope(previewProposal.scope).modules > 0 && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-800/50 border border-white/[0.04] rounded-xl p-4 text-center">
                                            <span className="text-2xl font-bold text-white">{countScope(previewProposal.scope).modules}</span>
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 block mt-1">Módulos</span>
                                        </div>
                                        <div className="bg-slate-800/50 border border-white/[0.04] rounded-xl p-4 text-center">
                                            <span className="text-2xl font-bold text-white">{countScope(previewProposal.scope).screens}</span>
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 block mt-1">Telas</span>
                                        </div>
                                    </div>
                                )}

                                {/* Review History */}
                                {(previewProposal.reviewHistory || []).length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5"><History size={12} /> Histórico de Revisão</h4>
                                        <div className="space-y-0">
                                            {(previewProposal.reviewHistory || []).map((h: HistoryEntry, hi: number) => (
                                                <div key={h.id || hi} className="flex gap-3">
                                                    <div className="flex flex-col items-center shrink-0 w-3">
                                                        <div className="w-2 h-2 rounded-full bg-slate-600 z-10 mt-1.5" />
                                                        {hi < (previewProposal.reviewHistory || []).length - 1 && <div className="w-px flex-1 bg-slate-800" />}
                                                    </div>
                                                    <div className="pb-3 flex-1">
                                                        <span className="text-xs font-semibold text-white">{h.action}</span>
                                                        <span className="text-[10px] text-slate-600 ml-2">{h.by} · {fmtDate(h.date)}</span>
                                                        {h.comment && <p className="text-[11px] text-slate-500 mt-1 italic border-l-2 border-slate-700 pl-2">&ldquo;{h.comment}&rdquo;</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                                    <button
                                        onClick={() => { setPreviewId(null); setActionModal({ type: "adjust", proposalId: previewProposal.id }); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-all"
                                    >
                                        <MessageSquare size={16} /> Solicitar Ajustes
                                    </button>
                                    <button
                                        onClick={() => { setPreviewId(null); setActionModal({ type: "approve", proposalId: previewProposal.id }); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
                                    >
                                        <CheckCircle2 size={16} /> Aprovar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
