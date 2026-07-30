import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

/**
 * Avisa o Connech que o rodízio de leads mudou, pra ele resincronizar a equipe da
 * Mestres da Web (VendorAdvisorSyncWebhookController lá). Fire-and-forget — nunca
 * lança; se falhar, a sincronização manual/automática de "Minha equipe" no Connech
 * ainda corrige na próxima vez que alguém abrir a página.
 */
export async function notifyConnechTeamChanged(): Promise<void> {
    if (!env.ADVISOR_WEBHOOK_SECRET) return;
    try {
        const res = await fetch(`${env.CONNECH_API_URL}/api/v1/webhooks/advisor/team-sync`, {
            method: "POST",
            headers: { "x-advisor-secret": env.ADVISOR_WEBHOOK_SECRET },
            signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
            logger.warn({ status: res.status }, "[Connech] team-sync webhook falhou");
        }
    } catch (err) {
        logger.warn({ err }, "[Connech] Falha de rede ao notificar mudança de equipe");
    }
}
