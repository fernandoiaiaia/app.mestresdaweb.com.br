/**
 * Shared types, parser, and visual components for the Proposal creation wizard.
 * Imported by both new/page.tsx (step 1) and new/review/page.tsx (step 2).
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    LayoutTemplate,
    Sparkles,
    Check,
    Monitor,
    Zap,
    Link2,
    Layers,
    Users,
    AlertCircle,
    Calculator,
} from "lucide-react";

// ─── sessionStorage keys ──────────────────────
export const DRAFT_KEY = "proposal_wizard_draft";
/** Persists the (possibly edited) scope text between Step 2 and Step 3. */
export const EDITED_SCOPE_KEY = "proposal_wizard_edited_scope";

// ─── Estimate Types ──────────────────────────────
export interface EstimateLine {
    role: string;
    task: string;
    hours: number;
    hourlyRate: number;
    subtotal: number;
}

export interface EstimateResult {
    lines: EstimateLine[];
    totalHours: number;
    totalCost: number;
    summary: string;
}

// ─── Draft shape ──────────────────────────────
export interface ProposalDraft {
    id?: string;
    title: string;
    clientId: string;
    expiresAt: string;
    summaryRaw?: string;
    scopeRaw: string;
    clientPortalPassword?: string;
    /** Overrides scopeRaw when present — set by step-2 editor before navigating to step 3. */
    editedScope?: string;
    /** Final scope after gap analysis review — set by step-3 before navigating to step 4. */
    finalScope?: string;
    /** AI-generated estimate — set by step-4. */
    estimate?: EstimateResult;
}

export function loadDraft(): ProposalDraft | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        return raw ? (JSON.parse(raw) as ProposalDraft) : null;
    } catch {
        return null;
    }
}

export function saveDraft(draft: ProposalDraft) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(DRAFT_KEY);
}

// ─── Parsed Scope Types ───────────────────────
export interface ParsedFunctionality {
    _id: string;
    name: string;
    description: string;
    integration?: string;
    hours?: number;
}

export interface ParsedScreen {
    _id: string;
    name: string;
    description: string;
    functionalities: ParsedFunctionality[];
}

export interface ParsedModule {
    _id: string;
    name: string;
    screens: ParsedScreen[];
}

export interface ParsedUser {
    _id: string;
    name: string;
    modules: ParsedModule[];
}

export interface ParsedPlatform {
    _id: string;
    name: string;
    users: ParsedUser[];
}

export type ParsedScope = ParsedPlatform[];

// ─── Semantic Sorter ──────────────────────────

const PLATFORM_PRIORITY: Record<string, number> = {
    landing: 10,
    site: 10,
    website: 10,
    app: 20,
    aplicativo: 20,
    web: 30,
    admin: 40,
    painel: 40,
    backoffice: 40,
    sistema: 40,
    api: 50,
    backend: 50,
};

const MODULE_PRIORITY: Record<string, number> = {
    onboarding: 10,
    autentica: 20,
    login: 20,
    cadastro: 20,
    dashboard: 30,
    "visão geral": 30,
    visao: 30,
    início: 30,
    home: 30,
    relatório: 80,
    relatorio: 80,
    financeiro: 85,
    pagamento: 85,
    configuraç: 90,
    ajustes: 90,
    perfil: 95,
};

function getPriority(name: string, dictionary: Record<string, number>, defaultPriority = 50) {
    const lower = name.toLowerCase();
    for (const [key, val] of Object.entries(dictionary)) {
        if (lower.includes(key)) return val;
    }
    return defaultPriority;
}

export function sortScope(ast: ParsedScope): ParsedScope {
    ast.sort((a, b) => {
        const pA = getPriority(a.name, PLATFORM_PRIORITY);
        const pB = getPriority(b.name, PLATFORM_PRIORITY);
        if (pA !== pB) return pA - pB;
        return a.name.localeCompare(b.name);
    });

    for (const plat of ast) {
        plat.users.sort((a, b) => {
            if (a.name.toLowerCase() === "geral") return -1;
            if (b.name.toLowerCase() === "geral") return 1;
            return a.name.localeCompare(b.name);
        });

        for (const user of plat.users) {
            user.modules.sort((a, b) => {
                const pA = getPriority(a.name, MODULE_PRIORITY);
                const pB = getPriority(b.name, MODULE_PRIORITY);
                if (pA !== pB) return pA - pB;
                return a.name.localeCompare(b.name);
            });

            for (const mod of user.modules) {
                mod.screens.sort((a, b) => {
                    if (a.name.toLowerCase() === "geral") return -1;
                    if (b.name.toLowerCase() === "geral") return 1;
                    return a.name.localeCompare(b.name);
                });

                for (const scr of mod.screens) {
                    scr.functionalities.sort((a, b) => a.name.localeCompare(b.name));
                }
            }
        }
    }
    return ast;
}

// ─── Scope Parser ─────────────────────────────

// Keywords that should NOT be treated as functionality names
const STRUCTURAL_KW =
    /^(?:usu[aá]ri[ao]|m[oó]dulo|telas?|plataforma|descri[cç][aã]|integra[cç][aã])/i;

// Strip everything up to and including first separator (: or — or –)
const valueAfterSep = (s: string): string => {
    const m = s.match(/[:—–]\s*(.*)/);
    return m ? m[1].trim() : s.trim();
};

export function parseScope(raw: string): ParsedScope {
    const lines = raw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const platforms: ParsedPlatform[] = [];
    let currentPlatform: ParsedPlatform | null = null;
    let currentUser: ParsedUser | null = null;
    let currentModule: ParsedModule | null = null;
    let currentScreen: ParsedScreen | null = null;
    let currentFunc: ParsedFunctionality | null = null;
    let inFuncBlock = false;
    let appendTo: "screenDesc" | "funcDesc" | null = null;

    const ensurePlatform = () => {
        if (!currentPlatform) {
            currentPlatform = { _id: crypto.randomUUID(), name: "Plataforma", users: [] };
            platforms.push(currentPlatform);
        }
    };
    const ensureUser = () => {
        ensurePlatform();
        if (!currentUser) {
            currentUser = { _id: crypto.randomUUID(), name: "Geral", modules: [] };
            currentPlatform!.users.push(currentUser);
        }
    };
    const ensureModule = () => {
        ensureUser();
        if (!currentModule) {
            currentModule = { _id: crypto.randomUUID(), name: "Geral", screens: [] };
            currentUser!.modules.push(currentModule);
        }
    };
    const ensureScreen = () => {
        ensureModule();
        if (!currentScreen) {
            currentScreen = { _id: crypto.randomUUID(), name: "Geral", description: "", functionalities: [] };
            currentModule!.screens.push(currentScreen);
        }
    };

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // ══ A. Numbered platform "N. Plataforma — Name" OR "N. Plataforma: Name" ══
        {
            const m = line.match(/^\d+\.\s+plataforma\s*[—–:]\s*(.*)/i);
            if (m) {
                currentPlatform = { _id: crypto.randomUUID(), name: m[1].trim() || "Plataforma", users: [] };
                platforms.push(currentPlatform);
                currentUser = null;
                currentModule = null;
                currentScreen = null;
                currentFunc = null;
                inFuncBlock = false;
                appendTo = null;
                continue;
            }
        }

        // ══ A2. Plain "Plataforma — Name" (no leading digit) ═════════════════
        {
            const m = line.match(/^plataforma\s*[—–:]\s*(.*)/i);
            if (m && !line.match(/^\d+\./)) {
                currentPlatform = { _id: crypto.randomUUID(), name: m[1].trim() || "Plataforma", users: [] };
                platforms.push(currentPlatform);
                currentUser = null;
                currentModule = null;
                currentScreen = null;
                currentFunc = null;
                inFuncBlock = false;
                appendTo = null;
                continue;
            }
        }

        // ══ B. Usuário: Value ════════════════════════════════════════════════
        {
            const m = line.match(/^(?:\d+\.\s+)?usu[aá]ri[ao]\s*[:—–.]\s*(.*)/i);
            if (m) {
                ensurePlatform();
                currentUser = { _id: crypto.randomUUID(), name: m[1].trim() || "Usuário", modules: [] };
                currentPlatform!.users.push(currentUser);
                currentModule = null;
                currentScreen = null;
                currentFunc = null;
                inFuncBlock = false;
                appendTo = null;
                continue;
            }
        }

        // ══ C. Módulo / Menu: Value ══════════════════════════════════════════
        {
            const m = line.match(/^(?:\d+\.\s+)?m[oó]dulo(?:\s*\/\s*menu)?\s*[:—–.]\s*(.*)/i);
            if (m) {
                ensureUser();
                currentModule = { _id: crypto.randomUUID(), name: m[1].trim() || "Módulo", screens: [] };
                currentUser!.modules.push(currentModule);
                currentScreen = null;
                currentFunc = null;
                inFuncBlock = false;
                appendTo = null;
                continue;
            }
        }

        // ══ D. Tela: Value ═══════════════════════════════════════════════════
        {
            const m = line.match(/^(?:\d+\.\s+)?telas?\s*[:—–.]\s*(.*)/i);
            if (m) {
                ensureModule();
                currentScreen = { _id: crypto.randomUUID(), name: m[1].trim(), description: "", functionalities: [] };
                currentFunc = null;
                currentModule!.screens.push(currentScreen);
                inFuncBlock = false;
                appendTo = "screenDesc";
                continue;
            }
        }

        // ══ E. Descrição: (explicit label) ═══════════════════════════════════
        {
            const m = line.match(
                /^descri[cç][aã]o(?:\s+da\s+(?:tela|funcionalidade))?\s*[:—–.]\s*(.*)/i,
            );
            if (m) {
                const val = m[1].trim();
                inFuncBlock = false;
                if (currentFunc) {
                    if (val) currentFunc.description = val;
                    appendTo = "funcDesc";
                } else if (currentScreen) {
                    if (val) currentScreen.description = val;
                    appendTo = "screenDesc";
                }
                continue;
            }
        }

        // ══ F. Bare "Funcionalidades" header ═════════════════════════════════
        if (/^funcionalidades?\s*$/i.test(line)) {
            inFuncBlock = true;
            appendTo = null;
            continue;
        }

        // ══ G. "Funcionalidade: Value" (single inline func) ══════════════════
        {
            const m = line.match(/^funcionalidade\s*[:—–.]\s*(.+)/i);
            if (m) {
                ensureScreen();
                currentFunc = { _id: crypto.randomUUID(), name: m[1].trim(), description: "", integration: undefined, hours: undefined };
                currentScreen!.functionalities.push(currentFunc);
                inFuncBlock = false;
                appendTo = "funcDesc";
                continue;
            }
        }

        // ══ H. Plataforma: (keyword without number) ══════════════════════════
        {
            const m = line.match(/^plataforma\s*[:—–.]\s*(.+)/i);
            if (m) {
                ensurePlatform();
                currentPlatform!.name = m[1].trim();
                inFuncBlock = false;
                appendTo = null;
                continue;
            }
        }

        // ══ I. Integração / Integrações ══════════════════════════════════════
        {
            const m = line.match(/^integra[cç][aã]o\s*[:—–.]\s*(.*)/i);
            if (m && currentFunc) {
                currentFunc.integration = m[1].trim();
                appendTo = null;
                continue;
            }
            if (/^integra[cç][oõ]es?\s*$/i.test(line)) {
                inFuncBlock = false;
                appendTo = null;
                continue;
            }
        }

        // ══ M. Horas ═════════════════════════════════════════════════════════
        {
            const m = line.match(/^horas?\s*[:—–.]\s*([\d.,]+)/i);
            if (m && currentFunc) {
                const val = parseFloat(m[1].replace(",", "."));
                if (!isNaN(val)) currentFunc.hours = val;
                appendTo = null;
                continue;
            }
        }

        // ══ J. Bullet points: "- Item" / "* Item" / "• Item" ════════════════
        {
            const m = line.match(/^[-*•·]\s+(.+)/);
            if (m) {
                const raw2 = m[1].trim();
                const colonIdx = raw2.indexOf(":");
                const name = colonIdx > 0 ? raw2.slice(0, colonIdx).trim() : raw2;
                const desc = colonIdx > 0 ? raw2.slice(colonIdx + 1).trim() : "";
                appendTo = null;

                if (inFuncBlock || currentScreen) {
                    ensureScreen();
                    currentFunc = { _id: crypto.randomUUID(), name, description: desc, integration: undefined, hours: undefined };
                    currentScreen!.functionalities.push(currentFunc);
                    if (desc) appendTo = "funcDesc";
                }
                continue;
            }
        }

        // ══ K. Inside funcBlock — plain "Name: Desc" lines ═══════════════════
        if (inFuncBlock) {
            const colonIdx = line.indexOf(":");
            if (colonIdx > 0) {
                const namePart = line.slice(0, colonIdx).trim();
                const descPart = line.slice(colonIdx + 1).trim();
                if (!STRUCTURAL_KW.test(namePart)) {
                    ensureScreen();
                    currentFunc = { _id: crypto.randomUUID(), name: namePart, description: descPart, integration: undefined, hours: undefined };
                    currentScreen!.functionalities.push(currentFunc);
                    appendTo = descPart ? "funcDesc" : null;
                    continue;
                }
            }
            // Plain line without colon inside funcBlock → append to last func desc
            if (currentFunc) {
                currentFunc.description += (currentFunc.description ? " " : "") + line;
            }
            continue;
        }

        // ══ L. Continuation / plain text ═════════════════════════════════════
        if (appendTo === "screenDesc" && currentScreen) {
            currentScreen.description += (currentScreen.description ? " " : "") + line;
        } else if (appendTo === "funcDesc" && currentFunc) {
            currentFunc.description += (currentFunc.description ? " " : "") + line;
        }
    }

    return sortScope(platforms.length > 0 ? platforms : [{ _id: crypto.randomUUID(), name: "Plataforma", users: [] }]);
}

// ─── Step Indicator ───────────────────────────

export const STEPS = [
    { label: "Informações & Escopo", icon: FileText },
    { label: "Escopo Organizado", icon: LayoutTemplate },
    { label: "Análise de Lacunas IA", icon: Sparkles },
    { label: "Estimativa IA", icon: Calculator },
];

export function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center gap-0">
            {STEPS.map((step, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <div key={step.label} className="flex items-center">
                        <motion.div
                            animate={{
                                backgroundColor: done
                                    ? "#22c55e"
                                    : active
                                    ? "#3b82f6"
                                    : "rgba(255,255,255,0.06)",
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center border border-white/[0.08] shrink-0"
                        >
                            {done ? (
                                <Check size={14} className="text-white" />
                            ) : (
                                <step.icon
                                    size={14}
                                    className={active ? "text-white" : "text-slate-500"}
                                />
                            )}
                        </motion.div>
                        <p
                            className={`hidden md:block text-xs ml-2 font-semibold ${
                                active ? "text-white" : done ? "text-green-400" : "text-slate-600"
                            }`}
                        >
                            {step.label}
                        </p>
                        {i < STEPS.length - 1 && (
                            <div className="w-10 md:w-16 h-px bg-white/[0.06] mx-3" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Visual Components (Step 2) ───────────────

export function FuncCard({ func, idx }: { func: ParsedFunctionality; idx: number }) {
    return (
        <div className="bg-slate-800/40 border border-white/[0.05] rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-md bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap size={10} className="text-violet-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-0.5">
                        Funcionalidade {idx + 1}
                    </p>
                    <p className="text-sm font-semibold text-white leading-snug">{func.name}</p>
                </div>
            </div>
            {func.description && (
                <p className="text-xs text-slate-400 leading-relaxed pl-7">
                    {func.description.trim()}
                </p>
            )}
            {func.integration && (
                <div className="pl-7 flex items-start gap-1.5">
                    <Link2 size={10} className="text-cyan-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-cyan-400">{func.integration.trim()}</p>
                </div>
            )}
        </div>
    );
}

export function ScreenCard({ screen }: { screen: ParsedScreen }) {
    return (
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-white/[0.06]">
                <Monitor size={13} className="text-blue-400 shrink-0" />
                <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    {screen.name}
                </p>
            </div>
            <div className="p-4 space-y-3">
                {screen.description && (
                    <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-blue-500/30 pl-3">
                        {screen.description.trim()}
                    </p>
                )}
                {screen.functionalities.length > 0 && (
                    <div className="space-y-2">
                        {screen.functionalities.map((f, fi) => (
                            <FuncCard key={fi} func={f} idx={fi} />
                        ))}
                    </div>
                )}
                {screen.functionalities.length === 0 && !screen.description && (
                    <p className="text-xs text-slate-600 italic">Sem detalhes adicionais.</p>
                )}
            </div>
        </div>
    );
}

export function ModuleSection({ mod }: { mod: ParsedModule }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Layers size={14} className="text-amber-400 shrink-0" />
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    {mod.name}
                </p>
                <div className="flex-1 h-px bg-amber-500/10" />
            </div>
            <div className="pl-4 space-y-3">
                {mod.screens.map((s, si) => (
                    <ScreenCard key={si} screen={s} />
                ))}
            </div>
        </div>
    );
}

export function UserSection({ user }: { user: ParsedUser }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0">
                    <Users size={11} className="text-green-400" />
                </div>
                <p className="text-sm font-bold text-green-300">{user.name}</p>
                <div className="flex-1 h-px bg-green-500/10" />
            </div>
            <div className="pl-4 space-y-5">
                {user.modules.map((m, mi) => (
                    <ModuleSection key={mi} mod={m} />
                ))}
            </div>
        </div>
    );
}

// ─── Step 2 Component ────────────────────────

interface ClientOption {
    id: string;
    name: string;
    company?: string;
}

export function ScopeReview({
    scopeRaw,
    title,
    clientId,
    clients,
}: {
    scopeRaw: string;
    title: string;
    clientId: string;
    clients: ClientOption[];
}) {
    const parsed = useMemo(() => parseScope(scopeRaw), [scopeRaw]);
    const client = clients.find((c) => c.id === clientId);

    const totalScreens = parsed.flatMap((p) =>
        p.users.flatMap((u) => u.modules.flatMap((m) => m.screens)),
    ).length;
    const totalFuncs = parsed.flatMap((p) =>
        p.users.flatMap((u) =>
            u.modules.flatMap((m) => m.screens.flatMap((s) => s.functionalities)),
        ),
    ).length;

    return (
        <div className="space-y-6">
            {/* Summary bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Proposta", value: title || "—" },
                    { label: "Cliente", value: client ? client.name : "Sem cliente" },
                    { label: "Telas", value: String(totalScreens) },
                    { label: "Funcionalidades", value: String(totalFuncs) },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-3"
                    >
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                            {item.label}
                        </p>
                        <p className="text-sm font-bold text-white truncate">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Parsed hierarchy */}
            {parsed.map((platform, pi) => (
                <div key={pi} className="space-y-5">
                    <div className="flex items-center gap-3 pb-2 border-b border-white/[0.06]">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <Monitor size={15} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Plataforma
                            </p>
                            <p className="text-base font-bold text-white">{platform.name}</p>
                        </div>
                    </div>

                    {platform.users.length > 0 ? (
                        <div className="space-y-6">
                            {platform.users.map((u, ui) => (
                                <UserSection key={ui} user={u} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <AlertCircle size={14} />
                            <span>
                                Nenhum conteúdo reconhecido. Verifique o formato do escopo na
                                etapa anterior.
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
