"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Loader2,
    Sparkles,
    LayoutTemplate,
    AlertCircle,
    Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import {
    loadDraft,
    saveDraft,
    parseScope,
    type ProposalDraft,
    type ParsedScope,
    type ParsedPlatform,
} from "../_shared";

import {
    type ClientOption,
    newPlatform,
    scopeToText,
    PlatformEditor,
    SummaryBar,
    SortableList,
} from "../_components/ScopeEditors";
import { WizardHeader } from "../_components/WizardHeader";

// ─── Page ─────────────────────────────────────

export default function ReviewProposalPage() {
    const router = useRouter();

    const [draft, setDraft] = useState<ProposalDraft | null>(null);
    const [scope, setScope] = useState<ParsedScope | null>(null);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [navigating, setNavigating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load draft
    useEffect(() => {
        const d = loadDraft();
        if (!d) {
            router.replace("/dashboard/crm/proposals/new");
            return;
        }
        setDraft(d);
        setScope(parseScope(d.scopeRaw));
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
    const addPlatform = () =>
        setScope((prev) => (prev ? [...prev, newPlatform()] : [newPlatform()]));

    const updatePlatform = (i: number, p: ParsedPlatform) =>
        setScope((prev) => {
            if (!prev) return prev;
            const next = [...prev];
            next[i] = p;
            return next;
        });

    const deletePlatform = (i: number) =>
        setScope((prev) => prev?.filter((_, idx) => idx !== i) ?? prev);

    /** Persist the edited scope into the draft and navigate to Step 3. */
    const handleGoToGaps = () => {
        if (!draft || !scope) return;
        setNavigating(true);
        setError(null);
        const editedScope = scopeToText(scope);
        saveDraft({ ...draft, editedScope });
        router.push("/dashboard/crm/proposals/new/review/gaps");
    };

    if (!draft || !scope) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={24} className="animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => router.push("/dashboard/crm/proposals/new?back=true")}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-2"
            >
                <ChevronLeft size={16} /> Voltar para Informações
            </button>

            <WizardHeader 
                title="Revisão e Escopo"
                subtitle="Passo 2 de 4 — Ajuste livremente a estrutura antes da análise"
                currentStep={2}
            />

            {/* Main editor card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 md:p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <LayoutTemplate size={16} className="text-blue-500" />
                    </div>
                    Escopo Analítico Editável
                    <span className="ml-auto text-[10px] font-normal text-slate-500 max-w-[150px] text-right">
                        Clique diretamente nos itens para editar ou adicionar novas hierarquias
                    </span>
                </h2>

                <div className="relative z-10">
                    {loadingClients ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 size={24} className="animate-spin text-slate-500" />
                        </div>
                    ) : (
                    <>
                        {/* Summary bar */}
                        <SummaryBar
                            scope={scope}
                            title={draft.title}
                            clientId={draft.clientId}
                            clients={clients}
                        />

                        {/* Platforms */}
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

                        {/* Add platform */}
                        <button
                            onClick={addPlatform}
                            className="mt-10 w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.05] transition-all text-sm font-semibold"
                        >
                            <Plus size={16} />
                            Adicionar Nova Plataforma
                        </button>
                    </>
                )}
                </div>
            </motion.div>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                    <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                </motion.div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-white/[0.06]">
                <button
                    onClick={() => router.push("/dashboard/crm/proposals/new?back=true")}
                    disabled={navigating}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/[0.08] text-sm text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all disabled:opacity-40"
                >
                    <ChevronLeft size={18} />
                    Voltar
                </button>

                <button
                    onClick={handleGoToGaps}
                    disabled={navigating || loadingClients}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                    {navigating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Preparando análise…
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Analisar Lacunas com IA
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
