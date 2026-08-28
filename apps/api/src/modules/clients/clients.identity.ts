import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import {
    CONTACT_DEDUPE_SCOPE,
    contactIdentity,
    identityLockKeys,
    type ContactIdentity,
} from "../../lib/contact-identity.js";

/**
 * Resolução de contato por identidade — a base compartilhada da deduplicação de leads.
 *
 * Todo canal de entrada resolve o contato por aqui para que a mesma pessoa não vire
 * dois registros só por ter chegado por caminhos diferentes.
 */

export interface IdentifiedClient {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    emailKey: string | null;
    phoneKey: string | null;
    createdAt: Date;
}

export const CLIENT_IDENTITY_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    emailKey: true,
    phoneKey: true,
    createdAt: true,
} as const;

/**
 * Trava as identidades deste contato até o fim da transação.
 *
 * Era aqui que a pipeline duplicava com mais frequência: a checagem "esse contato já
 * existe?" e a criação rodavam em transações concorrentes que, em READ COMMITTED, não
 * enxergam a linha ainda não commitada uma da outra. Duplo clique no formulário, retry
 * do n8n e reentrega da Meta produziam dois Clients e dois Deals. O advisory lock é
 * transacional: sai sozinho no commit ou no rollback.
 */
export async function lockContactIdentity(tx: Prisma.TransactionClient, identity: ContactIdentity) {
    for (const key of identityLockKeys(CONTACT_DEDUPE_SCOPE, identity)) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key})::bigint)`;
    }
}

/**
 * Procura um contato pela identidade, sem alterar nada. Serve para checagens — o
 * cadastro manual usa isto para avisar que o contato já existe em vez de criar o
 * segundo. Fluxos de entrada de lead devem usar resolveClientByIdentity, que além de
 * encontrar também unifica registros separados.
 */
export async function findClientByIdentity(
    tx: Prisma.TransactionClient,
    identity: ContactIdentity,
): Promise<IdentifiedClient | null> {
    const or: Prisma.ClientWhereInput[] = [];
    if (identity.emailKey) or.push({ emailKey: identity.emailKey });
    if (identity.phoneKey) or.push({ phoneKey: identity.phoneKey });
    if (or.length === 0) return null;

    const candidates = await tx.client.findMany({
        where: { OR: or, mergedIntoId: null },
        select: CLIENT_IDENTITY_SELECT,
        orderBy: { createdAt: "asc" },
        take: 1,
    });
    return candidates[0] ?? null;
}

/**
 * Funde contatos que se revelaram a mesma pessoa, mantendo o mais antigo.
 *
 * Só é chamada quando dois registros compartilham e-mail ou telefone canônico, o que
 * não deixa margem para dúvida. Tudo que apontava para os duplicados passa a apontar
 * para o que fica, então nenhum histórico se perde na operação.
 */
export async function consolidateDuplicateClients(
    tx: Prisma.TransactionClient,
    keepId: string,
    dropIds: string[],
) {
    if (dropIds.length === 0) return;

    await tx.deal.updateMany({ where: { clientId: { in: dropIds } }, data: { clientId: keepId } });
    await tx.clientContact.updateMany({ where: { clientId: { in: dropIds } }, data: { clientId: keepId } });
    await tx.task.updateMany({ where: { clientId: { in: dropIds } }, data: { clientId: keepId } });
    await tx.proposal.updateMany({ where: { clientId: { in: dropIds } }, data: { clientId: keepId } });
    await tx.assembledProposal.updateMany({ where: { clientId: { in: dropIds } }, data: { clientId: keepId } });

    // whatsapp_contacts.client_id é UNIQUE: no máximo um contato do WhatsApp pode
    // apontar para o que fica. Se ele ainda não tem nenhum, adota o primeiro.
    const keepHasWhatsapp = await tx.whatsappContact.findFirst({ where: { clientId: keepId }, select: { id: true } });
    const orphans = await tx.whatsappContact.findMany({ where: { clientId: { in: dropIds } }, select: { id: true } });
    for (const [i, wa] of orphans.entries()) {
        const adopt = i === 0 && !keepHasWhatsapp;
        await tx.whatsappContact.update({ where: { id: wa.id }, data: { clientId: adopt ? keepId : null } });
    }

    // O contato repetido é arquivado, nunca excluído: aponta para o que ficou e sai das
    // listagens e da deduplicação, mas continua no banco e consultável. Uma fusão errada
    // se desfaz limpando este campo.
    await tx.client.updateMany({
        where: { id: { in: dropIds } },
        data: { mergedIntoId: keepId },
    });

    // Os negócios que acabaram de mudar de dono podem deixar o contato com vários cards
    // abertos — que é justamente a duplicata visível na pipeline.
    await consolidateOpenDeals(tx, keepId);
}

/** Motivo de perda usado para arquivar cards duplicados sem apagá-los. */
export const DUPLICATE_LOSS_REASON = "Duplicado";

async function _duplicateLossReasonId(tx: Prisma.TransactionClient, userId: string, funnelId: string) {
    const existing = await tx.lossReason.findFirst({
        where: { userId, name: DUPLICATE_LOSS_REASON },
        select: { id: true },
    });
    if (existing) return existing.id;

    const created = await tx.lossReason.create({
        data: {
            userId,
            funnelId,
            name: DUPLICATE_LOSS_REASON,
            description: "Card unificado em outro negócio do mesmo contato.",
        },
        select: { id: true },
    });
    return created.id;
}

/**
 * Reduz a um só os negócios abertos de um contato — sem apagar nenhum.
 *
 * Fica aberto o mais avançado no funil (empate: o mais antigo), porque é ele que carrega
 * o trabalho de vendas já feito. Notas, arquivos, tarefas, propostas e execuções de
 * cadência dos demais migram para ele, e o card que fica herda o maior valor e a união
 * das tags. Os outros são marcados como perdidos com o motivo "Duplicado" e uma nota
 * apontando para o card que os absorveu: saem da pipeline, continuam no banco, e
 * desfazer é só reabrir. Nada é excluído.
 */
export async function consolidateOpenDeals(tx: Prisma.TransactionClient, clientId: string) {
    const open = await tx.deal.findMany({
        where: { clientId, status: "open" },
        select: {
            id: true,
            userId: true,
            funnelId: true,
            value: true,
            tags: true,
            createdAt: true,
            stage: { select: { orderIndex: true } },
        },
    });
    if (open.length <= 1) return;

    const ranked = [...open].sort((a, b) => {
        const byStage = (b.stage?.orderIndex ?? 0) - (a.stage?.orderIndex ?? 0);
        return byStage !== 0 ? byStage : a.createdAt.getTime() - b.createdAt.getTime();
    });
    const [keep, ...drops] = ranked;
    const dropIds = drops.map((d) => d.id);

    await tx.dealNote.updateMany({ where: { dealId: { in: dropIds } }, data: { dealId: keep.id } });
    await tx.dealFile.updateMany({ where: { dealId: { in: dropIds } }, data: { dealId: keep.id } });
    await tx.task.updateMany({ where: { dealId: { in: dropIds } }, data: { dealId: keep.id } });
    await tx.assembledProposal.updateMany({ where: { dealId: { in: dropIds } }, data: { dealId: keep.id } });
    await tx.salesCadenceExecution.updateMany({ where: { dealId: { in: dropIds } }, data: { dealId: keep.id } });

    await tx.deal.update({
        where: { id: keep.id },
        data: {
            tags: [...new Set([...keep.tags, ...drops.flatMap((d) => d.tags)])],
            value: Math.max(keep.value, ...drops.map((d) => d.value)),
        },
    });

    const lossReasonId = await _duplicateLossReasonId(tx, keep.userId, keep.funnelId);

    await tx.deal.updateMany({
        where: { id: { in: dropIds } },
        data: {
            status: "lost",
            lossReasonId,
            lastActivity: `Card unificado no negócio ${keep.id}`,
        },
    });

    for (const drop of drops) {
        await tx.dealNote.create({
            data: {
                dealId: drop.id,
                userId: drop.userId,
                type: "system_event",
                content: `**Card duplicado** — unificado no negócio ${keep.id}, que recebeu o histórico deste. Para desfazer, reabra este card e devolva o conteúdo.`,
            },
        });
    }
}

/**
 * Resolve o contato desta identidade, fundindo na hora os registros que porventura já
 * estejam separados.
 *
 * O caso que exige isso: um lead entra pelo WhatsApp trazendo só telefone enquanto
 * outro entra pelo formulário trazendo só e-mail. As duas identidades são disjuntas,
 * travam chaves diferentes e nenhuma das duas tem como saber que se trata da mesma
 * pessoa — só um contato posterior, trazendo os dois dados juntos, revela a ligação.
 * Quando ela aparece, os registros são unificados em vez de continuarem lado a lado.
 */
export async function resolveClientByIdentity(
    tx: Prisma.TransactionClient,
    identity: ContactIdentity,
    pinnedClientId?: string | null,
): Promise<IdentifiedClient | null> {
    const or: Prisma.ClientWhereInput[] = [];
    if (identity.emailKey) or.push({ emailKey: identity.emailKey });
    if (identity.phoneKey) or.push({ phoneKey: identity.phoneKey });

    // Contatos já arquivados por uma fusão anterior ficam de fora: seus negócios e
    // histórico foram para o principal, e reencontrá-los só refaria trabalho.
    const found = or.length > 0
        ? await tx.client.findMany({ where: { OR: or, mergedIntoId: null }, select: CLIENT_IDENTITY_SELECT })
        : [];

    const byId = new Map(found.map((c) => [c.id, c]));

    // O contato indicado pelo chamador (passo 1 do formulário público) entra na disputa
    // mesmo que ainda não tenha chave nenhuma gravada.
    if (pinnedClientId && !byId.has(pinnedClientId)) {
        const pinned = await tx.client.findUnique({
            where: { id: pinnedClientId },
            select: { ...CLIENT_IDENTITY_SELECT, mergedIntoId: true },
        });
        if (pinned && !pinned.mergedIntoId) {
            byId.set(pinned.id, pinned);
        } else if (pinned?.mergedIntoId) {
            // O contato do passo 1 já foi absorvido por outro; segue-se o ponteiro para
            // que o negócio caia no registro que de fato representa a pessoa hoje.
            const target = await tx.client.findUnique({
                where: { id: pinned.mergedIntoId },
                select: CLIENT_IDENTITY_SELECT,
            });
            if (target) byId.set(target.id, target);
        }
    }

    if (byId.size === 0) return null;

    // Mais antigo primeiro: consolida no registro original. Preferir o mais recente fazia
    // cada conversão nova grudar na última duplicata e, quando essa duplicata ainda não
    // tinha negócio, abrir mais um card — a bola de neve que multiplicava os leads.
    const [keep, ...drops] = [...byId.values()].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    await consolidateDuplicateClients(tx, keep.id, drops.map((d) => d.id));
    return keep;
}

/**
 * Completa lacunas do contato existente sem sobrescrever o que ele já tem.
 * Um lead vindo do WhatsApp entra só com telefone; quando a mesma pessoa preenche o
 * formulário com e-mail, gravar esse e-mail faz o próximo contato dela ser reconhecido
 * por qualquer um dos dois caminhos.
 */
export async function enrichClientIdentity(
    tx: Prisma.TransactionClient,
    existing: IdentifiedClient,
    identity: ContactIdentity,
    rawPhone: string | null,
) {
    const patch: Prisma.ClientUpdateInput = {};

    if (identity.emailKey && !existing.emailKey) {
        patch.emailKey = identity.emailKey;
        if (!existing.email) patch.email = identity.emailKey;
    }
    if (identity.phoneKey && !existing.phoneKey) {
        patch.phoneKey = identity.phoneKey;
        if (!existing.phone && rawPhone) patch.phone = rawPhone;
    }

    if (Object.keys(patch).length > 0) {
        await tx.client.update({ where: { id: existing.id }, data: patch });
    }
}

export interface UpsertClientInput {
    userId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    companyId?: string | null;
    source?: string | null;
    status?: string;
}

/**
 * Resolve o contato sem tocar em oportunidade — usado pelo passo 1 do formulário
 * público, onde ainda não se sabe se o visitante vai concluir o preenchimento.
 */
export async function upsertClientByContact(
    input: UpsertClientInput,
): Promise<{ clientId: string; isNewClient: boolean }> {
    const identity = contactIdentity(input.email, input.phone);
    const rawPhone = input.phone?.trim() || null;

    return prisma.$transaction(async (tx) => {
        await lockContactIdentity(tx, identity);

        const existing = await resolveClientByIdentity(tx, identity);
        if (existing) {
            await enrichClientIdentity(tx, existing, identity, rawPhone);
            return { clientId: existing.id, isNewClient: false };
        }

        const created = await tx.client.create({
            data: {
                userId: input.userId,
                name: input.name.trim(),
                email: identity.emailKey,
                phone: rawPhone,
                emailKey: identity.emailKey,
                phoneKey: identity.phoneKey,
                company: input.company?.trim() || null,
                companyId: input.companyId || null,
                source: input.source || null,
                status: input.status || "new_lead",
            },
            select: { id: true },
        });
        return { clientId: created.id, isNewClient: true };
    }, { timeout: 20_000 });
}
