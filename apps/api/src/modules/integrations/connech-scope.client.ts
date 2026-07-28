import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

// ── Shapes ────────────────────────────────────────────────────────────────────
// Espelha o inboundScopeSchema do Connech (Connech-main/packages/contracts/src/scope.ts).
// Sem `id` e sem `estimatedHours` em lugar nenhum — fornecedores nunca podem ver
// horas/valores internos.

interface RawFunctionality { title?: string; description?: string }
interface RawScreen { title?: string; description?: string; functionalities?: RawFunctionality[] }
interface RawModule { title?: string; screens?: RawScreen[] }
interface RawPlatform { platformName?: string; objective?: string; modules?: RawModule[] }
interface RawUser { userName?: string; platforms?: RawPlatform[] }
interface RawIntegration { title?: string; description?: string }
interface RawScopeData {
    users?: RawUser[];
    integrations?: RawIntegration[];
}

export interface InboundFunctionality { title: string; description: string }
export interface InboundScreen { title: string; description: string; functionalities: InboundFunctionality[] }
export interface InboundModule { title: string; screens: InboundScreen[] }
export interface InboundPlatform { platformName: string; objective: string; modules: InboundModule[] }
export interface InboundUser { userName: string; platforms: InboundPlatform[] }
export interface InboundIntegration { title: string; description: string }
export interface InboundScope { users: InboundUser[]; integrations: InboundIntegration[] }

export class EmptyScopeError extends Error {
    constructor() {
        super("O escopo está vazio. Gere ao menos um perfil antes de publicar.");
        this.name = "EmptyScopeError";
    }
}

const truncate = (v: string | undefined | null, max: number) => (v ?? "").trim().slice(0, max);

/**
 * Transforma o scopeData salvo (mesmo shape do CompleteScope do frontend, com
 * id/description/estimatedHours) no payload que o Connech aceita — por allowlist
 * campo a campo, nunca por blocklist. Aplica os limites do zod do Connech
 * (title min(1)/max(300), userName max(200), platformName max(120),
 * description/objective max(2000)) para não devolver um 422 silencioso.
 */
export function toInboundScope(scopeData: unknown): InboundScope {
    const data = (scopeData ?? {}) as RawScopeData;

    const users: InboundUser[] = (data.users ?? [])
        .map((u): InboundUser | null => {
            const userName = truncate(u.userName, 200);
            if (!userName) return null;

            const platforms: InboundPlatform[] = (u.platforms ?? []).map((p): InboundPlatform => ({
                platformName: truncate(p.platformName, 120),
                objective: truncate(p.objective, 2000),
                modules: (p.modules ?? [])
                    .map((m): InboundModule | null => {
                        const title = truncate(m.title, 300);
                        if (!title) return null;
                        return {
                            title,
                            screens: (m.screens ?? [])
                                .map((s): InboundScreen | null => {
                                    const sTitle = truncate(s.title, 300);
                                    if (!sTitle) return null;
                                    return {
                                        title: sTitle,
                                        description: truncate(s.description, 2000),
                                        functionalities: (s.functionalities ?? [])
                                            .map((f): InboundFunctionality | null => {
                                                const fTitle = truncate(f.title, 300);
                                                if (!fTitle) return null;
                                                return { title: fTitle, description: truncate(f.description, 2000) };
                                            })
                                            .filter((f): f is InboundFunctionality => f !== null),
                                    };
                                })
                                .filter((s): s is InboundScreen => s !== null),
                        };
                    })
                    .filter((m): m is InboundModule => m !== null),
            }));

            return { userName, platforms };
        })
        .filter((u): u is InboundUser => u !== null);

    const integrations: InboundIntegration[] = (data.integrations ?? [])
        .map((i): InboundIntegration | null => {
            const title = truncate(i.title, 300);
            if (!title) return null;
            return { title, description: truncate(i.description, 2000) };
        })
        .filter((i): i is InboundIntegration => i !== null);

    if (users.length === 0) throw new EmptyScopeError();

    return { users, integrations };
}

// ── Transport ─────────────────────────────────────────────────────────────────

export type ConnechPublishOutcome =
    | { ok: true; duplicate: false; opportunityId: string; version: number }
    | { ok: true; duplicate: true; version: number }
    | {
          ok: false;
          code: "INVALID_SECRET" | "DEAL_NOT_FOUND" | "SCOPE_LOCKED" | "INVALID_PAYLOAD" | "NETWORK_ERROR" | "NOT_CONFIGURED" | "UNEXPECTED";
          message: string;
          issues?: unknown;
      };

/**
 * Envia o escopo já transformado para o webhook de entrada do Connech
 * (POST /api/v1/webhooks/advisor/scope). Sem retry automático — o Connech
 * dedup por hash do escopo, então um reenvio manual é seguro.
 */
export async function sendScopeToConnech(dealId: string, scope: InboundScope): Promise<ConnechPublishOutcome> {
    if (!env.ADVISOR_WEBHOOK_SECRET) {
        return { ok: false, code: "NOT_CONFIGURED", message: "ADVISOR_WEBHOOK_SECRET não configurado no servidor." };
    }

    let res: Response;
    try {
        res = await fetch(`${env.CONNECH_API_URL}/api/v1/webhooks/advisor/scope`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-advisor-secret": env.ADVISOR_WEBHOOK_SECRET,
            },
            body: JSON.stringify({ dealId, sentAt: new Date().toISOString(), scope }),
            signal: AbortSignal.timeout(15_000),
        });
    } catch (err) {
        logger.warn({ dealId, err }, "[Connech] Falha de rede ao publicar escopo");
        return { ok: false, code: "NETWORK_ERROR", message: "Não foi possível conectar ao Connech agora. Verifique se a API do Connech está no ar e tente novamente." };
    }

    const body = await res.json().catch(() => ({}) as Record<string, unknown>);

    if (res.status === 200) {
        logger.info({ dealId, status: res.status, duplicate: !!body.duplicate }, "[Connech] Escopo publicado");
        if (body.duplicate) return { ok: true, duplicate: true, version: body.version as number };
        return { ok: true, duplicate: false, opportunityId: body.opportunityId as string, version: body.version as number };
    }

    const codeMap: Record<number, ConnechPublishOutcome & { ok: false }> = {
        401: { ok: false, code: "INVALID_SECRET", message: "Falha de autenticação com o Connech. Verifique ADVISOR_WEBHOOK_SECRET." },
        404: { ok: false, code: "DEAL_NOT_FOUND", message: `O Connech não encontrou este negócio (dealId ${dealId}).` },
        409: { ok: false, code: "SCOPE_LOCKED", message: "Esta oportunidade já avançou no Connech e não aceita mais alterações de escopo." },
        422: { ok: false, code: "INVALID_PAYLOAD", message: "O Connech rejeitou o escopo enviado.", issues: body.issues },
    };

    const mapped = codeMap[res.status] ?? { ok: false as const, code: "UNEXPECTED" as const, message: `Resposta inesperada do Connech (HTTP ${res.status}).` };
    logger.warn({ dealId, status: res.status, code: mapped.code }, "[Connech] Publicação falhou");
    return mapped;
}
