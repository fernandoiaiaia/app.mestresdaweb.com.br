import { api } from "../../../../lib/api";

export type PlatformType =
  | "App Mobile (iOS & Android)"
  | "Software Web"
  | "Software Desktop"
  | "E-commerce"
  | "Website Institucional"
  | "Totem de Autoatendimento"
  | "API Back-End"
  | "Outro";

export interface UserDef {
  id: string;
  name: string;
  platforms: PlatformType[];
  platformSummary: Record<string, string>;
}

// ── Scope Hierarchy ───────────────────────────────────────────────────────────

export interface ScopeFunctionality {
  id: string;
  title: string;
  description: string;
  estimatedHours?: number;
}

export interface ScopeScreen {
  id: string;
  title: string;
  description: string;
  functionalities: ScopeFunctionality[];
}

export interface ScopeModule {
  id: string;
  title: string;
  screens: ScopeScreen[];
}

export interface ScopePlatform {
  id: string;
  platformName: string;
  objective?: string;
  modules: ScopeModule[];
}

export interface ScopeUserNode {
  id: string;
  userName: string;
  platforms: ScopePlatform[];
}

export interface ScopeIntegration {
  id: string;
  title: string;
  description: string;
  estimatedHours?: number;
}

export interface CompleteScope {
  id: string;
  title?: string;
  clientId?: string;
  dealId?: string;
  validityDays?: number;
  projectSummary?: string;
  users: ScopeUserNode[];
  integrations: ScopeIntegration[];
  createdAt: string;
  mode?: "scope" | "estimate" | "scope_user" | "scope_integrations";
}

// ── Auth Token (with auto-refresh) ────────────────────────────────────────────

async function getFreshToken(): Promise<string> {
  if (typeof window === "undefined") return "";

  const token = localStorage.getItem("accessToken");
  if (token) return token;

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return "";

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        success: boolean;
        data?: { accessToken: string; refreshToken: string };
      };
      if (data.success && data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        return data.data.accessToken;
      }
    }
  } catch { /* network error — fall through */ }

  return "";
}

// ── AI Generation (SSE Streaming) ────────────────────────────────────────────

/**
 * Streams a scope generation from the backend.
 * Calls onMessage for each text chunk, onComplete when done, onError on failure.
 */
export async function generateFullScope(
  payload: CompleteScope,
  onMessage: (text: string) => void,
  onComplete: () => void,
  onError: (err: string) => void
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
  const token = await getFreshToken();

  // Guard: schema requires at least one user
  const safePayload =
    payload.users.length === 0
      ? {
          ...payload,
          users: [
            {
              id: "__ctx__",
              userName: "Contexto",
              platforms: [{ id: "__p__", platformName: "Ver resumo do projeto", objective: "", modules: [] }],
            },
          ],
        }
      : payload;

  try {
    const res = await fetch(`${baseUrl}/api/assembler/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(safePayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      onError(`HTTP ${res.status}: ${errText}`);
      return;
    }

    if (!res.body) {
      onError("Sem corpo na resposta do servidor.");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let buffer = "";
    let currentEvent = "message";
    let completeFired = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;

      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed) {
            currentEvent = "message"; // reset at SSE message boundary
            continue;
          }
          if (trimmed.startsWith(":")) continue; // keepalive / comment

          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.slice(7).trim();
            continue;
          }

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr) as {
                text?: string;
                done?: boolean;
                message?: string;
                type?: string;
              };

              if (currentEvent === "error") {
                onError(parsed.message ?? "Erro desconhecido na geração.");
                done = true;
                break;
              }

              if ((currentEvent === "end" || parsed.done) && !completeFired) {
                completeFired = true;
                onComplete();
                done = true;
                break;
              }

              if (parsed.text) {
                onMessage(parsed.text);
              }
            } catch {
              // Incomplete JSON chunk — skip
            }
          }
        }
      }
    }

    if (!completeFired) onComplete();
  } catch (err) {
    onError((err as Error).message || "Erro de rede.");
  }
}

// ── Local Storage Draft Persistence ──────────────────────────────────────────

const LS = {
  SCOPE: "proposals_assembler_current_scope",
  USERS: "proposals_assembler_current_users",
  SUMMARY: "proposals_assembler_summary",
  META: "proposals_assembler_meta",
} as const;

export function saveScopeDraft(scope: CompleteScope): void {
  if (typeof window !== "undefined")
    localStorage.setItem(LS.SCOPE, JSON.stringify(scope));
}

export function loadScopeDraft(): CompleteScope | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS.SCOPE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CompleteScope;
    if (parsed) {
      parsed.users = parsed.users || [];
      parsed.integrations = parsed.integrations || [];
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveUsersDraft(users: UserDef[]): void {
  if (typeof window !== "undefined")
    localStorage.setItem(LS.USERS, JSON.stringify(users));
}

export function loadUsersDraft(): UserDef[] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS.USERS);
  return raw ? (JSON.parse(raw) as UserDef[]) : null;
}

export function saveProjectSummaryDraft(t: string): void {
  if (typeof window !== "undefined")
    localStorage.setItem(LS.SUMMARY, t);
}

export function loadProjectSummaryDraft(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LS.SUMMARY) ?? "";
}

export function saveProposalMetaDraft(meta: {
  clientId: string;
  dealId?: string;
  validityDays: number;
  title: string;
}): void {
  if (typeof window !== "undefined")
    localStorage.setItem(LS.META, JSON.stringify(meta));
}

export function loadProposalMetaDraft(): {
  clientId: string;
  dealId?: string;
  validityDays: number;
  title: string;
} | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS.META);
  return raw ? JSON.parse(raw) : null;
}

// ── API Persistence ───────────────────────────────────────────────────────────

interface ApiResponse<T> { success: boolean; data?: T }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSavedProposals(): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await api<any[]>("/api/assembler/proposals", { method: "GET" }) as ApiResponse<any[]>;
  return res.success && res.data ? res.data : [];
}


export async function saveProposalToList(scope: CompleteScope): Promise<CompleteScope> {
  // Determine if this is an update of an existing proposal
  const isUpdate =
    scope.id &&
    scope.id.length > 20 &&
    !scope.id.startsWith("scope_") &&
    !scope.id.startsWith("draft_");

  // Strip rawMeta (listing-injected metadata) to prevent recursive data bloat
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rawMeta, ...cleanScope } = scope as CompleteScope & { rawMeta?: unknown };

  if (isUpdate) {
    // UPDATE: PUT /api/assembler/proposals/:id — ID comes from the URL, not the body
    const res = await api<CompleteScope>(`/api/assembler/proposals/${scope.id}`, {
      method: "PUT",
      body: cleanScope,
    }) as ApiResponse<CompleteScope>;

    if (!res.success) {
      const errRes = res as any;
      throw new Error(errRes.message || errRes.error?.message || "Erro desconhecido ao salvar");
    }
    return res.data!;
  }

  // CREATE: POST /api/assembler/proposals — no ID in body
  const { id: _stripId, ...createPayload } = cleanScope;
  const res = await api<CompleteScope>("/api/assembler/proposals", {
    method: "POST",
    body: createPayload,
  }) as ApiResponse<CompleteScope>;

  if (!res.success) {
      const errRes = res as any;
      throw new Error(errRes.message || errRes.error?.message || "Erro desconhecido ao salvar");
  }

  return res.data!;
}

export async function deleteProposalFromList(id: string): Promise<void> {
  await api(`/api/assembler/proposals/${id}`, { method: "DELETE" });
}
