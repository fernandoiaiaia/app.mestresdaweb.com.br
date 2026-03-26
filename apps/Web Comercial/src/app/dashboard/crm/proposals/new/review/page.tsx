"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Loader2,
    Sparkles,
    LayoutTemplate,
    AlertCircle,
    Info,
} from "lucide-react";
import { api } from "@/lib/api";
import {
    loadDraft,
    saveDraft,
    type ProposalDraft,
} from "../_shared";

import { WizardHeader } from "../_components/WizardHeader";

// ─── Constants ────────────────────────────────

const SCOPE_PLACEHOLDER = `Escopo de Software — App de Delivery para Restaurante Local
Versão: 1.0
Tipo: Documento de Escopo Funcional
Plataformas: Mobile (iOS & Android) · Web (Painel Administrativo) · Tablet / App Operacional

1. Usuários do Sistema
Perfil | Descrição
Cliente | Realiza pedidos pelo aplicativo mobile ou web
...

2. Plataforma
2.1 App do Cliente — iOS & Android (React Native)
Aplicativo móvel para o cliente final...

3. Módulos / Menu do Sistema
Módulo | Descrição | Plataforma | Perfil
Cardápio | Exibição de categorias... | App Cliente · Web | Cliente
...`;

// ─── Types ─────────────────────────────────────

interface ClientOption {
    id: string;
    name: string;
    company?: string;
    email?: string;
}

// ─── Page ─────────────────────────────────────

export default function ReviewProposalPage() {
    const router = useRouter();

    const [draft, setDraft] = useState<ProposalDraft | null>(null);
    const [scopeRaw, setScopeRaw] = useState("");
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
        setScopeRaw(d.scopeRaw || "");
    }, [router]);

    // Load clients (maybe needed for summary bar, but keeping for parity)
    useEffect(() => {
        setLoadingClients(true);
        api<ClientOption[]>("/api/clients")
            .then((res) => {
                if (res?.success && res.data) setClients(res.data);
            })
            .finally(() => setLoadingClients(false));
    }, []);

    const canAnalyze = scopeRaw.trim().length > 50;

    /** Persist the edited scope into the draft and navigate to Step 3. */
    const handleGoToGaps = () => {
        if (!draft) return;
        if (!canAnalyze) {
            setError("O escopo deve conter mais detalhes (mínimo de 50 caracteres) para uma análise eficaz da IA.");
            return;
        }
        setNavigating(true);
        setError(null);
        saveDraft({ ...draft, scopeRaw });
        router.push("/dashboard/crm/proposals/new/review/gaps");
    };

    if (!draft) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={24} className="animate-spin text-slate-500" />
            </div>
        );
    }

    const client = clients.find(c => c.id === draft.clientId);

    return (
        <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => router.push("/dashboard/crm/proposals/new?back=true")}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-2"
            >
                <ChevronLeft size={16} /> Voltar para Informações
            </button>

            <WizardHeader 
                title="Escopo Detalhado"
                subtitle="Passo 2 de 4 — Insira o escopo estruturado do seu projeto"
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
                    Documento de Escopo
                    <span className="ml-auto text-[10px] font-normal text-slate-500 max-w-[150px] text-right">
                        Use o layout livre. A IA o lerá da mesma forma.
                    </span>
                </h2>

                <div className="relative z-10 space-y-6">
                    {/* Summary bar */}
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                Proposta
                            </p>
                            <p className="text-sm font-bold text-white truncate">{draft.title || "—"}</p>
                        </div>
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                Cliente
                            </p>
                            <p className="text-sm font-bold text-white truncate">{client ? client.name : "Sem cliente"}</p>
                        </div>
                    </div>

                    {/* Scope textarea */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Descrição Completa do Escopo <span className="text-red-400">*</span>
                            </label>
                            <span className="text-[10px] text-slate-600 font-mono">
                                {scopeRaw.trim().length} caracteres
                            </span>
                        </div>

                        <div className="mb-2 px-3 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 flex gap-2">
                            <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Cole ou digite o escopo de software completo aqui. Utilize listas, numerações ou tópicos 
                                como no exemplo para que a Inteligência artificial consiga ler com clareza.
                            </p>
                        </div>

                        <textarea
                            value={scopeRaw}
                            onChange={(e) => setScopeRaw(e.target.value)}
                            placeholder={SCOPE_PLACEHOLDER}
                            rows={20}
                            spellCheck={false}
                            className="w-full bg-slate-900/60 border border-white/[0.08] rounded-xl px-4 py-4 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500/40 transition-all resize-y leading-relaxed font-mono"
                        />
                    </div>
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
                    disabled={navigating || !canAnalyze}
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
