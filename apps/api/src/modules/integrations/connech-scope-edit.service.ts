import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { notificationFeedService } from "../notifications/notification-feed.service.js";
import type { ConnechScopeEditRequest } from "./connech-scope-edit.schemas.js";

export class DealNotFoundError extends Error {}
export class ProposalNotFoundError extends Error {}

/**
 * Recebe um pedido de mudança de escopo feito pelo cliente no Connech e o
 * registra no mesmo canal "clientFeedback" já usado pelo portal do cliente do
 * advisor (AssemblerService.addScreenFeedback) — assim ele aparece no painel
 * de feedback do editor sem precisar de nenhuma UI nova.
 */
export async function recordConnechScopeEditRequest(dealId: string, payload: ConnechScopeEditRequest) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { id: true } });
    if (!deal) throw new DealNotFoundError(`Deal ${dealId} não encontrado`);

    const proposal = await prisma.assembledProposal.findFirst({
        where: { dealId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, userId: true, scopeData: true },
    });
    if (!proposal) throw new ProposalNotFoundError(`Nenhuma proposta/escopo encontrado para o deal ${dealId}`);

    const scopeData = (proposal.scopeData as Record<string, unknown>) || {};
    const feedbacks = ((scopeData.clientFeedback as unknown[]) || []) as Record<string, unknown>[];

    // Idempotência: reenvios do Connech (retry da fila) carregam o mesmo requestId.
    const existing = feedbacks.find((f) => f.connechRequestId === payload.requestId);
    if (existing) {
        return { taskId: existing.id as string, duplicate: true };
    }

    const feedback = {
        id: `connech_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        screenId: "connech-request",
        screenTitle: "Solicitação de mudança via Connech",
        moduleName: "Connech",
        text: payload.message,
        author: payload.clientName,
        date: payload.requestedAt,
        read: false,
        source: "connech",
        connechRequestId: payload.requestId,
        connechOpportunityId: payload.opportunityId,
    };

    feedbacks.push(feedback);

    await prisma.assembledProposal.update({
        where: { id: proposal.id },
        data: {
            scopeData: { ...scopeData, clientFeedback: feedbacks } as unknown as Prisma.JsonObject,
        },
    });

    await notificationFeedService.create({
        userId: proposal.userId,
        type: "comment",
        title: "Cliente solicitou mudança no escopo (Connech)",
        description: `${payload.clientName}: ${payload.message}`,
        dealId,
        metadata: { proposalId: proposal.id },
    }).catch(() => {});

    return { taskId: feedback.id, duplicate: false };
}
