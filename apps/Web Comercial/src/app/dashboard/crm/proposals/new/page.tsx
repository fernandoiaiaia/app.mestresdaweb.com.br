"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    FileText,
    ChevronLeft,
    Loader2,
    Info,
    Calendar,
    ArrowRight,
    Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { DRAFT_KEY, saveDraft, loadDraft, clearDraft, type ProposalDraft } from "./_shared";
import { WizardHeader } from "./_components/WizardHeader";

// ─── Types ────────────────────────────────────

interface ClientOption {
    id: string;
    name: string;
    company?: string;
    email?: string;
}

// ─── Constants ────────────────────────────────

const SCOPE_PLACEHOLDER = `1. Plataforma: Nome da Plataforma
2. Usuário: Administrador
3. Módulo / Menu: Gestão de Usuários
4. Tela: Listagem de Usuários
Descrição da Tela: Exibe todos os usuários com filtros e paginação.
5. Funcionalidade: Filtrar usuários por status
Descrição da Funcionalidade: Filtra a lista por status (ativo/inativo) em tempo real.
Integração: API de Usuários`;

// ─── Main Page ────────────────────────────────

export default function NewProposalPage() {
    const router = useRouter();

    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    const [title, setTitle] = useState("");
    const [clientId, setClientId] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [scopeRaw, setScopeRaw] = useState("");

    // Load clients
    useEffect(() => {
        setLoadingClients(true);
        api<ClientOption[]>("/api/clients")
            .then((res) => {
                if (res?.success && res.data) setClients(res.data);
            })
            .finally(() => setLoadingClients(false));
    }, []);

    // Restore draft only when navigating back from Step 2, or when Editing.
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const isBack = searchParams.get("back") === "true";
        const isEdit = searchParams.get("edit") === "true";

        if (isBack || isEdit) {
            const draft = loadDraft();
            if (draft) {
                if (draft.title) setTitle(draft.title);
                if (draft.clientId) setClientId(draft.clientId);
                if (draft.expiresAt) {
                    try {
                        const dateOnly = new Date(draft.expiresAt).toISOString().split('T')[0];
                        setExpiresAt(dateOnly);
                    } catch {
                        setExpiresAt(draft.expiresAt);
                    }
                }
                if (draft.scopeRaw) setScopeRaw(draft.scopeRaw);
            }
        } else {
            clearDraft();
        }
    }, []);

    const canNext = title.trim().length > 0 && scopeRaw.trim().length > 0;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const defaultExpiry = tomorrow.toISOString().split("T")[0];

    const handleNext = () => {
        if (!canNext) return;
        const previous = loadDraft() || ({} as ProposalDraft);
        saveDraft({ ...previous, title, clientId, expiresAt: expiresAt || defaultExpiry, scopeRaw });
        router.push("/dashboard/crm/proposals/new/review");
    };

    return (
        <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-2"
            >
                <ChevronLeft size={16} /> Voltar para Propostas
            </button>

            <WizardHeader 
                title="Nova Proposta"
                subtitle="Passo 1 de 4 — Informações e Escopo Mestre"
                currentStep={1}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 md:p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileText size={16} className="text-blue-500" />
                    </div>
                    Informações &amp; Escopo
                </h2>

                <div className="space-y-6 relative z-10">
                    {/* Row: Title + Client + Date */}
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                Nome da Proposta <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Portal do Cliente — XPTO"
                                className="w-full bg-slate-800/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>

                        {/* Client */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                Cliente
                            </label>
                            {loadingClients ? (
                                <div className="h-12 bg-slate-800/40 rounded-xl border border-white/[0.06] flex items-center justify-center">
                                    <Loader2 size={16} className="animate-spin text-slate-500" />
                                </div>
                            ) : (
                                <select
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    className="w-full bg-slate-800/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none"
                                >
                                    <option value="">— Selecionar (opcional)</option>
                                    {clients.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}{c.company ? ` · ${c.company}` : ""}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                <Calendar size={11} className="inline mr-1" />
                                Validade
                            </label>
                            <input
                                type="date"
                                value={expiresAt || defaultExpiry}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="w-full bg-slate-800/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Scope textarea */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Escopo Completo do Projeto <span className="text-red-400">*</span>
                            </label>
                            <span className="text-[10px] text-slate-600 font-mono">
                                {scopeRaw.trim().length > 0 ? `${scopeRaw.split("\n").filter(Boolean).length} linhas` : ""}
                            </span>
                        </div>

                        <div className="mb-2 px-3 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 flex gap-2">
                            <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Cole o escopo usando a hierarquia:{" "}
                                <span className="text-blue-300 font-semibold">
                                    1. Plataforma → 2. Usuário → 3. Módulo → 4. Tela → Descrição da Tela → 5. Funcionalidade → Descrição da Funcionalidade → Integração
                                </span>.
                                Ao clicar em &ldquo;Próximo&rdquo;, o conteúdo será organizado automaticamente.
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

            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-white/[0.06]">
                <button
                    onClick={handleNext}
                    disabled={!canNext}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all"
                >
                    Próximo Passo
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
