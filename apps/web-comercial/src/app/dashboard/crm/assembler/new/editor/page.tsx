"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit2, Users, Smartphone, X,
  Layers, Layout, Activity, Link as LinkIcon, Clock, ChevronDown, ChevronRight, Save, Presentation,
  Plus, Trash2, Sparkles, Loader2, CheckCircle2, MessageCircle, Eye
} from "lucide-react";
import { CompleteScope, ScopeUserNode, loadScopeDraft, saveScopeDraft, saveProposalToList, generateFullScope } from "../../_shared";
import { api } from "@/lib/api";
import { parseMarkdownToScope } from "../../parser";
import { useConfirm } from "@/providers/confirm-provider";
import { toast } from "sonner";
import MatrixRain from "@/components/shared/MatrixRain";

// ── Inline Editable Text ────────────────────────────────────────────────────

function EditableText({
  value, onChange, isTextArea = false, className = ""
}: {
  value: string; onChange: (val: string) => void;
  isTextArea?: boolean; className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value);

  const save = () => { onChange(tempVal); setIsEditing(false); };

  if (isEditing) {
    return (
      <div className="flex gap-2 w-full items-start">
        {isTextArea ? (
          <textarea autoFocus value={tempVal} onChange={e => setTempVal(e.target.value)}
            onBlur={save} rows={3}
            className={`flex-1 bg-black/50 border border-blue-500/50 rounded-lg p-2 text-white text-sm focus:outline-none resize-none ${className}`} />
        ) : (
          <input autoFocus type="text" value={tempVal} onChange={e => setTempVal(e.target.value)}
            onBlur={save} onKeyDown={e => e.key === "Enter" && save()}
            className={`flex-1 bg-black/50 border border-blue-500/50 rounded-lg px-2 py-1 text-white focus:outline-none ${className}`} />
        )}
      </div>
    );
  }
  return (
    <div className={`group flex items-start gap-2 relative min-w-0 w-full ${className}`}>
      <span className={`min-w-0 flex-1 ${isTextArea ? "whitespace-pre-wrap" : "truncate"}`}>{value}</span>
      <button onClick={() => setIsEditing(true)} title="Editar"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#86868b] hover:text-white p-1 rounded hover:bg-white/10 shrink-0">
        <Edit2 size={12} />
      </button>
    </div>
  );
}

// ── Per-User AI Generation State ─────────────────────────────────────────────

type UserGenState = "idle" | "loading" | "done" | "error";

// ── Bell Chime (Web Audio API — no external file needed) ─────────────────────

function playBellChime() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Two-tone chime: fundamental + high harmonic
    const notes = [
      { freq: 880, delay: 0,    dur: 1.4 },
      { freq: 1108, delay: 0.12, dur: 1.1 },
      { freq: 1320, delay: 0.26, dur: 0.9 },
    ];

    notes.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      // Bell envelope: instant attack, exponential decay
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    });

    // Close context after chime ends
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Audio not supported — fail silently
  }
}

// ── Format Hours (supports fractional hours → shows minutes) ─────────────────

function formatHours(h: number): string {
  if (h <= 0) return "0h";
  const wholeHours = Math.floor(h);
  const minutes = Math.round((h - wholeHours) * 60);
  if (wholeHours === 0 && minutes > 0) return `${minutes}min`;
  if (minutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h${minutes.toString().padStart(2, "0")}`;
}

/** Round to nearest 0.5h step */
function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

// ── Editable Hours Badge ─────────────────────────────────────────────────────

function EditableHoursBadge({
  hours, onRedistribute, color = "purple", size = "sm"
}: {
  hours: number;
  onRedistribute: (newTotal: number) => void;
  color?: "purple" | "blue" | "slate" | "muted";
  size?: "sm" | "xs";
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState("");
  const hasSavedRef = React.useRef(false);

  const colorMap = {
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-200", focus: "focus:border-purple-400", hover: "hover:bg-purple-500/20 hover:border-purple-500/40" },
    blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-200",   focus: "focus:border-blue-400",   hover: "hover:bg-blue-500/20 hover:border-blue-500/40" },
    slate:  { bg: "bg-white/10",      border: "border-white/10",      text: "text-slate-300",  focus: "focus:border-slate-400", hover: "hover:bg-white/15 hover:border-white/20" },
    muted:  { bg: "bg-white/5",       border: "border-white/5",       text: "text-slate-400",  focus: "focus:border-slate-400", hover: "hover:bg-white/10 hover:border-white/15" },
  };
  const c = colorMap[color];
  const sizeClasses = size === "xs" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    hasSavedRef.current = false;
    setTempVal(String(hours));
    setIsEditing(true);
  };

  const handleSave = () => {
    // Guard: prevent double-fire from Enter → blur sequence
    if (hasSavedRef.current) { setIsEditing(false); return; }
    hasSavedRef.current = true;

    const newValue = parseFloat(tempVal);
    if (!isNaN(newValue) && newValue >= 0 && Math.abs(newValue - hours) > 0.01) {
      onRedistribute(newValue);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <input
          autoFocus
          type="text"
          value={tempVal}
          onChange={e => setTempVal(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } if (e.key === "Escape") { hasSavedRef.current = true; setIsEditing(false); } }}
          className={`w-16 ${sizeClasses} ${c.bg} border ${c.border} ${c.text} ${c.focus} rounded font-mono font-semibold text-center outline-none transition-colors`}
          placeholder="0"
        />
        <span className={`text-xs ${c.text} font-medium`}>h</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      title="Clique para redistribuir horas"
      className={`${sizeClasses} ${c.bg} rounded font-semibold ${c.text} border ${c.border} ${c.hover} transition-all cursor-pointer group/badge relative`}
    >
      {formatHours(hours)}
      <Edit2 size={9} className="inline-block ml-1 opacity-0 group-hover/badge:opacity-70 transition-opacity -mt-0.5" />
    </button>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [scope, setScope] = useState<CompleteScope | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Per-user generation state
  const [userGenState, setUserGenState] = useState<Record<string, UserGenState>>({});
  const [userStreamText, setUserStreamText] = useState<Record<string, string>>({});
  const [userGenError, setUserGenError] = useState<Record<string, string>>({});
  const userContentRef = React.useRef<Record<string, string>>({});

  // Client feedback system
  type ClientFeedback = { id: string; screenId: string; screenTitle: string; moduleName: string; text: string; author?: string; date: string; read: boolean };
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([]);
  const [feedbackPanelOpen, setFeedbackPanelOpen] = useState(false);
  const [feedbackModalScreen, setFeedbackModalScreen] = useState<{ id: string; title: string } | null>(null);

  // Fetch real client feedbacks from API
  const loadFeedbacks = React.useCallback(async (proposalId: string) => {
    try {
      const res = await api<ClientFeedback[]>(`/api/assembler/proposals/${proposalId}/feedback`);
      if (res.success && res.data && Array.isArray(res.data)) {
        setFeedbacks(res.data);
      }
    } catch {
      // Feedbacks not available — no-op
    }
  }, []);

  const getScreenFeedbacks = (screenIdOrComposite: string | null, screenTitle?: string) => {
    if (!screenIdOrComposite) return [];
    const ids = screenIdOrComposite.split('|');
    return feedbacks.filter(f => {
      if (ids.includes(f.screenId)) return true;
      // Fallback: match by screen title (mobile sends synthetic IDs like scr_0)
      if (screenTitle && f.screenTitle && f.screenTitle.toLowerCase().trim() === screenTitle.toLowerCase().trim()) return true;
      return false;
    });
  };
  const unreadCount = feedbacks.filter(f => !f.read).length;
  const markAsRead = async (feedbackId: string) => {
    const prevFeedbacks = [...feedbacks];
    setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, read: true } : f));
    if (scope?.id && !scope.id.startsWith("draft_") && !scope.id.startsWith("scope_")) {
      try {
        const res = await api(`/api/assembler/proposals/${scope.id}/feedback/read`, {
          method: "PATCH", body: { feedbackIds: [feedbackId] }
        });
        if (!res || !res.success) throw new Error("API call failed");
      } catch (e) {
        console.error("Failed to mark feedback as read:", e);
        toast.error("Falha ao marcar feedback como lido.");
        setFeedbacks(prevFeedbacks); // Rollback
      }
    }
  };

  const markBatchAsRead = async (feedbackIdsToMark: string[]) => {
    if (feedbackIdsToMark.length === 0) return;
    const prevFeedbacks = [...feedbacks];
    const idsSet = new Set(feedbackIdsToMark);
    setFeedbacks(prev => prev.map(f => idsSet.has(f.id) ? { ...f, read: true } : f));
    if (scope?.id && !scope.id.startsWith("draft_") && !scope.id.startsWith("scope_")) {
      try {
        const res = await api(`/api/assembler/proposals/${scope.id}/feedback/read`, {
          method: "PATCH", body: { feedbackIds: feedbackIdsToMark }
        });
        if (!res || !res.success) throw new Error("API call failed");
      } catch (e) {
        console.error("Failed to mark batch as read:", e);
        toast.error("Falha ao salvar a leitura das mensagens.");
        setFeedbacks(prevFeedbacks); // Rollback
      }
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = feedbacks.filter(f => !f.read).map(f => f.id);
    if (unreadIds.length === 0) return;
    const prevFeedbacks = [...feedbacks];
    setFeedbacks(prev => prev.map(f => ({ ...f, read: true })));
    if (scope?.id && !scope.id.startsWith("draft_") && !scope.id.startsWith("scope_")) {
      try {
        const res = await api(`/api/assembler/proposals/${scope.id}/feedback/read`, {
          method: "PATCH", body: { feedbackIds: unreadIds }
        });
        if (!res || !res.success) throw new Error("API call failed");
      } catch (e) {
        console.error("Failed to mark all as read:", e);
        toast.error("Falha ao marcar todas como lidas.");
        setFeedbacks(prevFeedbacks); // Rollback
      }
    }
  };

  // Track which screen to highlight after navigation
  const [highlightScreenId, setHighlightScreenId] = useState<string | null>(null);

  // Navigate to a screen by expanding its tree path + scroll with retries
  const navigateToScreen = (screenIdOrComposite: string, feedbackScreenTitle?: string) => {
    if (!scope) return;
    const targetIds = screenIdOrComposite.split('|');

    for (let uIdx = 0; uIdx < scope.users.length; uIdx++) {
      const user = scope.users[uIdx];
      for (let pIdx = 0; pIdx < user.platforms.length; pIdx++) {
        const plat = user.platforms[pIdx];
        for (let mIdx = 0; mIdx < plat.modules.length; mIdx++) {
          const mod = plat.modules[mIdx];
          for (let sIdx = 0; sIdx < mod.screens.length; sIdx++) {
            const screen = mod.screens[sIdx];
            // Match by exact ID, structural ID, or screen title (fallback for mobile-generated IDs)
            const matchById = targetIds.includes(screen.id) || targetIds.includes(`s-${uIdx}-${pIdx}-${mIdx}-${sIdx}`);
            const matchByTitle = feedbackScreenTitle && screen.title.toLowerCase().trim() === feedbackScreenTitle.toLowerCase().trim();

            if (matchById || matchByTitle) {
              // Close overlays first
              setFeedbackPanelOpen(false);
              setFeedbackModalScreen(null);

              // Expand full tree path in one batch
              setExpandedNodes(prev => ({
                ...prev,
                [`u${uIdx}`]: true,
                [`u${uIdx}p${pIdx}`]: true,
                [`u${uIdx}p${pIdx}m${mIdx}`]: true,
                [`u${uIdx}p${pIdx}m${mIdx}s${sIdx}`]: true,
              }));

              const actualDomId = `screen-${screen.id}`;

              // Set highlight
              setHighlightScreenId(screen.id);
              setTimeout(() => setHighlightScreenId(null), 3000);

              // Retry scroll — tree needs multiple renders to cascade open
              let attempts = 0;
              const tryScroll = () => {
                const el = document.getElementById(actualDomId);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  return;
                }
                attempts++;
                if (attempts < 15) {
                  requestAnimationFrame(() => setTimeout(tryScroll, 100));
                }
              };
              // Start trying after a short delay for React state to flush
              setTimeout(tryScroll, 50);

              toast.success(`Navegando para: ${screen.title}`);
              return;
            }
          }
        }
      }
    }
    toast.error("Tela não encontrada no escopo atual.");
  };


  // ── Load draft on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const draft = loadScopeDraft();
    if (!draft) {
      router.push("/dashboard/crm/assembler/new");
      return;
    }
    setScope(draft);
    // Expand all users by default
    const exp: Record<string, boolean> = {};
    draft.users.forEach((_, i) => { exp[`u${i}`] = true; });
    setExpandedNodes(exp);
    // Load real feedbacks from API if this is a saved proposal (has a real UUID id)
    if (draft.id && !draft.id.startsWith("scope_") && !draft.id.startsWith("draft_")) {
      loadFeedbacks(draft.id);
    }
  }, [router, loadFeedbacks]);

  // ── Per-user AI Generation (one platform at a time) ─────────────────────

  const handleGenerateUser = async (userId: string) => {
    if (!scope) return;
    const userIdx = scope.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return;
    const targetUser = scope.users[userIdx];
    const platforms = targetUser.platforms;

    // Mark user as loading
    setUserGenState(prev => ({ ...prev, [userId]: "loading" }));
    setUserStreamText(prev => ({ ...prev, [userId]: "" }));
    setUserGenError(prev => ({ ...prev, [userId]: "" }));

    // We'll accumulate platforms one by one
    let accumulatedUser: ScopeUserNode = { ...targetUser, platforms: [] };
    let accumulatedIntegrations: CompleteScope["integrations"] = [...(scope.integrations ?? [])];

    for (let pIdx = 0; pIdx < platforms.length; pIdx++) {
      const platform = platforms[pIdx];
      const platKey = `${userId}_p${pIdx}`;

      // Single-platform payload
      const payload: CompleteScope = {
        ...scope,
        mode: "scope_user",
        users: [{
          ...targetUser,
          platforms: [platform],
        }],
      };

      userContentRef.current[platKey] = "";

      // Label the stream to show progress
      setUserStreamText(prev => ({
        ...prev,
        [userId]: `[Gerando plataforma ${pIdx + 1}/${platforms.length}: ${platform.platformName}]\n`,
      }));

      // Wrap SSE in a Promise so we can await it
      await new Promise<void>((resolve, reject) => {
        generateFullScope(
          payload,
          (chunk) => {
            userContentRef.current[platKey] = (userContentRef.current[platKey] || "") + chunk;
            setUserStreamText(prev => ({
              ...prev,
              [userId]: `[${pIdx + 1}/${platforms.length}] ${platform.platformName}\n` + userContentRef.current[platKey].slice(-600),
            }));
          },
          () => {
            // Platform done — parse and merge
            try {
              const md = userContentRef.current[platKey] || "";
              const parsedSingle = parseMarkdownToScope(md, payload);
              const parsedPlatform = parsedSingle.users[0]?.platforms[0];

              // DEBUG: trace per-platform parsing results
              const funcCount = parsedPlatform?.modules.reduce((a, m) => a + m.screens.reduce((b, s) => b + s.functionalities.length, 0), 0) ?? 0;
              const hoursSum = parsedPlatform?.modules.reduce((a, m) => a + m.screens.reduce((b, s) => b + s.functionalities.reduce((c, f) => c + (f.estimatedHours || 0), 0), 0), 0) ?? 0;
              console.log(`[ASSEMBLER] Platform ${pIdx + 1}/${platforms.length} "${platform.platformName}"`, {
                mdLength: md.length,
                rawUsersFound: parsedSingle.users.length,
                parsedPlatform: parsedPlatform?.platformName,
                modulesCount: parsedPlatform?.modules.length ?? 0,
                totalFuncs: funcCount,
                totalHours: hoursSum,
                firstFuncSample: parsedPlatform?.modules[0]?.screens[0]?.functionalities[0],
              });

              if (parsedPlatform) {
                accumulatedUser = {
                  ...accumulatedUser,
                  platforms: [...accumulatedUser.platforms, parsedPlatform],
                };
              }

              // Accumulate integrations (deduplicate by title)
              if (parsedSingle.integrations && parsedSingle.integrations.length > 0) {
                const existing = new Set(accumulatedIntegrations.map(i => i.title.toLowerCase()));
                const newInteg = parsedSingle.integrations.filter(i => !existing.has(i.title.toLowerCase()));
                accumulatedIntegrations = [...accumulatedIntegrations, ...newInteg];
              }

              // Update scope progressively after each platform
              setScope(prev => {
                if (!prev) return prev;
                const updated = {
                  ...prev,
                  users: prev.users.map(u => u.id === userId ? accumulatedUser : u),
                  integrations: accumulatedIntegrations,
                };
                saveScopeDraft(updated);
                return updated;
              });

              resolve();
            } catch (e) {
              reject(e);
            }
          },
          (err) => reject(new Error(err))
        );
      }).catch((e) => {
        setUserGenError(prev => ({ ...prev, [userId]: `Erro na plataforma "${platform.platformName}": ` + (e as Error).message }));
        setUserGenState(prev => ({ ...prev, [userId]: "error" }));
      });

      // If an error was set, stop processing
      if (userContentRef.current[`${userId}_error`]) break;
    }

    // All platforms done — expand tree and finish
    setExpandedNodes(prev => {
      const exp = { ...prev, [`u${userIdx}`]: true };
      accumulatedUser.platforms.forEach((p, pi) => {
        exp[`u${userIdx}p${pi}`] = true;
        p.modules.forEach((m, mi) => {
          exp[`u${userIdx}p${pi}m${mi}`] = true;
        });
      });
      return exp;
    });

    setUserGenState(prev => ({ ...prev, [userId]: "done" }));
    setUserStreamText(prev => ({ ...prev, [userId]: "" }));
    playBellChime();
  };


  // ── Generate Integrations (full-scope context) ───────────────────────────

  const INTEG_KEY = "__integrations__";

  const handleGenerateIntegrations = () => {
    if (!scope) return;

    // Build a summary of all users and platforms for context
    const contextLines = scope.users.map(u =>
      `- Perfil: ${u.userName} | Plataformas: ${u.platforms.map(p => p.platformName).join(", ")}`
    ).join("\n");

    const integPayload: CompleteScope = {
      ...scope,
      mode: "scope_integrations",
      projectSummary:
        `${scope.projectSummary}\n\nEstrutura do projeto:\n${contextLines}\n\n` +
        `[INSTRUÇÃO ESPECIAL: Gere SOMENTE a seção ## Integrações com todas as APIs e serviços externos necessários para o projeto acima funcionar. Não gere Perfis, Plataformas nem Módulos.]`,
    };

    userContentRef.current[INTEG_KEY] = "";
    setUserGenState(prev => ({ ...prev, [INTEG_KEY]: "loading" }));
    setUserStreamText(prev => ({ ...prev, [INTEG_KEY]: "" }));
    setUserGenError(prev => ({ ...prev, [INTEG_KEY]: "" }));

    generateFullScope(
      integPayload,
      (chunk) => {
        userContentRef.current[INTEG_KEY] = (userContentRef.current[INTEG_KEY] || "") + chunk;
        setUserStreamText(prev => ({ ...prev, [INTEG_KEY]: (prev[INTEG_KEY] || "") + chunk }));
      },
      () => {
        try {
          const rawMd = userContentRef.current[INTEG_KEY] || "";
          // Parse only the integrations section
          const parsedSingle = parseMarkdownToScope(rawMd, { ...scope!, users: [], integrations: [] });
          const newIntegrations = parsedSingle.integrations || [];

          setScope(prev => {
            if (!prev) return prev;
            const existing = new Set((prev.integrations || []).map(i => i.title.toLowerCase()));
            const toAdd = newIntegrations.filter(i => !existing.has(i.title.toLowerCase()));
            const updated = { ...prev, integrations: [...(prev.integrations || []), ...toAdd] };
            saveScopeDraft(updated);
            return updated;
          });
          setUserGenState(prev => ({ ...prev, [INTEG_KEY]: "done" }));
          playBellChime();
        } catch (e) {
          setUserGenError(prev => ({ ...prev, [INTEG_KEY]: "Erro: " + (e as Error).message }));
          setUserGenState(prev => ({ ...prev, [INTEG_KEY]: "error" }));
        }
      },
      (err) => {
        setUserGenError(prev => ({ ...prev, [INTEG_KEY]: err }));
        setUserGenState(prev => ({ ...prev, [INTEG_KEY]: "error" }));
      }
    );
  };

  // ── Scope Helpers ────────────────────────────────────────────────────────

  const toggleNode = (id: string) => setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));

  const updateScope = (newScope: CompleteScope) => { setScope(newScope); saveScopeDraft(newScope); };

  const handleSave = async () => {
    if (!scope) return;
    saveScopeDraft(scope);
    try {
      const saved = await saveProposalToList(scope);
      // Always sync the local scope id with the DB id to guarantee subsequent saves use UPDATE
      const dbId = saved.id;
      if (dbId && dbId !== scope.id) {
        updateScope({ ...scope, id: dbId });
      }
      toast.success("Proposta salva com sucesso!");
    } catch (e: unknown) {
      const err = e as Error;
      console.error("Save Error:", err);
      toast.error(err?.message || "Erro ao salvar proposta.");
    }
  };

  const handlePresent = async () => {
    if (!scope) return;
    saveScopeDraft(scope);
    try {
      const saved = await saveProposalToList(scope);
      // Sync scope ID to prevent future duplicates
      const dbId = saved.id;
      if (dbId && dbId !== scope.id) {
        updateScope({ ...scope, id: dbId });
      }
      router.push(`/presentation?id=${saved.id}`);
    } catch { router.push("/presentation"); }
  };

  // ── Setters ───────────────────────────────────────────────────────────────

  // Safe immutable update helper
  const withScope = (fn: (s: CompleteScope) => CompleteScope) => {
    if (!scope) return;
    const next = fn(structuredClone(scope));
    setScope(next);
    saveScopeDraft(next);
  };

  const setUserName      = (uIdx: number, val: string) => withScope(s => { s.users[uIdx].userName = val; return s; });
  const setPlatformName  = (uIdx: number, pIdx: number, val: string) => withScope(s => { s.users[uIdx].platforms[pIdx].platformName = val; return s; });
  const setModuleTitle   = (uIdx: number, pIdx: number, mIdx: number, val: string) => withScope(s => { s.users[uIdx].platforms[pIdx].modules[mIdx].title = val; return s; });
  const setScreenTitle   = (uIdx: number, pIdx: number, mIdx: number, sIdx: number, val: string) => withScope(s => { s.users[uIdx].platforms[pIdx].modules[mIdx].screens[sIdx].title = val; return s; });
  const setScreenDesc    = (uIdx: number, pIdx: number, mIdx: number, sIdx: number, val: string) => withScope(s => { s.users[uIdx].platforms[pIdx].modules[mIdx].screens[sIdx].description = val; return s; });
  const setFuncTitle     = (uIdx: number, pIdx: number, mIdx: number, sIdx: number, fIdx: number, val: string) => withScope(s => { s.users[uIdx].platforms[pIdx].modules[mIdx].screens[sIdx].functionalities[fIdx].title = val; return s; });
  const setFuncDesc      = (uIdx: number, pIdx: number, mIdx: number, sIdx: number, fIdx: number, val: string) => withScope(s => { s.users[uIdx].platforms[pIdx].modules[mIdx].screens[sIdx].functionalities[fIdx].description = val; return s; });
  const setFuncHours     = (uIdx: number, pIdx: number, mIdx: number, sIdx: number, fIdx: number, val: string) => withScope(s => { s.users[uIdx].platforms[pIdx].modules[mIdx].screens[sIdx].functionalities[fIdx].estimatedHours = parseFloat(val) || 0; return s; });
  const setIntegrationTitle = (iIdx: number, val: string) => withScope(s => { s.integrations[iIdx].title = val; return s; });
  const setIntegrationDesc  = (iIdx: number, val: string) => withScope(s => { s.integrations[iIdx].description = val; return s; });
  const setIntegrationHours = (iIdx: number, val: string) => withScope(s => { s.integrations[iIdx].estimatedHours = parseFloat(val) || 0; return s; });

  // ── Add / Remove ──────────────────────────────────────────────────────────

  const genId = () => Math.random().toString(36).substring(2, 11);

  const addUser = () => {
    const s = { ...scope! };
    const newUserId = "u_" + genId();
    const newPlatId = "p_" + genId();
    s.users.push({
      id: newUserId,
      userName: "Novo Usuário",
      platforms: [{ id: newPlatId, platformName: "Nova Plataforma", objective: "", modules: [] }],
    });
    setExpandedNodes(prev => ({ ...prev, [`u${s.users.length - 1}`]: true }));
    updateScope(s);
  };
  const removeUser = async (uIdx: number) => { if (!(await confirm({ title: "Remover Usuário?", message: "Tem certeza que deseja remover este perfil?" }))) return; const s = { ...scope! }; s.users.splice(uIdx, 1); updateScope(s); };
  const removePlatform = async (uIdx: number, pIdx: number) => { if (!(await confirm({ title: "Remover Plataforma?", message: "Tem certeza que deseja remover?" }))) return; const s = { ...scope! }; s.users[uIdx].platforms.splice(pIdx, 1); updateScope(s); };
  const addModule = (uIdx: number, pIdx: number) => { const s = { ...scope! }; s.users[uIdx].platforms[pIdx].modules.push({ id: "m_" + genId(), title: "Novo Módulo", screens: [] }); const mIdx = s.users[uIdx].platforms[pIdx].modules.length - 1; setExpandedNodes(prev => ({ ...prev, [`u${uIdx}`]: true, [`u${uIdx}p${pIdx}`]: true, [`u${uIdx}p${uIdx}p${pIdx}m${mIdx}`]: true })); updateScope(s); };
  const removeModule = async (uIdx: number, pIdx: number, mIdx: number) => { if (!(await confirm({ title: "Remover Módulo?", message: "Remover este módulo?" }))) return; const s = { ...scope! }; s.users[uIdx].platforms[pIdx].modules.splice(mIdx, 1); updateScope(s); };
  const addScreen = (uIdx: number, pIdx: number, mIdx: number) => { const s = { ...scope! }; s.users[uIdx].platforms[pIdx].modules[mIdx].screens.push({ id: "s_" + genId(), title: "Nova Tela", description: "", functionalities: [] }); const sIdx = s.users[uIdx].platforms[pIdx].modules[mIdx].screens.length - 1; setExpandedNodes(prev => ({ ...prev, [`u${uIdx}p${pIdx}m${mIdx}s${sIdx}`]: true })); updateScope(s); };
  const removeScreen = async (uIdx: number, pIdx: number, mIdx: number, sIdx: number) => { if (!(await confirm({ title: "Remover Tela?", message: "Remover esta tela?" }))) return; const s = { ...scope! }; s.users[uIdx].platforms[pIdx].modules[mIdx].screens.splice(sIdx, 1); updateScope(s); };
  const addFunctionality = (uIdx: number, pIdx: number, mIdx: number, sIdx: number) => { const s = { ...scope! }; s.users[uIdx].platforms[pIdx].modules[mIdx].screens[sIdx].functionalities.push({ id: "f_" + genId(), title: "Nova Funcionalidade", description: "", estimatedHours: 0 }); updateScope(s); };
  const removeFunctionality = (uIdx: number, pIdx: number, mIdx: number, sIdx: number, fIdx: number) => { const s = { ...scope! }; s.users[uIdx].platforms[pIdx].modules[mIdx].screens[sIdx].functionalities.splice(fIdx, 1); updateScope(s); };
  const addIntegration = () => { const s = { ...scope! }; if (!s.integrations) s.integrations = []; s.integrations.push({ id: "i_" + genId(), title: "Nova Integração", description: "", estimatedHours: 0 }); updateScope(s); };
  const removeIntegration = (iIdx: number) => { const s = { ...scope! }; s.integrations.splice(iIdx, 1); updateScope(s); };

  // ── Rollups ────────────────────────────────────────────────────────────────

  const getScreenHours = (screen: { functionalities: { estimatedHours?: number }[] }) => screen.functionalities.reduce((a, f) => a + (f.estimatedHours || 0), 0);
  const getModuleHours = (mod: { screens: { functionalities: { estimatedHours?: number }[] }[] }) => mod.screens.reduce((a, s) => a + getScreenHours(s), 0);
  const getPlatformHours = (plat: { modules: { screens: { functionalities: { estimatedHours?: number }[] }[] }[] }) => plat.modules.reduce((a, m) => a + getModuleHours(m), 0);
  const getUserHours = (user: { platforms: { modules: { screens: { functionalities: { estimatedHours?: number }[] }[] }[] }[] }) => user.platforms.reduce((a, p) => a + getPlatformHours(p), 0);
  const getTotalHours = () => !scope ? 0 : scope.users.reduce((a, u) => a + getUserHours(u), 0) + (scope.integrations?.reduce((a, i) => a + (i.estimatedHours || 0), 0) ?? 0);

  // ── Proportional Redistribution ────────────────────────────────────────────

  /** Scale all functionalities under a user proportionally to hit newTotal */
  const redistributeUserHours = (uIdx: number, newTotal: number) => {
    withScope(s => {
      const user = s.users[uIdx];
      const current = getUserHours(user);
      if (current <= 0) return s;
      const ratio = newTotal / current;
      for (const p of user.platforms)
        for (const m of p.modules)
          for (const sc of m.screens)
            for (const f of sc.functionalities)
              f.estimatedHours = roundHalf((f.estimatedHours || 0) * ratio);
      return s;
    });
    toast.success(`Horas redistribuídas para ${formatHours(newTotal)}`);
  };

  /** Scale all functionalities under a platform */
  const redistributePlatformHours = (uIdx: number, pIdx: number, newTotal: number) => {
    withScope(s => {
      const plat = s.users[uIdx].platforms[pIdx];
      const current = getPlatformHours(plat);
      if (current <= 0) return s;
      const ratio = newTotal / current;
      for (const m of plat.modules)
        for (const sc of m.screens)
          for (const f of sc.functionalities)
            f.estimatedHours = roundHalf((f.estimatedHours || 0) * ratio);
      return s;
    });
    toast.success(`Horas redistribuídas para ${formatHours(newTotal)}`);
  };

  /** Scale all functionalities under a module */
  const redistributeModuleHours = (uIdx: number, pIdx: number, mIdx: number, newTotal: number) => {
    withScope(s => {
      const mod = s.users[uIdx].platforms[pIdx].modules[mIdx];
      const current = getModuleHours(mod);
      if (current <= 0) return s;
      const ratio = newTotal / current;
      for (const sc of mod.screens)
        for (const f of sc.functionalities)
          f.estimatedHours = roundHalf((f.estimatedHours || 0) * ratio);
      return s;
    });
    toast.success(`Horas redistribuídas para ${formatHours(newTotal)}`);
  };

  /** Scale all functionalities under a screen */
  const redistributeScreenHours = (uIdx: number, pIdx: number, mIdx: number, sIdx: number, newTotal: number) => {
    withScope(s => {
      const sc = s.users[uIdx].platforms[pIdx].modules[mIdx].screens[sIdx];
      const current = getScreenHours(sc);
      if (current <= 0) return s;
      const ratio = newTotal / current;
      for (const f of sc.functionalities)
        f.estimatedHours = roundHalf((f.estimatedHours || 0) * ratio);
      return s;
    });
    toast.success(`Horas redistribuídas para ${formatHours(newTotal)}`);
  };

  /** Scale ALL functionalities + integrations across entire project */
  const redistributeTotalHours = (newTotal: number) => {
    withScope(s => {
      const current = getTotalHours();
      if (current <= 0) return s;
      const ratio = newTotal / current;
      for (const u of s.users)
        for (const p of u.platforms)
          for (const m of p.modules)
            for (const sc of m.screens)
              for (const f of sc.functionalities)
                f.estimatedHours = roundHalf((f.estimatedHours || 0) * ratio);
      for (const i of s.integrations ?? [])
        i.estimatedHours = roundHalf((i.estimatedHours || 0) * ratio);
      return s;
    });
    toast.success(`Horas totais redistribuídas para ${formatHours(newTotal)}`);
  };

  // ── Loading skeleton while draft loads ───────────────────────────────────

  if (!scope) {
    return (
      <div className="relative min-h-screen bg-slate-900 flex items-center justify-center">
        <MatrixRain />
        <Loader2 size={32} className="relative z-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  const totalHours = getTotalHours();
  const hasEstimates = totalHours > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-slate-900 text-white selection:bg-blue-500/30 pb-32">
      <MatrixRain />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-3xl border-b border-slate-700/50">
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard/crm/assembler/new")}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50" title="Voltar">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">Editor de Proposta</h2>
              <p className="text-[11px] font-medium tracking-widest text-slate-500 uppercase">Geração por Usuário</p>
            </div>
          </div>

            <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/dashboard/crm/assembler/feedback-history/${scope.id}`)}
              className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors border border-slate-700/50 flex items-center gap-2">
              <Clock size={14} /> Histórico
            </button>
            {hasEstimates && (
              <div className="flex items-center gap-2 border-l border-slate-700/50 pl-3 ml-1">
                <Clock size={14} className="text-blue-400" />
                <EditableHoursBadge hours={totalHours} onRedistribute={redistributeTotalHours} color="blue" />
                <span className="text-xs text-blue-400/60 font-medium">total</span>
              </div>
            )}
            <button onClick={async () => { if (await confirm({ title: "Cancelar Edição?", message: "Dados não salvos serão perdidos.", confirmText: "Sair" })) router.push("/dashboard/crm/assembler"); }}
              className="px-4 py-2 rounded-full border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 font-semibold text-sm transition-colors flex items-center gap-2">
              <X size={14} /> Cancelar
            </button>
            <button onClick={handleSave}
              className="px-5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors flex items-center gap-2">
              <Save size={14} /> Salvar
            </button>
            <button onClick={() => window.open('/presentation-mestres', '_blank')}
              className="px-5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors flex items-center gap-2">
              <Sparkles size={14} /> Mestres
            </button>
            <button onClick={handlePresent}
              className="px-6 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,113,227,0.3)] flex items-center gap-2">
              <Presentation size={16} /> Proposta Online
            </button>
          </div>
        </div>
      </header>

      {/* Floating Feedback Button */}
      {feedbacks.filter(f => !f.read).length > 0 && (
        <button
          onClick={() => setFeedbackPanelOpen(true)}
          className="fixed bottom-8 right-8 z-[60] flex items-center gap-2.5 px-5 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] hover:scale-105 active:scale-95"
        >
          <MessageCircle size={18} />
          Feedback do Cliente
          {unreadCount > 0 && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-red-600 text-xs font-black animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      <main className="relative z-10 max-w-[1000px] mx-auto px-6 pt-12 space-y-6">

        {/* Project Title */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md">
          <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-3">Nome do Projeto</div>
          <EditableText value={scope.title || "Nova Proposta"} onChange={val => { const s = { ...scope }; s.title = val; updateScope(s); }} className="text-xl font-semibold text-white tracking-tight" />
        </div>

        {/* Project Summary */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md">
          <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-3">Resumo Global do Projeto</div>
          <EditableText value={scope.projectSummary || ""} onChange={val => { const s = { ...scope }; s.projectSummary = val; updateScope(s); }} className="text-slate-200 leading-relaxed text-sm" isTextArea />
        </div>

        {/* Users */}
        {scope.users.map((user, uIdx) => {
          const uId = `u${uIdx}`;
          const isUExp = !!expandedNodes[uId];
          const genState = userGenState[user.id] ?? "idle";
          const isLoading = genState === "loading";
          const isDone = genState === "done";
          const hasModules = user.platforms.some(p => p.modules.length > 0);

          return (
            <div key={user.id + uIdx} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-md">
              {/* User Header */}
              <div className={`p-6 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors ${isUExp ? "border-b border-white/[0.05]" : ""}`} onClick={() => toggleNode(uId)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDone ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400"}`}>
                  {isDone ? <CheckCircle2 size={20} /> : <Users size={20} />}
                </div>

                <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                  <div className="text-[10px] font-bold tracking-[0.2em] text-purple-400 uppercase mb-1">Usuário / Perfil</div>
                  <EditableText value={user.userName} onChange={val => setUserName(uIdx, val)} className="text-2xl font-semibold text-white" />
                </div>

                {hasEstimates && isUExp && (
                  <div onClick={e => e.stopPropagation()}>
                    <EditableHoursBadge hours={getUserHours(user)} onRedistribute={(v) => redistributeUserHours(uIdx, v)} color="purple" />
                  </div>
                )}

                {/* 🎯 GERAR IA POR USUÁRIO */}
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleGenerateUser(user.id)}
                    disabled={isLoading}
                    title={hasModules ? "Regerar escopo deste usuário" : "Gerar escopo deste usuário com IA"}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all border ${
                      isLoading
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-400 cursor-wait"
                        : hasModules
                        ? "bg-white/5 border-white/10 text-[#86868b] hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400"
                        : "bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    }`}
                  >
                    {isLoading ? (
                      <><Loader2 size={14} className="animate-spin" /> Gerando...</>
                    ) : (
                      <><Sparkles size={14} /> {hasModules ? "Regerar IA" : "Gerar IA"}</>
                    )}
                  </button>
                  <button onClick={() => removeUser(uIdx)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Remover Usuário"><Trash2 size={16} /></button>
                </div>

                <div className="text-[#86868b] ml-2">{isUExp ? <ChevronDown size={24} /> : <ChevronRight size={24} />}</div>
              </div>

              {/* Stream preview while loading */}
              {isLoading && userStreamText[user.id] && (
                <div className="px-6 py-4 border-b border-purple-500/10 bg-purple-500/5">
                  <pre className="text-xs text-purple-300/70 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                    {userStreamText[user.id].split("\n").slice(-15).join("\n")}
                    <span className="animate-pulse bg-purple-500 w-1.5 h-3 inline-block ml-1" />
                  </pre>
                </div>
              )}

              {/* Error */}
              {genState === "error" && userGenError[user.id] && (
                <div className="px-6 py-3 border-b border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
                  <X size={14} /> {userGenError[user.id]}
                </div>
              )}

              {/* Empty state — prompt to generate */}
              {isUExp && !isLoading && !hasModules && (
                <div className="p-8 flex flex-col items-center gap-3 text-center border-b border-white/[0.03]">
                  <Sparkles size={28} className="text-purple-400/40" />
                  <p className="text-sm text-[#86868b]">Clique em <strong className="text-purple-300">Gerar IA</strong> para criar o escopo deste usuário automaticamente.</p>
                </div>
              )}

              {/* Platforms */}
              {isUExp && hasModules && (
                <div className="p-6 pt-2 space-y-4">
                  {user.platforms.map((plat, pIdx) => {
                    const pId = `u${uIdx}p${pIdx}`;
                    const isPExp = !!expandedNodes[pId];
                    return (
                      <div key={pId} className="bg-slate-900/60 border border-slate-700/40 rounded-xl overflow-hidden">
                        <div className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.03] transition-colors ${isPExp ? "border-b border-white/[0.05]" : ""}`} onClick={() => toggleNode(pId)}>
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400"><Smartphone size={16} /></div>
                          <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                            <div className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">Plataforma</div>
                            <EditableText value={plat.platformName} onChange={val => setPlatformName(uIdx, pIdx, val)} className="text-lg font-medium text-[#f5f5f7]" />
                          </div>
                          {hasEstimates && isPExp && <div onClick={e => e.stopPropagation()}><EditableHoursBadge hours={getPlatformHours(plat)} onRedistribute={(v) => redistributePlatformHours(uIdx, pIdx, v)} color="blue" /></div>}
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => removePlatform(uIdx, pIdx)} className="w-7 h-7 flex items-center justify-center rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Remover"><Trash2 size={14} /></button>
                          </div>
                          <div className="text-[#86868b] ml-4">{isPExp ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
                        </div>

                        {/* Modules */}
                        {isPExp && (
                          <div className="p-4 space-y-4">
                            {plat.modules.map((mod, mIdx) => {
                              const mId = `u${uIdx}p${pIdx}m${mIdx}`;
                              const isMExp = !!expandedNodes[mId];
                              return (
                                <div key={mId} className="bg-slate-800/30 rounded-xl overflow-hidden border border-slate-700/30">
                                  <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/[0.04] group" onClick={() => toggleNode(mId)}>
                                    <Layers size={16} className="text-[#86868b]" />
                                    <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                                      <EditableText value={mod.title} onChange={val => setModuleTitle(uIdx, pIdx, mIdx, val)} className="text-base font-semibold" />
                                    </div>
                                    {hasEstimates && isMExp && <div onClick={e => e.stopPropagation()}><EditableHoursBadge hours={getModuleHours(mod)} onRedistribute={(v) => redistributeModuleHours(uIdx, pIdx, mIdx, v)} color="slate" size="xs" /></div>}
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => removeModule(uIdx, pIdx, mIdx)} className="p-1.5 rounded hover:bg-red-500/20 text-[#86868b] hover:text-red-400 transition-colors" title="Remover"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="text-[#86868b]">{isMExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</div>
                                  </div>

                                  {/* Screens */}
                                  {isMExp && (
                                    <div className="pl-4 pr-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                                      {mod.screens.map((screen, sIdx) => {
                                        const sId = `u${uIdx}p${pIdx}m${mIdx}s${sIdx}`;
                                        const isSExp = !!expandedNodes[sId];
                                        const structuralId = `s-${uIdx}-${pIdx}-${mIdx}-${sIdx}`;
                                        const compositeId = `${screen.id}|${structuralId}`;
                                        const screenFeedbacks = getScreenFeedbacks(compositeId, screen.title);
                                        const hasUnread = screenFeedbacks.some(f => !f.read);
                                        return (
                                          <div key={sId} id={`screen-${screen.id}`} className={`bg-slate-900/70 rounded-lg border transition-all duration-500 ${highlightScreenId === screen.id ? 'shadow-[0_0_0_2px_rgba(239,68,68,0.6),0_0_20px_rgba(239,68,68,0.3)] border-red-500 scale-[1.01]' : (screenFeedbacks.length > 0 ? 'border-red-500/30 ring-1 ring-red-500/10' : 'border-slate-700/30')}`}>
                                            <div className="p-3 flex items-start gap-3 cursor-pointer hover:bg-white/[0.04] group" onClick={() => toggleNode(sId)}>
                                              <Layout size={14} className="text-[#a1a1a6] mt-1 shrink-0" />
                                              <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                                                <EditableText value={screen.title} onChange={val => setScreenTitle(uIdx, pIdx, mIdx, sIdx, val)} className="text-sm font-semibold text-[#f5f5f7]" />
                                                <EditableText value={screen.description} onChange={val => setScreenDesc(uIdx, pIdx, mIdx, sIdx, val)} className="text-xs text-[#86868b] mt-1" isTextArea />
                                              </div>
                                              {hasEstimates && isSExp && <div onClick={e => e.stopPropagation()}><EditableHoursBadge hours={getScreenHours(screen)} onRedistribute={(v) => redistributeScreenHours(uIdx, pIdx, mIdx, sIdx, v)} color="muted" size="xs" /></div>}

                                              {/* Client feedback badge — always visible when feedback exists */}
                                              {screenFeedbacks.length > 0 && (
                                                <button
                                                  onClick={e => { e.stopPropagation(); setFeedbackModalScreen({ id: compositeId, title: screen.title }); markBatchAsRead(screenFeedbacks.map(f => f.id)); }}
                                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                                                    hasUnread
                                                      ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                                                      : 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:bg-green-500/20'
                                                  }`}
                                                  title={`${screenFeedbacks.length} feedback(s) do cliente`}
                                                >
                                                  <MessageCircle size={11} />
                                                  {screenFeedbacks.length}
                                                </button>
                                              )}

                                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => removeScreen(uIdx, pIdx, mIdx, sIdx)} className="p-1 rounded hover:bg-red-500/20 text-[#555] hover:text-red-400 transition-colors" title="Remover"><Trash2 size={14} /></button>
                                              </div>
                                              <div className="text-[#555]">{isSExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</div>
                                            </div>

                                            {/* Functionalities */}
                                            {isSExp && (
                                              <div className="pl-10 pr-3 pb-3 space-y-2 border-t border-white/5 pt-2">
                                                {screen.functionalities.map((func, fIdx) => (
                                                  <div key={fIdx} className="group relative flex gap-3 p-2 rounded-md hover:bg-white/5 transition-colors">
                                                    <Activity size={12} className="text-blue-500/50 mt-1.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                      <EditableText value={func.title} onChange={val => setFuncTitle(uIdx, pIdx, mIdx, sIdx, fIdx, val)} className="text-xs font-semibold text-[#e5e5e5]" />
                                                      <EditableText value={func.description} onChange={val => setFuncDesc(uIdx, pIdx, mIdx, sIdx, fIdx, val)} className="text-[11px] text-[#86868b] leading-tight mt-1" isTextArea />
                                                    </div>
                                                    <div className="w-20 shrink-0 flex items-center justify-end gap-1">
                                                      <div className="flex items-center gap-1 bg-white/[0.08] px-2 py-1 rounded text-xs font-mono text-green-400">
                                                        <input type="text" maxLength={5} value={func.estimatedHours || 0} onChange={e => setFuncHours(uIdx, pIdx, mIdx, sIdx, fIdx, e.target.value)} className="w-10 bg-transparent outline-none text-right border-b border-transparent focus:border-green-400 transition-colors" title="Horas estimadas" placeholder="0" />
                                                        <span>h</span>
                                                      </div>
                                                      <button onClick={() => removeFunctionality(uIdx, pIdx, mIdx, sIdx, fIdx)} className="p-1 rounded hover:bg-red-500/20 text-[#555] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Remover funcionalidade"><Trash2 size={12} /></button>
                                                    </div>
                                                  </div>
                                                ))}
                                                <div className="pl-3 mt-2">
                                                  <button onClick={() => addFunctionality(uIdx, pIdx, mIdx, sIdx)} className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1.5 rounded transition-colors">
                                                    <Plus size={12} /> Adicionar Funcionalidade
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                      <div className="pt-2">
                                        <button onClick={() => addScreen(uIdx, pIdx, mIdx)} className="text-xs font-medium text-slate-400 hover:text-slate-300 flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-2 rounded-lg transition-colors border border-white/5">
                                          <Plus size={14} /> Adicionar Tela
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <div className="pt-2">
                              <button onClick={() => addModule(uIdx, pIdx)} className="text-sm font-medium text-[#86868b] hover:text-white flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl transition-colors">
                                <Plus size={14} /> Adicionar Módulo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Add User */}
        <div className="flex justify-center pt-2">
          <button onClick={addUser} className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/5 text-[#86868b] hover:text-white transition-all">
            <Plus size={16} /> Adicionar Novo Usuário
          </button>
        </div>

        {/* Integrations */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl overflow-hidden backdrop-blur-xl mt-8 mb-20">
          <div className="p-6 flex items-center gap-4 bg-white/[0.01] border-b border-white/[0.05]">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400"><LinkIcon size={20} /></div>
            <div className="flex-1">
              <div className="text-[10px] font-bold tracking-[0.2em] text-orange-400 uppercase mb-1">Global</div>
              <h3 className="text-2xl font-semibold text-white">Integrações Sistêmicas</h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Gerar IA para integrações */}
              <button
                onClick={handleGenerateIntegrations}
                disabled={userGenState[INTEG_KEY] === "loading"}
                title="Gerar integrações considerando todo o projeto"
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all border ${
                  userGenState[INTEG_KEY] === "loading"
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-400 cursor-wait"
                    : "bg-orange-500/20 border-orange-500/40 text-orange-300 hover:bg-orange-500/30 shadow-[0_0_15px_rgba(251,146,60,0.15)]"
                }`}
              >
                {userGenState[INTEG_KEY] === "loading" ? (
                  <><Loader2 size={14} className="animate-spin" /> Gerando...</>
                ) : (
                  <><Sparkles size={14} /> Gerar IA</>
                )}
              </button>
              <button onClick={addIntegration} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#86868b] hover:text-white transition-colors border border-white/10 font-medium text-sm">
                <Plus size={16} /> Adicionar
              </button>
            </div>
          </div>

          {/* Stream preview */}
          {userGenState[INTEG_KEY] === "loading" && userStreamText[INTEG_KEY] && (
            <div className="px-6 py-4 border-b border-orange-500/10 bg-orange-500/5">
              <pre className="text-xs text-orange-300/70 whitespace-pre-wrap max-h-32 overflow-y-auto font-mono">
                {userStreamText[INTEG_KEY].split("\n").slice(-8).join("\n")}
                <span className="animate-pulse bg-orange-500 w-1.5 h-3 inline-block ml-1" />
              </pre>
            </div>
          )}
          {userGenState[INTEG_KEY] === "error" && userGenError[INTEG_KEY] && (
            <div className="px-6 py-3 border-b border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
              <X size={14} /> {userGenError[INTEG_KEY]}
            </div>
          )}

          <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
            {(!scope.integrations || scope.integrations.length === 0) && userGenState[INTEG_KEY] !== "loading" && (
              <p className="col-span-2 text-center text-sm text-[#86868b] py-4">
                Clique em <strong className="text-orange-300">Gerar IA</strong> para gerar as integrações considerando todo o projeto.
              </p>
            )}
            {scope.integrations?.map((integ, iIdx) => (
              <div key={iIdx} className="bg-black/40 border border-white/[0.05] rounded-xl p-5 hover:border-white/20 transition-colors relative group pr-40">
                <EditableText value={integ.title} onChange={val => setIntegrationTitle(iIdx, val)} className="text-sm font-semibold text-[#f5f5f7] mb-2" />
                <EditableText value={integ.description} onChange={val => setIntegrationDesc(iIdx, val)} className="text-xs text-[#86868b] leading-relaxed" isTextArea />
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded text-xs font-mono text-orange-400">
                    <input type="text" maxLength={5} value={integ.estimatedHours || 0} onChange={e => setIntegrationHours(iIdx, e.target.value)} className="w-10 bg-transparent outline-none text-right border-b border-transparent focus:border-orange-400 transition-colors" title="Horas" placeholder="0" />
                    <span>h</span>
                  </div>
                  <button onClick={() => removeIntegration(iIdx)} className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Remover"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ═══ FEEDBACK PANEL (slide-in) ═══ */}
      {feedbackPanelOpen && (
        <div className="fixed inset-0 z-[70] flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setFeedbackPanelOpen(false)} />
          <div className="w-full max-w-[480px] bg-slate-900 border-l border-slate-700/50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <MessageCircle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Feedback do Cliente</h3>
                  <p className="text-[11px] text-slate-500">{feedbacks.length} comentário{feedbacks.length !== 1 ? 's' : ''} · {unreadCount} não lido{unreadCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50 flex items-center gap-1.5">
                    <Eye size={12} />
                    Marcar como lidas
                  </button>
                )}
                <button onClick={() => setFeedbackPanelOpen(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {Object.values(feedbacks.filter(f => !f.read).reduce((acc, fb) => {
                const key = fb.screenId || fb.screenTitle;
                if (!acc[key]) {
                  acc[key] = { screenId: fb.screenId, screenTitle: fb.screenTitle, moduleName: fb.moduleName, comments: [], latestDate: fb.date };
                }
                acc[key].comments.push(fb);
                return acc;
              }, {} as Record<string, { screenId: string; screenTitle: string; moduleName: string; comments: typeof feedbacks; latestDate: string }>))
              .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
              .map(g => {
                const screenUnreadIds = g.comments.map(c => c.id);
                return (
                  <div key={g.screenId} onClick={() => { navigateToScreen(g.screenId, g.screenTitle); markBatchAsRead(screenUnreadIds); }}
                    className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)] hover:bg-slate-800 hover:border-red-500/40 cursor-pointer transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Layout size={14} className="text-red-400" />
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate max-w-[200px]">{g.screenTitle}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{g.moduleName}</p>
                        </div>
                      </div>
                      <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-red-600/20 text-red-400 text-[10px] font-black border border-red-500/30">
                        {g.comments.length}
                      </span>
                    </div>
                    <div className="pl-6">
                      <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed">&quot;{g.comments[0].text}&quot;</p>
                      <div className="text-[9px] text-slate-500 mt-2">{new Date(g.latestDate).toLocaleString("pt-BR")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PER-SCREEN FEEDBACK MODAL ═══ */}
      {feedbackModalScreen && (() => {
        const screenFbs = getScreenFeedbacks(feedbackModalScreen.id, feedbackModalScreen.title);
        const screenTitle = screenFbs[0]?.screenTitle || "Tela";
        const moduleName = screenFbs[0]?.moduleName || "";
        return (
          <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFeedbackModalScreen(null)}>
            <div className="w-full max-w-lg bg-slate-900 border border-red-500/20 rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <MessageCircle size={16} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-red-400 uppercase tracking-[0.2em]">{moduleName}</p>
                    <h4 className="text-base font-bold text-white">{screenTitle}</h4>
                  </div>
                </div>
                <button onClick={() => setFeedbackModalScreen(null)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {screenFbs.map(fb => (
                  <div key={fb.id} className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <p className="text-[13px] text-slate-200 leading-relaxed">{fb.text}</p>
                    <p className="text-[10px] text-slate-500 mt-2">
                      {fb.author && <strong className="text-slate-400">{fb.author}</strong>}
                      {fb.author && " · "}
                      {fb.date ? new Date(fb.date).toLocaleString("pt-BR") : ""}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { navigateToScreen(feedbackModalScreen.id, screenTitle); setFeedbackModalScreen(null); }}
                className="mt-4 w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Eye size={14} />
                Navegar para esta tela
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
