"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FileText,
    Plus,
    Search,
    Filter,
    Trash2,
    Eye,
    Copy,
    ChevronRight,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    SendHorizontal,
    ArrowUpRight,
    Edit3,
} from "lucide-react";
import { api } from "@/lib/api";
import {
    Proposal,
    ProposalStatus,
    PROPOSAL_STATUS_LABELS,
    PROPOSAL_STATUS_COLORS,
} from "@/types/proposals";
import { saveDraft } from "./new/_shared";

// ─── Helpers ─────────────────────────────────

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function formatDate(dateString?: string) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function isExpiringSoon(dateString?: string) {
    if (!dateString) return false;
    const diff = new Date(dateString).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

// ─── Status Tab ──────────────────────────────

const STATUS_TABS: { value: "ALL" | ProposalStatus; label: string; icon: React.ElementType }[] = [
    { value: "ALL", label: "Todas", icon: FileText },
    { value: "DRAFT", label: "Rascunhos", icon: Clock },
    { value: "SENT", label: "Enviadas", icon: SendHorizontal },
    { value: "APPROVED", label: "Aprovadas", icon: CheckCircle2 },
    { value: "REJECTED", label: "Rejeitadas", icon: XCircle },
    { value: "EXPIRED", label: "Expiradas", icon: AlertCircle },
];

// ─── Card component ───────────────────────────

function ProposalCard({
    proposal,
    onDelete,
    onDuplicate,
    onEdit,
    onSendToDev,
}: {
    proposal: Proposal;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onEdit: (proposal: Proposal) => void;
    onSendToDev: (id: string) => void;
}) {
    const expiringSoon = isExpiringSoon(proposal.expiresAt);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="group relative bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5 hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col gap-4"
        >
            {/* Top accent on hover */}
            <div className="absolute top-0 left-0 w-full h-[2px] rounded-t-2xl bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{proposal.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {proposal.client?.name || "Sem cliente"}
                        {proposal.client?.company && (
                            <span className="text-slate-600"> · {proposal.client.company}</span>
                        )}
                    </p>
                </div>
                <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${PROPOSAL_STATUS_COLORS[proposal.status]}`}
                >
                    {PROPOSAL_STATUS_LABELS[proposal.status]}
                </span>
            </div>

            {/* Value */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Valor total</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(proposal.estimate?.totalCost || 0)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Validade</p>
                    <p
                        className={`text-sm font-semibold ${
                            expiringSoon ? "text-amber-400" : "text-slate-300"
                        }`}
                    >
                        {expiringSoon && <span className="mr-1">⚠</span>}
                        {formatDate(proposal.expiresAt)}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <p className="text-[10px] text-slate-600">
                    Criada em {formatDate(proposal.createdAt)}
                </p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onDuplicate(proposal.id)}
                        title="Duplicar"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    >
                        <Copy size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(proposal.id)}
                        title="Excluir"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                    <button
                        onClick={() => onEdit(proposal)}
                        title="Editar pelo Assistente"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        onClick={() => onSendToDev(proposal.id)}
                        title="Enviar para Dev"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                        <SendHorizontal size={14} />
                    </button>
                    <Link
                        href={`/p/${proposal.id}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/60 transition-colors"
                        title="Ver apresentação"
                    >
                        <ArrowUpRight size={14} />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Empty State ─────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
        >
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <FileText size={28} className="text-blue-500/70" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
                {filtered ? "Nenhuma proposta encontrada" : "Nenhuma proposta ainda"}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                {filtered
                    ? "Tente ajustar os filtros ou o termo de busca."
                    : "Crie sua primeira proposta comercial e comece a fechar negócios."}
            </p>
            {!filtered && (
                <Link
                    href="/dashboard/crm/proposals/new"
                    className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                >
                    <Plus size={16} />
                    Nova Proposta
                </Link>
            )}
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────

export default function ProposalsPage() {
    const router = useRouter();

    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"ALL" | ProposalStatus>("ALL");
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    // Summary stats
    const stats = useMemo(() => {
        const total = proposals.length;
        const totalValue = proposals
            .filter((p) => p.status === "APPROVED")
            .reduce((acc, p) => acc + (p.estimate?.totalCost || 0), 0);
        const pending = proposals.filter((p) => p.status === "SENT").length;
        const approved = proposals.filter((p) => p.status === "APPROVED").length;
        return { total, totalValue, pending, approved };
    }, [proposals]);

    // Filtered list
    const filtered = useMemo(() => {
        return proposals.filter((p) => {
            const matchTab = activeTab === "ALL" || p.status === activeTab;
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                p.title.toLowerCase().includes(q) ||
                p.client?.name?.toLowerCase().includes(q) ||
                p.client?.company?.toLowerCase().includes(q);
            return matchTab && matchSearch;
        });
    }, [proposals, activeTab, search]);

    // Fetch
    useEffect(() => {
        setLoading(true);
        api<Proposal[]>("/api/proposals")
            .then((res) => {
                if (res?.success && res.data) setProposals(res.data);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta proposta?")) return;
        const res = await api(`/api/proposals/${id}`, { method: "DELETE" });
        if (res?.success) {
            setProposals((prev) => prev.filter((p) => p.id !== id));
        }
    };

    const handleDuplicate = async (id: string) => {
        const res = await api<Proposal>(`/api/proposals/${id}/duplicate`, { method: "POST" });
        if (res?.success && res.data) {
            setProposals((prev) => [res.data!, ...prev]);
            handleEdit(res.data);
        }
    };

    const handleEdit = (proposal: Proposal) => {
        saveDraft({
            id: proposal.id,
            title: proposal.title,
            clientId: proposal.clientId || "",
            expiresAt: proposal.expiresAt || new Date().toISOString(),
            scopeRaw: proposal.scopeRaw || "",
            editedScope: proposal.scopeRaw || "",
            finalScope: proposal.scopeRaw || "",
            estimate: proposal.estimate as any,
        });
        router.push("/dashboard/crm/proposals/new?edit=true");
    };

    const handleSendToDev = async () => {
        if (!sendingId) return;
        setIsSending(true);
        try {
            const res = await api(`/api/proposals/${sendingId}/send-to-dev`, { method: "POST" });
            if (res?.success && (res.data as any)?.id) {
                window.location.href = `http://localhost:1200/dashboard/backlog/${(res.data as any).id}`;
            } else {
                alert(res?.error?.message || "Erro ao enviar para Dev");
                setIsSending(false);
                setSendingId(null);
            }
        } catch (err: any) {
            alert(err?.message || "Erro ao enviar para Dev");
            setIsSending(false);
            setSendingId(null);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">

            {/* ── Header ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between mb-8 gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <FileText size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Propostas</h1>
                        <p className="text-sm text-slate-400">Gerencie suas propostas comerciais</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/crm/proposals/new"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus size={16} />
                    Nova Proposta
                </Link>
            </motion.div>

            {/* ── Stats ──────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
                {[
                    { label: "Total de Propostas", value: stats.total, icon: FileText, color: "text-blue-400" },
                    { label: "Valor Aprovado", value: formatCurrency(stats.totalValue), icon: TrendingUp, color: "text-green-400" },
                    { label: "Aguardando Resposta", value: stats.pending, icon: Clock, color: "text-amber-400" },
                    { label: "Aprovadas", value: stats.approved, icon: CheckCircle2, color: "text-green-400" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-4 flex items-center gap-3"
                    >
                        <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
                            <stat.icon size={16} className={stat.color} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{stat.label}</p>
                            <p className="text-base font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* ── Controls ───────────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col md:flex-row gap-4 mb-6"
            >
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por título ou cliente…"
                        className="w-full bg-slate-800/40 border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 focus:bg-slate-800/60 transition-all"
                    />
                </div>

                {/* Status filter pill row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                                activeTab === tab.value
                                    ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                                    : "text-slate-400 border-white/[0.06] hover:text-white hover:border-white/[0.12]"
                            }`}
                        >
                            <tab.icon size={13} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* ── Content ────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 size={28} className="animate-spin text-blue-500/60" />
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState filtered={proposals.length > 0 && filtered.length === 0} />
            ) : (
                <AnimatePresence mode="popLayout">
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                    >
                        {filtered.map((proposal) => (
                            <ProposalCard
                                key={proposal.id}
                                proposal={proposal}
                                onDelete={handleDelete}
                                onDuplicate={handleDuplicate}
                                onEdit={handleEdit}
                                onSendToDev={(id) => setSendingId(id)}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Modal de Confirmação */}
            <AnimatePresence>
                {sendingId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6"
                        >
                            <div className="flex items-center gap-3 text-emerald-500 mb-4">
                                <AlertCircle size={24} />
                                <h2 className="text-lg font-bold text-white">Confirmação</h2>
                            </div>
                            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                                Cliente já assinou o contrato e Já pagou?
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleSendToDev}
                                    disabled={isSending}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50"
                                >
                                    {isSending ? <Loader2 size={18} className="animate-spin" /> : "Sim"}
                                </button>
                                <button
                                    onClick={() => setSendingId(null)}
                                    disabled={isSending}
                                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors disabled:opacity-50"
                                >
                                    Não
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
