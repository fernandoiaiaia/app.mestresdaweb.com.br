"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Send,
    Trash2,
    Copy,
    Download,
    Loader2,
    User,
    Calendar,
    AlertTriangle,
    Edit3,
    Check,
    X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Proposal, ProposalStatus } from "@/types/proposals";

// ─── Helpers ──────────────────────────────────

function formatCurrency(v: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(dateStr?: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

// ─── Status config ────────────────────────────

const STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    DRAFT: { label: "Rascunho", color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: FileText },
    SENT: { label: "Enviada", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Send },
    APPROVED: { label: "Aprovada", color: "text-green-400 bg-green-400/10 border-green-400/20", icon: CheckCircle2 },
    REJECTED: { label: "Rejeitada", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
    EXPIRED: { label: "Expirada", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: AlertTriangle },
};

type StatusBadgeProps = { status: ProposalStatus; size?: "sm" | "md" };
function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
    const rawStatus = (status || "DRAFT").toUpperCase();
    const cfg = STATUS_CONFIG[rawStatus as ProposalStatus] || STATUS_CONFIG.DRAFT;
    const Ic = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}>
            <Ic size={size === "sm" ? 11 : 13} />
            {cfg.label}
        </span>
    );
}

// ─── Section card ─────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5 ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{children}</p>;
}

// ─── Markdown Renderer ────────────────────────

function RenderMarkdownScope({ content }: { content: string }) {
    if (!content) return <p className="text-sm text-slate-500 italic">Nenhum escopo detalhado disponível.</p>;

    const lines = content.split('\n');

    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />;

                // Headers
                const h1Match = trimmed.match(/^#\s+(.*)/);
                if (h1Match) return <h1 key={i} className="text-lg font-bold mt-5 mb-2 text-white">{h1Match[1]}</h1>;

                const h2Match = trimmed.match(/^##\s+(.*)/);
                if (h2Match) return <h2 key={i} className="text-base font-bold mt-4 mb-2 text-white border-b border-white/10 pb-1">{h2Match[1]}</h2>;

                const h3Match = trimmed.match(/^###\s+(.*)/);
                if (h3Match) return <h3 key={i} className="text-[15px] font-bold mt-3 mb-1 text-slate-200">{h3Match[1]}</h3>;

                const h4Match = trimmed.match(/^####\s+(.*)/);
                if (h4Match) return <h4 key={i} className="text-sm font-semibold mt-2 mb-1 text-slate-300">{h4Match[1]}</h4>;

                // Lists
                const listMatch = trimmed.match(/^[-*+]\s+(.*)/);
                if (listMatch) {
                    let text = listMatch[1];
                    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-medium">$1</strong>');
                    return (
                        <div key={i} className="flex gap-2 my-1 text-sm text-slate-400 pl-3">
                            <span className="text-blue-500 mt-1 shrink-0">•</span>
                            <span dangerouslySetInnerHTML={{ __html: text }} />
                        </div>
                    );
                }

                // Paragraphs
                let text = trimmed;
                text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-medium">$1</strong>');
                return <p key={i} className="text-sm text-slate-400 my-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: text }} />;
            })}
        </div>
    );
}

// ─── Status action buttons ────────────────────

const STATUS_TRANSITIONS: Partial<Record<ProposalStatus, { to: ProposalStatus; label: string; variant: string }[]>> = {
    DRAFT: [{ to: "SENT", label: "Marcar como Enviada", variant: "blue" }],
    SENT: [
        { to: "APPROVED", label: "Aprovar", variant: "green" },
        { to: "REJECTED", label: "Rejeitar", variant: "red" },
    ],
};

const VARIANT_CLASSES: Record<string, string> = {
    blue: "bg-blue-600/10 border-blue-600/20 text-blue-400 hover:bg-blue-600/20",
    green: "bg-green-600/10 border-green-600/20 text-green-400 hover:bg-green-600/20",
    red: "bg-red-600/10 border-red-600/20 text-red-400 hover:bg-red-600/20",
    amber: "bg-amber-600/10 border-amber-600/20 text-amber-400 hover:bg-amber-600/20",
};

// ─── Main Detail Page ─────────────────────────

export default function ProposalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const fetchProposal = useCallback(async () => {
        setLoading(true);
        const res = await api<Proposal>(`/api/proposals/${id}`);
        setLoading(false);
        if (res?.success && res.data) {
            setProposal(res.data);
        } else {
            setError(res?.message || "Proposta não encontrada.");
        }
    }, [id]);

    useEffect(() => { fetchProposal(); }, [fetchProposal]);

    const handleStatusChange = async (toStatus: ProposalStatus) => {
        setUpdatingStatus(true);
        const res = await api<Proposal>(`/api/proposals/${id}/status`, {
            method: "PATCH",
            body: { status: toStatus },
        });
        setUpdatingStatus(false);
        if (res?.success && res.data) setProposal(res.data);
    };

    const handleDelete = async () => {
        setDeleting(true);
        const res = await api(`/api/proposals/${id}`, { method: "DELETE" });
        setDeleting(false);
        if (res?.success) {
            router.push("/dashboard/crm/proposals");
        }
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ─────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 size={28} className="animate-spin text-slate-600" />
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-slate-500">
                <AlertTriangle size={32} className="text-amber-500" />
                <p className="text-base font-medium text-white">{error || "Proposta não encontrada"}</p>
                <Link href="/dashboard/crm/proposals" className="text-sm text-blue-400 hover:underline">
                    Voltar às Propostas
                </Link>
            </div>
        );
    }

    const subtotal = proposal.estimate?.totalCost || 0;
    const discountAmt = (subtotal * (proposal.discount ?? 0)) / 100;
    const rawStatus = (proposal.status || "DRAFT").toUpperCase();
    const transitions = STATUS_TRANSITIONS[rawStatus as ProposalStatus] ?? [];

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-start justify-between gap-4"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href="/dashboard/crm/proposals"
                        className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/60 transition-all shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-xl md:text-2xl font-bold text-white truncate">{proposal.title}</h1>
                            <StatusBadge status={proposal.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Criada em {formatDate(proposal.createdAt)}
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-white/[0.08] hover:text-white hover:border-white/[0.14] transition-all"
                    >
                        {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                        {copied ? "Copiado!" : "Copiar link"}
                    </button>
                    <Link
                        href={`/dashboard/crm/proposals/${id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-white/[0.08] hover:text-white hover:border-white/[0.14] transition-all"
                    >
                        <Edit3 size={13} />
                        Editar
                    </Link>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400/80 border border-red-500/20 hover:bg-red-500/10 transition-all"
                    >
                        <Trash2 size={13} />
                        Deletar
                    </button>
                </div>
            </motion.div>

            {/* Confirm delete dialog */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={18} className="text-red-400 shrink-0" />
                            <p className="text-sm text-slate-300">
                                Tem certeza que deseja <strong className="text-white">deletar</strong> esta proposta? Essa ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={13} />
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-500 disabled:opacity-50 transition-colors"
                            >
                                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                Confirmar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status transitions */}
            {transitions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="flex flex-wrap items-center gap-2"
                >
                    <p className="text-xs text-slate-500 mr-1">Atualizar status:</p>
                    {transitions.map((t) => (
                        <button
                            key={t.to}
                            onClick={() => handleStatusChange(t.to)}
                            disabled={updatingStatus}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[t.variant]}`}
                        >
                            {updatingStatus ? <Loader2 size={11} className="animate-spin" /> : null}
                            {t.label}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* Body grid */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="grid md:grid-cols-3 gap-4"
            >
                {/* Left column — main info */}
                <div className="md:col-span-2 space-y-4">

                    {/* Scope Detailed View (Parsed Markdown) */}
                    <Card>
                        <SectionTitle>Visão Estrutural do Escopo</SectionTitle>
                        <RenderMarkdownScope content={proposal.scopeRaw} />
                    </Card>

                    {/* Estimativas (Financial) */}
                    <Card>
                        <SectionTitle>Equipe Projetada</SectionTitle>
                        <div className="space-y-0">
                            {/* Col headers */}
                            <div className="hidden md:grid grid-cols-[1fr_80px_120px_120px] gap-3 pb-2 border-b border-white/[0.04] mb-1">
                                {["Papel / Profissional", "Esforço", "Valor da Hora", "Investimento"].map((h) => (
                                    <p key={h} className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">{h}</p>
                                ))}
                            </div>
                            
                            {(proposal.estimate?.lines && proposal.estimate.lines.length > 0) ? (
                                proposal.estimate.lines.map((item, i) => (
                                    <div key={i} className="grid md:grid-cols-[1fr_80px_120px_120px] grid-cols-1 gap-3 py-4 border-b border-white/[0.04] items-center last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2">
                                        <div>
                                            <p className="text-sm text-slate-200 font-semibold">{item.role}</p>
                                        </div>
                                        <div className="md:flex md:justify-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">
                                                <Clock size={11} />
                                                {item.hours}h
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 font-medium md:text-right">
                                            {formatCurrency(item.rate)}<span className="text-slate-600 font-normal">/h</span>
                                        </p>
                                        <p className="text-sm font-bold text-white text-right">
                                            {formatCurrency((item.hours || 0) * (item.rate || 0))}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="grid md:grid-cols-[1fr_80px_120px_120px] grid-cols-1 gap-3 py-4 border-b border-white/[0.04] items-center">
                                    <div>
                                        <p className="text-sm text-slate-200 font-medium">Desenvolvimento de Software</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Execução completa do escopo mapeado</p>
                                    </div>
                                    <p className="text-sm font-semibold text-blue-400 md:text-center">
                                        {proposal.estimate?.totalHours ? `${proposal.estimate.totalHours}h` : "—"}
                                    </p>
                                    <p className="text-sm text-emerald-400">
                                        {(proposal.estimate?.totalCost && proposal.estimate?.totalHours) 
                                            ? formatCurrency(proposal.estimate.totalCost / proposal.estimate.totalHours)
                                            : "—"}
                                    </p>
                                    <p className="text-sm font-bold text-white text-right">
                                        {formatCurrency(subtotal)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Totals */}
                        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>Subtotal</span>
                                <span className="text-white">{formatCurrency(subtotal)}</span>
                            </div>
                            {(proposal.discount ?? 0) > 0 && (
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>Desconto ({proposal.discount}%)</span>
                                    <span className="text-red-400">− {formatCurrency(discountAmt)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-bold pt-2 border-t border-white/[0.06]">
                                <span className="text-white">Total</span>
                                <span className="text-blue-400 text-lg">{formatCurrency(proposal.estimate?.totalCost || 0)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Terms */}
                    {proposal.terms && (
                        <Card>
                            <SectionTitle>Termos e Condições</SectionTitle>
                            <p className="text-sm text-slate-400 leading-relaxed">{proposal.terms}</p>
                        </Card>
                    )}
                </div>

                {/* Right column — meta info */}
                <div className="space-y-4">

                    {/* Client */}
                    <Card>
                        <SectionTitle>Cliente</SectionTitle>
                        {proposal.client ? (
                            <Link
                                href={`/dashboard/crm/clients/${proposal.client.id}`}
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {proposal.client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                                        {proposal.client.name}
                                    </p>
                                    {proposal.client.company && (
                                        <p className="text-xs text-slate-500 truncate">{proposal.client.company}</p>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <p className="text-sm text-slate-500 italic">Nenhum cliente vinculado</p>
                        )}
                    </Card>

                    {/* Dates */}
                    <Card>
                        <SectionTitle>Datas</SectionTitle>
                        <div className="space-y-3">
                            <InfoRow icon={FileText} label="Criação" value={formatDate(proposal.createdAt)} />
                            <InfoRow icon={Send} label="Atualizado em" value={formatDate(proposal.updatedAt)} />
                            <InfoRow icon={Calendar} label="Validade" value={formatDate(proposal.expiresAt)} />
                            {proposal.status === "APPROVED" && (
                                <InfoRow icon={CheckCircle2} label="Aprovada em" value={formatDate(proposal.updatedAt)} />
                            )}
                        </div>
                    </Card>

                    {/* Totals summary */}
                    <Card className="bg-blue-600/5 border-blue-600/10">
                        <SectionTitle>Volume Total</SectionTitle>
                        <p className="text-2xl font-black text-blue-400">{formatCurrency(proposal.estimate?.totalCost || 0)}</p>
                        {(proposal.discount ?? 0) > 0 && (
                            <p className="text-xs text-slate-500 mt-1">{proposal.discount}% de desconto aplicado</p>
                        )}
                    </Card>
                </div>
            </motion.div>
        </div>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <Icon size={13} />
                {label}
            </div>
            <span className="text-xs font-semibold text-slate-300">{value}</span>
        </div>
    );
}
