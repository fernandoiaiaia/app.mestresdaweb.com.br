"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScrollText, Loader2, Calendar, DollarSign, ArrowRight, Clock } from "lucide-react";
import { fetchMyProposals, type ClientProposal } from "@/lib/proposals-api";

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    SENT: { label: "Enviada", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    APPROVED: { label: "Aprovada", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    REJECTED: { label: "Rejeitada", color: "bg-red-500/10 text-red-400 border-red-500/20" },
    SENT_TO_DEVS: { label: "Em Desenvolvimento", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    IN_REVIEW: { label: "Em Revisão", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

export default function ProposalsPage() {
    const [loading, setLoading] = useState(true);
    const [proposals, setProposals] = useState<ClientProposal[]>([]);

    useEffect(() => {
        fetchMyProposals()
            .then(res => { if (res.success && res.data) setProposals(res.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">Propostas</h1>
                <p className="text-slate-400 mt-1">Visualize as propostas comerciais dos seus projetos.</p>
            </motion.div>

            {proposals.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center py-20 bg-slate-800/20 border border-white/[0.04] rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/[0.06] flex items-center justify-center mb-4">
                        <ScrollText size={28} className="text-slate-600" />
                    </div>
                    <p className="text-lg font-bold text-slate-400">Nenhuma proposta encontrada</p>
                    <p className="text-sm text-slate-500 mt-1">Suas propostas aparecerão aqui assim que forem enviadas.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {proposals.map((p, i) => {
                        const st = STATUS_LABELS[p.status] || STATUS_LABELS.SENT;
                        const sentDate = p.sentAt ? new Date(p.sentAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                        const projectLabel = Array.isArray(p.projectType) ? p.projectType.join(", ") : p.projectType;

                        return (
                            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <Link href={`/dashboard/proposals/${p.id}`}
                                    className="block bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-all group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                                                    {projectLabel}
                                                </h3>
                                                <span className={`shrink-0 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${st.color}`}>
                                                    {st.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 mb-3">{p.clientName}</p>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={13} /> {sentDate}
                                                </span>
                                                {p.totalValue && (
                                                    <span className="flex items-center gap-1.5">
                                                        <DollarSign size={13} /> {fmt(p.totalValue)}
                                                    </span>
                                                )}
                                                {p.totalHours && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock size={13} /> {p.totalHours}h estimadas
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-2 text-slate-500 group-hover:text-blue-400 transition-colors">
                                            <span className="text-xs font-medium hidden sm:block">Ver Proposta</span>
                                            <ArrowRight size={18} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
