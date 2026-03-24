/**
 * Step 4 — AI Effort Estimate
 *
 * Route: /dashboard/crm/proposals/new/review/gaps/estimate
 *
 * Reads `finalScope` from draft, calls POST /api/proposals/estimate,
 * displays role/hours/rate table, allows inline editing, and creates the
 * final proposal via POST /api/proposals.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    ChevronLeft,
    Loader2,
    Calculator,
    Users,
    Clock,
    DollarSign,
    Sparkles,
    AlertTriangle,
    RefreshCw,
    CheckCircle2,
    Trash2,
    Plus,
    Edit3,
    Save,
    X,
    ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import {
    loadDraft,
    saveDraft,
    clearDraft,
    parseScope,
    type ProposalDraft,
    type EstimateResult,
    type EstimateLine,
    type ParsedScope,
    type ParsedPlatform,
} from "../../../_shared";
import { WizardHeader } from "../../../_components/WizardHeader";
import {
    type ClientOption,
    newPlatform,
    scopeToText,
    PlatformEditor,
    SummaryBar,
    SortableList,
} from "../../../_components/ScopeEditors";

// ─── Types (API response shape) ───────────────
interface ApiEstimateLine {
    role: string;
    hours: number;
    rate: number;
}

interface ApiEstimateResult {
    lines: ApiEstimateLine[];
    totalHours: number;
    totalCost: number;
    scopeWithHours?: string;
}

// ─── Format helpers ───────────────────────────
function fmt(n: number) {
    return n.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

function fmtHours(n: number) {
    return `${n.toLocaleString("pt-BR")}h`;
}

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
//  Main Page
// ═══════════════════════════════════════════════
export default function EstimatePage() {
    const router = useRouter();

    const [draft, setDraft] = useState<ProposalDraft | null>(null);
    const [scope, setScope] = useState<ParsedScope | null>(null);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    const [globalRate, setGlobalRate] = useState<number>(150);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasEstimated, setHasEstimated] = useState(false);

    useEffect(() => {
        const d = loadDraft();
        if (!d) {
            router.replace("/dashboard/crm/proposals/new");
            return;
        }
        setDraft(d);
        setScope(parseScope(d.finalScope || d.editedScope || d.scopeRaw));

        // If the draft already has an estimate, restore it
        if (d.estimate && d.estimate.totalCost > 0) {
            if (d.estimate.totalHours > 0) {
                setGlobalRate(Math.max(1, Math.round(d.estimate.totalCost / d.estimate.totalHours)));
            }
            setHasEstimated(true);
        }
    }, [router]);

    // Load clients
    useEffect(() => {
        setLoadingClients(true);
        api<ClientOption[]>("/api/clients")
            .then((res) => {
                if (res?.success && res.data) setClients(res.data);
            })
            .finally(() => setLoadingClients(false));
    }, []);

    // Platform CRUD
    const addPlatform = () => setScope((prev) => (prev ? [...prev, newPlatform()] : [newPlatform()]));
    const updatePlatform = (i: number, p: ParsedPlatform) =>
        setScope((prev) => {
            if (!prev) return prev;
            const next = [...prev];
            next[i] = p;
            return next;
        });
    const deletePlatform = (i: number) => setScope((prev) => prev?.filter((_, idx) => idx !== i) ?? prev);

    // ── Derived totals ───────────────────────────
    const totals = useMemo(() => {
        if (!scope) return { totalHours: 0, totalCost: 0 };
        const totalHours = scope.reduce(
            (s1, p) => s1 + p.users.reduce(
                (s2, u) => s2 + u.modules.reduce(
                    (s3, m) => s3 + m.screens.reduce(
                        (s4, s) => s4 + s.functionalities.reduce(
                            (s5, f) => s5 + (f.hours || 0)
                        , 0)
                    , 0)
                , 0)
            , 0)
        , 0);

        // Round to 1 decimal point to avoid floating point summation artifacts
        const cleanTotalHours = Math.round(totalHours * 10) / 10;
        return { totalHours: cleanTotalHours, totalCost: cleanTotalHours * globalRate };
    }, [scope, globalRate]);

    // ── Bi-directional Global Hours Proportional Scaling ──
    const handleGlobalHoursChange = useCallback((newTotal: number) => {
        if (!scope || totals.totalHours <= 0 || newTotal <= 0) return;
        
        const ratio = newTotal / totals.totalHours;

        setScope(prevScope => {
            if (!prevScope) return prevScope;
            return prevScope.map(p => ({
                ...p,
                users: p.users.map(u => ({
                    ...u,
                    modules: u.modules.map(m => ({
                        ...m,
                        screens: m.screens.map(s => ({
                            ...s,
                            functionalities: s.functionalities.map(f => {
                                if (!f.hours) return f;
                                const scaled = f.hours * ratio;
                                // Round to nearest 0.5 for cleaner estimates
                                let rounded = Math.round(scaled * 2) / 2;
                                // Prevent complete zero-out if it had base hours
                                if (rounded <= 0 && f.hours > 0) rounded = 0.5;
                                return { ...f, hours: rounded };
                            })
                        }))
                    }))
                }))
            }));
        });
    }, [totals.totalHours, scope]);

    // Local state for the editable numeric input to prevent progressive rounding destruction on each keystroke
    const [localTotalHours, setLocalTotalHours] = useState<string>("");

    useEffect(() => {
        setLocalTotalHours(totals.totalHours ? totals.totalHours.toString() : "");
    }, [totals.totalHours]);

    const handleTotalHoursBlur = () => {
        const val = Number(localTotalHours);
        if (!isNaN(val) && val > 0 && val !== totals.totalHours) {
            handleGlobalHoursChange(val);
        } else {
            // Revert back if invalid
            setLocalTotalHours(totals.totalHours.toString());
        }
    };

    const handleTotalHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.currentTarget.blur();
        }
    };

    // ── Call AI Estimate ─────────────────────────
    const runEstimate = useCallback(
        async (d: ProposalDraft) => {
            const scopeText = scope ? scopeToText(scope) : (d.finalScope || d.editedScope || d.scopeRaw);
            
            // Auto-save the edits to draft before estimating
            if (scope) {
                saveDraft({ ...d, finalScope: scopeText });
            }

            if (!scopeText || scopeText.length < 50) {
                setError("Escopo muito curto para gerar estimativa.");
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await api<ApiEstimateResult>(
                    "/api/proposals/estimate",
                    {
                        method: "POST",
                        body: {
                            scopeText,
                            proposalTitle: d.title,
                        },
                    }
                );

                if (!res.success || !res.data) {
                    throw new Error(
                        res.error?.message || res.message || "Resposta inválida da IA."
                    );
                }

                const data = res.data;

                if (!data.lines || !Array.isArray(data.lines)) {
                    throw new Error("Resposta inválida da IA.");
                }

                // We ignore mapping the AI's structural lines table since the single source of truth is now the Visual Tree
                setHasEstimated(true);

                // Re-parse the detailed scope if AI provided the granular Hours assignment
                let finalScopeToSave = scopeText;
                let finalTotalHours = data.totalHours;

                if (data.scopeWithHours) {
                    finalScopeToSave = data.scopeWithHours;
                    const parsedGranularScope = parseScope(data.scopeWithHours);
                    if (parsedGranularScope && parsedGranularScope.length > 0) {
                        setScope(parsedGranularScope);
                        finalTotalHours = parsedGranularScope.reduce(
                            (s1, p) => s1 + p.users.reduce(
                                (s2, u) => s2 + u.modules.reduce(
                                    (s3, m) => s3 + m.screens.reduce(
                                        (s4, s) => s4 + s.functionalities.reduce(
                                            (s5, f) => s5 + (f.hours || 0)
                                        , 0)
                                    , 0)
                                , 0)
                            , 0)
                        , 0);
                    }
                }

                if (finalTotalHours > 0) {
                    setGlobalRate(Math.max(1, Math.round(data.totalCost / finalTotalHours)));
                }

                // Save to draft combining tree-derived logic instead of legacy lines.
                const totalCost = finalTotalHours * (finalTotalHours > 0 ? (data.totalCost / finalTotalHours) : 150);
                const estimate: EstimateResult = {
                    lines: [], // Profile lines are dropped as requested by the user
                    totalHours: finalTotalHours,
                    totalCost,
                    summary: `Escopo Organizado, ${finalTotalHours}h totais ESTIMADAS, ${fmt(totalCost)}`,
                };
                const updated = { ...d, estimate, finalScope: finalScopeToSave };
                saveDraft(updated);
                setDraft(updated);
            } catch (err: any) {
                const msg =
                    err?.message ||
                    err?.error?.message ||
                    "Erro ao gerar estimativa.";
                setError(msg);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Auto-run on first load if not already estimated
    useEffect(() => {
        if (draft && !hasEstimated && !loading) {
            runEstimate(draft);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft, hasEstimated]);

    // Submitting logic has moved to Step 5: team > page.tsx
    const navigateToTeam = () => {
        if (!draft || totals.totalHours <= 0) return;
        
        // Save the very latest computed cost based on the active session's Global Rate before proceeding
        const currentEstimate: EstimateResult = {
            lines: [],
            totalHours: totals.totalHours,
            totalCost: totals.totalCost,
            summary: `Escopo Organizado, ${totals.totalHours}h, ${fmt(totals.totalCost)}`,
        };
        const updatedScopeText = scope ? scopeToText(scope) : draft.finalScope;
        saveDraft({ ...draft, estimate: currentEstimate, finalScope: updatedScopeText });
        
        router.push("/dashboard/crm/proposals/new/review/gaps/estimate/team");
    };

    /* ── Render ── */
    if (!draft) return null;

    return (
        <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <button
                onClick={() =>
                    router.push("/dashboard/crm/proposals/new/review/gaps")
                }
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-2"
            >
                <ChevronLeft size={16} /> Voltar para Lacunas (IA)
            </button>

            <WizardHeader 
                title="Estimativa Final"
                subtitle="Passo 4 de 4 — Calcule esforço e feche seu escopo final."
                currentStep={4}
            />

            {/* Loading state */}
            {loading && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-3xl bg-slate-900 border border-white/[0.07] p-10 flex flex-col items-center gap-5 text-center mb-6"
                >
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Calculator
                            size={22}
                            className="text-blue-300 animate-pulse"
                        />
                    </div>
                    <div>
                        <p className="text-white font-semibold mb-1">
                            Gerando Estimativa…
                        </p>
                        <p className="text-sm text-slate-400 max-w-sm">
                            A IA está analisando o escopo final e estimando o
                            esforço por perfil profissional.
                        </p>
                    </div>
                    <Loader2
                        size={18}
                        className="text-blue-400 animate-spin"
                    />
                </motion.div>
            )}

            {/* Error state */}
            {error && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 mb-6"
                >
                    <AlertTriangle
                        size={18}
                        className="text-red-400 flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1">
                        <p className="text-sm text-red-300">{error}</p>
                        <button
                            onClick={() => draft && runEstimate(draft)}
                            className="mt-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            <RefreshCw size={11} />
                            Tentar novamente
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Editable Tree Scope */}
            {scope && !loadingClients && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Sparkles size={16} className="text-blue-500" />
                        </div>
                        Escopo Final (Com Lacunas)
                        <span className="ml-auto text-[10px] font-normal text-slate-500 text-right max-w-[150px]">
                            Clique nos itens para edição final
                        </span>
                    </h2>

                    <div className="relative z-10">

                    <SummaryBar
                        scope={scope}
                        title={draft.title}
                        clientId={draft.clientId}
                        clients={clients}
                    />

                    <div className="space-y-10">
                        <SortableList
                            items={scope}
                            onReorder={(newArr) => setScope(newArr)}
                        >
                            {(platform, pi, handleProps) => (
                                <PlatformEditor
                                    platform={platform}
                                    dragHandleProps={handleProps}
                                    onUpdate={(np) => updatePlatform(pi, np)}
                                    onDelete={() => deletePlatform(pi)}
                                    canDelete={scope.length > 1}
                                />
                            )}
                        </SortableList>
                    </div>

                        <button
                            onClick={addPlatform}
                            className="mt-10 w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.05] transition-all text-sm font-semibold"
                        >
                            <Plus size={16} />
                            Adicionar Nova Plataforma
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Estimate table (now just summary cards) */}
            {!loading && hasEstimated && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Summary cards without Table */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                        <div className="rounded-3xl bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] p-6 relative overflow-hidden shadow-lg flex flex-col justify-center gap-2">
                            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="flex items-center gap-2 text-slate-400 mb-1 relative z-10">
                                <Clock size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                                    Total de Horas
                                </span>
                            </div>
                            <div className="relative z-10 flex items-center gap-2">
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.5"
                                    value={localTotalHours}
                                    onChange={(e) => setLocalTotalHours(e.target.value)}
                                    onBlur={handleTotalHoursBlur}
                                    onKeyDown={handleTotalHoursKeyDown}
                                    className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-2xl font-extrabold text-blue-400 max-w-[120px] focus:border-blue-500/50 outline-none transition-colors"
                                />
                                <span className="text-slate-500 text-sm font-semibold">h</span>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] p-6 relative overflow-hidden shadow-lg flex flex-col justify-center gap-2">
                            <div className="flex items-center gap-2 text-slate-400 mb-1 relative z-10">
                                <Users size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                                    Valor da Hora (Geral)
                                </span>
                            </div>
                            <div className="relative z-10 flex items-center gap-2">
                                <span className="text-slate-500 text-xl font-bold">R$</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={globalRate || ""}
                                    onChange={(e) => setGlobalRate(Number(e.target.value) || 0)}
                                    className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-2xl font-extrabold text-white max-w-[120px] focus:border-emerald-500/50 outline-none transition-colors"
                                />
                                <span className="text-slate-500 text-sm">/h</span>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] p-6 relative overflow-hidden shadow-lg">
                            <div className="absolute -bottom-10 -right-10 w-[200px] h-[200px] bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex items-center gap-2 text-slate-400 mb-3 relative z-10">
                                <DollarSign size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest text-green-300">
                                    Custo Estimado Final
                                </span>
                            </div>
                            <p className="text-3xl font-extrabold text-green-400 relative z-10">
                                {fmt(totals.totalCost)}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-white/[0.06]">
                <button
                    onClick={() =>
                        router.push(
                            "/dashboard/crm/proposals/new/review/gaps"
                        )
                    }
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/[0.08] text-sm text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
                >
                    <ChevronLeft size={18} />
                    Voltar
                </button>

                <button
                    onClick={navigateToTeam}
                    disabled={
                        loading || totals.totalHours <= 0
                    }
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                    Equipe
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
