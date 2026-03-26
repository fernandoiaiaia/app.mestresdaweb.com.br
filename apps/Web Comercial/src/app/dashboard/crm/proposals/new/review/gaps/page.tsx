/**
 * Step 3 — AI Gaps Analysis
 *
 * Route: /dashboard/crm/proposals/new/review/gaps
 *
 * Reads the draft from sessionStorage (including the editedScope written by
 * Step 2), calls the analyze-gaps endpoint, shows the results, and navigates
 * to Step 4 (Estimate) with the final scope saved to the draft.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    ChevronLeft,
    Loader2,

    Sparkles,
    CheckCircle2,
    AlertTriangle,
    Info,
    ArrowDown,
    X,
    BarChart3,
    RefreshCw,
    FileText,
    LayoutTemplate,
    Check,
    Edit2,
    Monitor,
    Users,
    Box,
    Layout,
    Zap,
    Link2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
    loadDraft,
    saveDraft,
    parseScope,
    type ProposalDraft,
} from "../../_shared";
import { scopeToText } from "../../_components/ScopeEditors";
import { WizardHeader } from "../../_components/WizardHeader";

// ─── Types ────────────────────────────────────

interface GapItem {
    category: string;
    title: string;
    description: string;
    priority: "alta" | "média" | "baixa";
    injection?: {
        platform: string;
        user: string;
        module: string;
        screen: string;
    };
}

interface GapItemWithState extends GapItem {
    accepted: boolean;
    editedDescription?: string;
    editing?: boolean;
}

interface AnalyzeGapsResponse {
    gaps: GapItem[];
    summary: string;
    completenessScore: number;
}

// ─── Priority helpers ─────────────────────────

const priorityMeta: Record<
    GapItem["priority"],
    { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
    alta: {
        label: "Alta",
        color: "text-red-300",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        icon: <AlertTriangle size={13} className="text-red-400" />,
    },
    média: {
        label: "Média",
        color: "text-amber-300",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        icon: <Info size={13} className="text-amber-400" />,
    },
    baixa: {
        label: "Baixa",
        color: "text-blue-300",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        icon: <Info size={13} className="text-blue-400" />,
    },
};

// ─── Category helpers ─────────────────────────

const categoryMeta: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    Plataformas: { icon: <Monitor size={13} />, color: "text-cyan-300", bg: "bg-cyan-500/10" },
    Usuários:    { icon: <Users size={13} />,   color: "text-pink-300", bg: "bg-pink-500/10" },
    Módulos:     { icon: <Box size={13} />,     color: "text-violet-300", bg: "bg-violet-500/10" },
    Telas:       { icon: <Layout size={13} />,  color: "text-sky-300", bg: "bg-sky-500/10" },
    Funcionalidades: { icon: <Zap size={13} />, color: "text-amber-300", bg: "bg-amber-500/10" },
    Integrações: { icon: <Link2 size={13} />,   color: "text-emerald-300", bg: "bg-emerald-500/10" },
};

// ─── Score ring ───────────────────────────────

function ScoreRing({ score }: { score: number }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const stroked = ((100 - score) / 100) * circumference;

    const color =
        score >= 80
            ? "#22c55e"
            : score >= 55
              ? "#f59e0b"
              : "#ef4444";

    return (
        <div className="flex flex-col items-center gap-3">
            <svg width="100" height="100" viewBox="0 0 100 100">
                {/* Track */}
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"
                />
                {/* Progress */}
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={stroked}
                    strokeLinecap="round"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s ease" }}
                />
                {/* Label */}
                <text
                    x="50" y="50"
                    textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize="16" fontWeight="700"
                >
                    {score}
                </text>
            </svg>
            <p className="text-xs text-slate-400 text-center">Completude do Escopo</p>
        </div>
    );
}

// ─── Gap card ─────────────────────────────────

function GapCard({
    gap,
    onDismiss,
    onToggleAccept,
    onToggleEdit,
    onEditDescription,
    index,
}: {
    gap: GapItemWithState;
    onDismiss: () => void;
    onToggleAccept: () => void;
    onToggleEdit: () => void;
    onEditDescription: (desc: string) => void;
    index: number;
}) {
    const pMeta = priorityMeta[gap.priority] ?? priorityMeta["baixa"];
    const cMeta = categoryMeta[gap.category];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: index * 0.06 }}
            className={`group relative rounded-2xl border p-4 transition-all ${
                gap.accepted
                    ? "bg-green-500/5 border-green-500/20 ring-1 ring-green-500/10"
                    : "bg-slate-800/50 border-white/[0.07] hover:bg-slate-800/70"
            }`}
        >
            {/* Top-right actions */}
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                    onClick={onToggleEdit}
                    className="p-1 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/10"
                    title="Editar descrição"
                >
                    <Edit2 size={12} />
                </button>
                <button
                    onClick={onDismiss}
                    className="p-1 rounded-lg text-slate-600 hover:text-red-300 hover:bg-red-500/10"
                    title="Dispensar"
                >
                    <X size={12} />
                </button>
            </div>

            <div className="flex items-start gap-3">
                {/* Category pill */}
                <div className={`mt-0.5 flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    cMeta
                        ? `${cMeta.bg} ${cMeta.color} border-transparent`
                        : `${pMeta.bg} ${pMeta.border} ${pMeta.color}`
                }`}>
                    {cMeta?.icon}
                    {gap.category}
                </div>
            </div>

            <div className="mt-2.5 flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">{pMeta.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-snug">{gap.title}</p>

                    {gap.editing ? (
                        <textarea
                            className="mt-1 w-full text-xs text-slate-300 bg-slate-900/80 border border-white/10 rounded-lg p-2 leading-relaxed focus:outline-none focus:ring-1 focus:ring-violet-500/40 resize-y min-h-[60px]"
                            value={gap.editedDescription ?? gap.description}
                            onChange={(e) => onEditDescription(e.target.value)}
                            autoFocus
                        />
                    ) : (
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                            {gap.editedDescription ?? gap.description}
                        </p>
                    )}

                    <div className="flex flex-col gap-2 mt-3">
                        {gap.injection && gap.injection.platform && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-500 bg-slate-900/50 p-1.5 rounded-md border border-white/5 w-fit">
                                <span className="text-violet-400 font-semibold">{gap.injection.platform}</span>
                                {gap.injection.user && <><span className="text-slate-600">›</span><span className="text-pink-400/80">{gap.injection.user}</span></>}
                                {gap.injection.module && <><span className="text-slate-600">›</span><span className="text-sky-400/80">{gap.injection.module}</span></>}
                                {gap.injection.screen && <><span className="text-slate-600">›</span><span className="text-amber-400/80 truncate max-w-[150px]">{gap.injection.screen}</span></>}
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${pMeta.bg} ${pMeta.color}`}>
                                Prioridade {pMeta.label}
                            </div>

                            {/* Accept button */}
                            <button
                                onClick={onToggleAccept}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
                                    gap.accepted
                                        ? "bg-green-500/20 text-green-300 ring-1 ring-green-500/30"
                                        : "bg-slate-700/50 text-slate-500 hover:text-green-300 hover:bg-green-500/10"
                                }`}
                            >
                                <Check size={11} />
                                {gap.accepted ? "Aceito" : "Aceitar"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main page ────────────────────────────────

export default function GapsAnalysisPage() {
    const router = useRouter();

    const [draft, setDraft] = useState<ProposalDraft | null>(null);

    // Analysis state
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisData, setAnalysisData] = useState<AnalyzeGapsResponse | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [gaps, setGaps] = useState<GapItemWithState[]>([]);

    /* ── Load draft ── */
    useEffect(() => {
        const d = loadDraft();
        if (!d) {
            router.replace("/dashboard/crm/proposals/new");
            return;
        }
        setDraft(d);
    }, [router]);

    /* ── Auto-run analysis once draft is loaded ── */
    useEffect(() => {
        if (!draft) return;
        runAnalysis(draft);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft]);

    /* ── Analysis call ── */
    async function runAnalysis(d: ProposalDraft) {
        const scopeText = d.editedScope ?? d.scopeRaw;
        if (!scopeText || scopeText.trim().length < 50) {
            setAnalysisError(
                "O escopo é muito curto para análise. Volte e adicione mais detalhes."
            );
            return;
        }

        setAnalysisLoading(true);
        setAnalysisError(null);
        setAnalysisData(null);

        try {
            const res = await api<AnalyzeGapsResponse>("/api/proposals/analyze-gaps", {
                method: "POST",
                body: {
                    scopeText: scopeText.trim(),
                    proposalTitle: d.title,
                },
            });

            if (!res?.success || !res.data) {
                throw new Error(res?.error?.message ?? "Erro ao analisar o escopo.");
            }

            setAnalysisData(res.data);
            setGaps(
                (res.data.gaps ?? []).map((g) => ({
                    ...g,
                    accepted: false,
                    editing: false,
                }))
            );
        } catch (err: unknown) {
            setAnalysisError(
                err instanceof Error ? err.message : "Erro ao conectar com a IA. Tente novamente."
            );
        } finally {
            setAnalysisLoading(false);
        }
    }

    /* ── Gap action helpers ── */
    const toggleAccept = useCallback((idx: number) => {
        setGaps((prev) =>
            prev.map((g, i) => (i === idx ? { ...g, accepted: !g.accepted } : g))
        );
    }, []);

    const toggleEdit = useCallback((idx: number) => {
        setGaps((prev) =>
            prev.map((g, i) => (i === idx ? { ...g, editing: !g.editing } : g))
        );
    }, []);

    const updateDescription = useCallback((idx: number, desc: string) => {
        setGaps((prev) =>
            prev.map((g, i) => (i === idx ? { ...g, editedDescription: desc } : g))
        );
    }, []);

    /* ── Build scope with accepted gaps ── */
    function buildFinalScope(): string {
        const baseScope = draft?.editedScope ?? draft?.scopeRaw ?? "";
        const accepted = gaps.filter((g) => g.accepted);
        if (accepted.length === 0) return baseScope;

        // Simply append the accepted gaps to the raw text
        let finalScope = baseScope.trim();
        finalScope += "\n\n---\n### Adições Identificadas pela IA (Lacunas)\n\n";

        for (const gap of accepted) {
            const inj = gap.injection;
            const contextStr = (inj?.platform || inj?.module)
                ? ` [Contexto: ${[inj?.platform, inj?.module].filter(Boolean).join(" > ")}]`
                : "";

            finalScope += `**${gap.title}**${contextStr}\n`;
            finalScope += `${gap.editedDescription ?? gap.description}\n\n`;
        }

        return finalScope.trim();
    }

    /* ── Navigate to estimate step ── */
    function handleNext() {
        if (!draft) return;
        const updated = { ...draft, finalScope: buildFinalScope() };
        saveDraft(updated);
        router.push("/dashboard/crm/proposals/new/review/gaps/estimate");
    }

    /* ── Render ── */
    if (!draft) return null;

    return (
        <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => router.push("/dashboard/crm/proposals/new/review")}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-2"
            >
                <ChevronLeft size={16} /> Voltar para Revisão
            </button>

            <WizardHeader 
                title="Análise de Lacunas com IA"
                subtitle="Passo 3 de 4 — Nossa IA identificou pontos cegos. Revise-os abaixo."
                currentStep={3}
            />

            {/* Loading state */}
            {analysisLoading && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-3xl bg-slate-800/40 backdrop-blur-sm border border-white/[0.07] p-10 flex flex-col items-center gap-5 text-center relative overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center relative z-10">
                        <Sparkles size={22} className="text-violet-300 animate-pulse" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-white font-semibold text-lg">Analisando o escopo com Inteligência Artificial…</p>
                        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                            A IA está procurando por lacunas, dependências omitidas e
                            melhorias implícitas na arquitetura.
                        </p>
                    </div>
                    <Loader2 size={20} className="text-violet-400 animate-spin relative z-10" />
                </motion.div>
            )}

            {/* Error state */}
            {analysisError && !analysisLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl bg-slate-800/40 border border-red-500/20 p-8 flex flex-col items-center gap-4 text-center"
                >
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-400" />
                    </div>
                    <div>
                        <p className="text-white font-semibold">Erro na análise</p>
                        <p className="text-sm text-slate-400 mt-1 max-w-sm">{analysisError}</p>
                    </div>
                    <button
                        onClick={() => runAnalysis(draft)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/[0.07] text-sm font-bold text-white transition-all shadow-lg"
                    >
                        <RefreshCw size={16} />
                        Tentar novamente
                    </button>
                </motion.div>
            )}

            {/* Results */}
            {analysisData && !analysisLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Score + summary card */}
                    <div className="rounded-3xl bg-slate-800/40 backdrop-blur-sm border border-white/[0.07] p-6 md:p-8 relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                            <ScoreRing score={analysisData.completenessScore} />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 size={16} className="text-violet-400" />
                                    <h3 className="text-xs font-bold text-violet-300 uppercase tracking-widest">
                                        Diagnóstico do Especialista
                                    </h3>
                                </div>
                                <p className="text-slate-200 text-sm leading-relaxed">
                                    {analysisData.summary}
                                </p>
                                <button
                                    onClick={() => runAnalysis(draft)}
                                    className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                                >
                                    <RefreshCw size={12} />
                                    Refazer análise do zero
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Gap list */}
                    {gaps.length > 0 ? (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <ArrowDown size={14} className="text-slate-400" />
                                    <p className="text-sm text-slate-400">
                                        {gaps.length} lacuna{gaps.length !== 1 ? "s" : ""} identificada
                                        {gaps.length !== 1 ? "s" : ""} — aceite, edite ou descarte
                                    </p>
                                </div>
                                {gaps.filter((g) => g.accepted).length > 0 && (
                                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                                        {gaps.filter((g) => g.accepted).length} aceita{gaps.filter((g) => g.accepted).length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                            <AnimatePresence mode="popLayout">
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {gaps.map((gap, i) => (
                                        <GapCard
                                            key={`${gap.title}-${i}`}
                                            gap={gap}
                                            index={i}
                                            onDismiss={() =>
                                                setGaps((prev) =>
                                                    prev.filter((_, idx) => idx !== i)
                                                )
                                            }
                                            onToggleAccept={() => toggleAccept(i)}
                                            onToggleEdit={() => toggleEdit(i)}
                                            onEditDescription={(desc) => updateDescription(i, desc)}
                                        />
                                    ))}
                                </div>
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/20"
                        >
                            <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
                            <p className="text-sm text-green-300">
                                Nenhuma lacuna encontrada. O escopo está completo!
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-white/[0.06]">
                <button
                    onClick={() => router.push("/dashboard/crm/proposals/new/review")}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/[0.08] text-sm text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
                >
                    <ChevronLeft size={18} />
                    Voltar
                </button>

                <button
                    onClick={handleNext}
                    disabled={analysisLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
                >
                    Gerar Estimativas Finais
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
