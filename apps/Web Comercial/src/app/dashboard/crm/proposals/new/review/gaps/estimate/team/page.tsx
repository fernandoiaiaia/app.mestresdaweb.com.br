"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    CheckCircle2,
    Loader2,
    Users,
    Clock,
    DollarSign,
    AlertTriangle,
} from "lucide-react";
import { WizardHeader } from "../../../../_components/WizardHeader";
import { loadDraft, clearDraft, parseScope, type EstimateResult, type EstimateLine, type ProposalDraft } from "../../../../_shared";
import { api } from "@/lib/api";

const TEAM_MATRIX = [
    { role: 'Gerente de Projeto', web: 0.08, mobile: 0.08, desktop: 0.08, landing: 0.10, website: 0.08, ecommerce: 0.08 },
    { role: 'UX e UI Designer', web: 0.03, mobile: 0.03, desktop: 0.03, landing: 0.10, website: 0.03, ecommerce: 0.03 },
    { role: 'DBA', web: 0.08, mobile: 0.08, desktop: 0.08, landing: 0, website: 0.08, ecommerce: 0.08 },
    { role: 'Arquiteto de Software', web: 0.05, mobile: 0.05, desktop: 0.05, landing: 0, website: 0.05, ecommerce: 0.05 },
    { role: 'Front-end Web', web: 0.30, mobile: 0, desktop: 0, landing: 0.72, website: 0.30, ecommerce: 0.30 },
    { role: 'Back-end', web: 0.30, mobile: 0.30, desktop: 0.30, landing: 0, website: 0.30, ecommerce: 0.30 },
    { role: 'Front-end Mobile', web: 0, mobile: 0.30, desktop: 0, landing: 0, website: 0, ecommerce: 0 },
    { role: 'Front-end Desktop', web: 0, mobile: 0, desktop: 0.30, landing: 0, website: 0, ecommerce: 0 },
    { role: 'QA', web: 0.08, mobile: 0.08, desktop: 0.08, landing: 0.08, website: 0.08, ecommerce: 0.08 },
    { role: 'DevOps', web: 0.05, mobile: 0.05, desktop: 0.05, landing: 0, website: 0.05, ecommerce: 0.05 },
    { role: 'Analista de Segurança', web: 0.03, mobile: 0.03, desktop: 0.03, landing: 0, website: 0.03, ecommerce: 0.03 },
] as const;

type PlatformKey = 'web' | 'mobile' | 'desktop' | 'landing' | 'website' | 'ecommerce';

function getPlatformType(name: string): PlatformKey {
    const l = name.toLowerCase();
    if (l.includes("ecommerce") || l.includes("e-commerce")) return "ecommerce";
    if (l.includes("landing")) return "landing";
    if (l.includes("website") || l.includes("site") || l.includes("institucional")) return "website";
    if (l.includes("mobile") || l.includes("app") || l.includes("ios") || l.includes("android")) return "mobile";
    if (l.includes("desktop") || l.includes("windows") || l.includes("mac") || l.includes("sistema")) return "desktop";
    return "web";
}

function fmt(v: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function TeamDistributionPage() {
    const router = useRouter();
    const [draft, setDraft] = useState<ProposalDraft | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if invalid contextual state
    useEffect(() => {
        const d = loadDraft();
        if (d) {
            setDraft(d);
        } else {
            router.replace("/dashboard/crm/proposals/new");
        }
    }, [router]);

    // Derived State Computations
    const teamDistribution = useMemo(() => {
        if (!draft || !draft.estimate) return [];

        const scopeText = draft.finalScope || draft.editedScope || draft.scopeRaw || "";
        const parsedTree = parseScope(scopeText);
        
        // Sum total hours isolated per platform vertical to calculate weighted portions
        const platformTotals: Record<string, { type: PlatformKey, hours: number }> = {};
        
        for (const platform of parsedTree) {
            const type = getPlatformType(platform.name);
            let platformHours = 0;
            
            for (const u of platform.users) {
                for (const m of u.modules) {
                    for (const s of m.screens) {
                        for (const f of s.functionalities) {
                            platformHours += (f.hours || 0);
                        }
                    }
                }
            }
            
            if (!platformTotals[platform.name]) {
                platformTotals[platform.name] = { type, hours: 0 };
            }
            platformTotals[platform.name].hours += platformHours;
        }

        // Apply percentages based on the platform vertical
        const roleAllocations: Record<string, number> = {};

        for (const platform of Object.values(platformTotals)) {
            for (const member of TEAM_MATRIX) {
                const fraction = member[platform.type];
                if (fraction > 0) {
                    const allocatedHours = platform.hours * fraction;
                    if (!roleAllocations[member.role]) roleAllocations[member.role] = 0;
                    roleAllocations[member.role] += allocatedHours;
                }
            }
        }

        // Format to array and calculate rate mapped from global totals
        const totalRawHours = draft.estimate.totalHours || 1;
        const globalHourlyBaseRate = (draft.estimate.totalCost || 0) / totalRawHours;

        const mappedLines: EstimateLine[] = Object.entries(roleAllocations)
            .map(([role, hours]) => {
                const h = Math.round(hours);
                const rate = Math.round(globalHourlyBaseRate);
                return {
                    id: Math.random().toString(36).substring(2, 9),
                    role,
                    task: "Desenvolvimento Especializado",
                    hours: h,
                    hourlyRate: rate,
                    subtotal: h * rate,
                };
            })
            .filter(l => l.hours > 0)
            .sort((a, b) => b.hours - a.hours); // Big volumes first

        return mappedLines;
    }, [draft]);

    // Handle Creation
    const handleCreate = async () => {
        if (!draft || !draft.estimate) return;

        setSubmitting(true);
        setError(null);

        try {
            const body = {
                title: draft.title,
                clientId: draft.clientId || null,
                expiresAt: draft.expiresAt || null,
                scopeRaw: draft.finalScope || draft.editedScope || draft.scopeRaw,
                estimate: {
                    ...draft.estimate, // Preserve 'platforms' AST required by dev-projects hydration
                    lines: teamDistribution, // Push the new granular roles into the BD
                    totalHours: draft.estimate.totalHours,
                    totalCost: draft.estimate.totalCost,
                },
            };

            let res;
            if (draft.id) {
                // Update Path
                res = await api<{ id: string }>(`/api/proposals/${draft.id}`, {
                    method: "PUT",
                    body,
                });
            } else {
                // Create Path
                res = await api<{ id: string }>("/api/proposals", {
                    method: "POST",
                    body,
                });
            }

            if (!res.success || !res.data) {
                throw new Error(res.error?.message || res.message || "Erro ao criar proposta.");
            }

            clearDraft();
            router.push(`/p/${res.data.id}`);
        } catch (err: any) {
            setError(err?.message || err?.error?.message || "Erro ao criar proposta.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!draft || !draft.estimate) return null;

    return (
        <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => router.push("/dashboard/crm/proposals/new/review/gaps/estimate")}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-2"
            >
                <ChevronLeft size={16} /> Voltar para Estimativas (Valores Globais)
            </button>

            <WizardHeader 
                title="Equipe de Execução"
                subtitle="Passo 5 de 5 — Distribuição inteligente de perfis baseada nos tipos de plataformas."
                currentStep={5}
                totalSteps={5}
            />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="pt-4"
            >
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-1">
                        Equipe Alocada no Projeto
                    </h2>
                    <p className="text-sm text-slate-400">
                        Conheça a dedicação estimada de cada profissional.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamDistribution.map((item, i) => {
                        const colors = [
                            { card: "bg-blue-500/[0.03] border-blue-500/10", text: "text-blue-400", bar: "bg-blue-500", icon: "text-blue-300" },
                            { card: "bg-indigo-500/[0.03] border-indigo-500/10", text: "text-indigo-400", bar: "bg-indigo-500", icon: "text-indigo-300" },
                            { card: "bg-purple-500/[0.03] border-purple-500/10", text: "text-purple-400", bar: "bg-purple-500", icon: "text-purple-300" },
                            { card: "bg-pink-500/[0.03] border-pink-500/10", text: "text-pink-400", bar: "bg-pink-500", icon: "text-pink-300" },
                            { card: "bg-teal-500/[0.03] border-teal-500/10", text: "text-teal-400", bar: "bg-teal-500", icon: "text-teal-300" },
                            { card: "bg-emerald-500/[0.03] border-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-500", icon: "text-emerald-300" },
                        ];
                        const theme = colors[i % colors.length];
                        const pct = Math.min(100, Math.round((item.hours / draft.estimate!.totalHours) * 100)) || 0;

                        return (
                            <div
                                key={i}
                                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all hover:-translate-y-1 ${theme.card}`}
                            >
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900/40 border border-white/[0.04] flex items-center justify-center shrink-0">
                                        <Users size={16} className={theme.icon} />
                                    </div>
                                    <p className={`text-2xl font-black tracking-tight ${theme.text}`}>
                                        {item.hours}h
                                    </p>
                                </div>
                                
                                <div>
                                    <p className="text-sm font-bold text-white mb-3">
                                        {item.role}
                                    </p>
                                    <div className="w-full h-1.5 bg-slate-900/60 rounded-full mb-2 overflow-hidden">
                                        <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                        {pct}% do total de horas
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Totals Box */}
                <div className="mt-10 p-6 bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <DollarSign size={18} className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Investimento Calculado</p>
                            <p className="text-2xl font-black text-green-400">{fmt(draft.estimate.totalCost)}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3"
                >
                    <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                </motion.div>
            )}

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-white/[0.06]">
                <button
                    onClick={() => router.push("/dashboard/crm/proposals/new/review/gaps/estimate")}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/[0.08] text-sm text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all w-full sm:w-auto"
                >
                    <ChevronLeft size={18} />
                    Revisar Estimativas
                </button>

                <button
                    onClick={handleCreate}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] w-full sm:w-auto"
                >
                    {submitting ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Finalizando Proposta…
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={18} />
                            Concluir &amp; Criar Proposta
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
