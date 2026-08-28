import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { salesCadenceService } from "../sales-cadence/sales-cadence.service.js";
import { logger } from "../../lib/logger.js";
import { chatbotEngine } from "../chatbot/chatbot.engine.js";
import { classifySourceFromConversionInput } from "./deals.source-classifier.js";
import { contactIdentity } from "../../lib/contact-identity.js";
import {
    consolidateOpenDeals,
    enrichClientIdentity,
    lockContactIdentity,
    resolveClientByIdentity,
} from "../clients/clients.identity.js";

interface JwtUser {
    userId: string;
    role: string;
}

interface CreateDealDto {
    clientId: string;
    funnelId?: string;
    stageId?: string;
    consultantId: string;
    title: string;
    value?: number;
    probability?: number;
    tags?: string[];
    priority?: string;
    source?: string;
    temperature?: string;
    expectedClose?: string;
    nextAction?: string;
}

interface UpdateDealDto {
    title?: string;
    value?: number;
    probability?: number;
    status?: string;
    tags?: string[];
    assigneeIds?: string[];
    consultantId?: string;
    priority?: string;
    source?: string;
    temperature?: string;
    expectedClose?: string | null;
    nextAction?: string | null;
}

async function _resolveDefaultFunnel(userId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
    let funnel = await tx.funnel.findFirst({
        where: { userId, isDefault: true, active: true },
        include: { stages: { orderBy: { orderIndex: "asc" }, take: 1 } },
    });

    if (!funnel) {
        funnel = await tx.funnel.findFirst({
            where: { userId, active: true },
            include: { stages: { orderBy: { orderIndex: "asc" }, take: 1 } },
            orderBy: { createdAt: "asc" },
        });
    }

    if (!funnel || funnel.stages.length === 0) {
        // Último recurso. Duas conversões simultâneas num tenant recém-criado criariam
        // dois funis padrão e os leads iriam parar em pipelines diferentes, parecendo
        // duplicados. O lock só é pago neste caminho raro; o fluxo normal não espera.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`funnel|default|${userId}`})::bigint)`;

        const recheck = await tx.funnel.findFirst({
            where: { userId, active: true },
            include: { stages: { orderBy: { orderIndex: "asc" }, take: 1 } },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });
        if (recheck && recheck.stages.length > 0) return recheck;

        funnel = await tx.funnel.create({
            data: {
                userId,
                name: "Funil de Vendas",
                isDefault: true,
                active: true,
                stages: {
                    create: [
                        { name: "Novo Lead", orderIndex: 0 },
                        { name: "Em Negociação", orderIndex: 1 },
                        { name: "Proposta Enviada", orderIndex: 2 },
                        { name: "Fechado", orderIndex: 3 },
                    ],
                },
            },
            include: { stages: { orderBy: { orderIndex: "asc" }, take: 1 } },
        });
    }

    return funnel;
}

export interface UpsertDealByContactInput {
    userId: string;
    assignedUserId?: string | null;
    /**
     * Contato já conhecido pelo chamador (formulário em duas etapas). Entra na
     * resolução junto com o que for encontrado por e-mail/telefone; se houver mais de
     * um registro para a mesma pessoa, todos são unificados no mais antigo.
     */
    clientId?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    source: string;
    title?: string;
    value?: number | null;
    tags?: string[];
    message?: string | null;
    conversionUrl?: string | null;
    urlData?: string | null;
    projectType?: string | null;
    budget?: string | null;
    companyId?: string | null;
    companyName?: string | null;
    segment?: string | null;
    city?: string | null;
    state?: string | null;
    website?: string | null;
    role?: string | null;
    priority?: string | null;
    temperature?: string | null;
    expectedClose?: string | null;
    nextAction?: string | null;
}

export interface UpsertDealByContactResult {
    clientId: string;
    dealId: string;
    consultantId: string | null;
    isNewClient: boolean;
    isNewDeal: boolean;
    wasReactivated: boolean;
}

/**
 * Cria ou reaproveita um único negócio para um contato.
 *
 * O contato é identificado pelas chaves canônicas de lib/contact-identity.ts —
 * e-mail normalizado e telefone em E.164 — nunca pelo texto cru, e as requisições
 * concorrentes para a mesma pessoa são serializadas por advisory lock.
 *
 * Toda reconversão devolve o contato ao começo do funil: o negócio mais recente — aberto,
 * perdido ou ganho — volta para "open" na primeira etapa (MQL). Nunca se abre um segundo
 * card para quem já tem um; um contato tem no máximo um negócio aberto, sempre.
 * A reconversão fica registrada numa DealNote com os dados da conversão.
 */
export async function upsertDealByContact(
    input: UpsertDealByContactInput,
): Promise<UpsertDealByContactResult> {
    const identity = contactIdentity(input.email, input.phone);
    const rawPhone = input.phone?.trim() || null;

    // Client + Deal (+ DealNote) são criados atomicamente: se a criação do Deal falhar
    // por qualquer motivo (ex.: consultantId inválido), o Client também é desfeito em
    // vez de sobrar um contato órfão sem oportunidade na pipeline.
    const result = await prisma.$transaction(async (tx) => {
        await lockContactIdentity(tx, identity);

        const funnel = await _resolveDefaultFunnel(input.userId, tx);
        const firstStageId = funnel.stages[0].id;

        const existingClient = await resolveClientByIdentity(tx, identity, input.clientId);

        let clientId: string;
        let isNewClient = false;

        if (existingClient) {
            clientId = existingClient.id;
            await enrichClientIdentity(tx, existingClient, identity, rawPhone);
        } else {
            const created = await tx.client.create({
                data: {
                    userId: input.userId,
                    name: input.name.trim(),
                    email: identity.emailKey,
                    phone: rawPhone,
                    emailKey: identity.emailKey,
                    phoneKey: identity.phoneKey,
                    company: input.companyName?.trim() || null,
                    companyId: input.companyId || null,
                    source: input.source,
                    status: "new_lead",
                    segment: input.segment?.trim() || null,
                    city: input.city?.trim() || null,
                    state: input.state?.trim() || null,
                    website: input.website?.trim() || null,
                    role: input.role?.trim() || null,
                },
                select: { id: true },
            });
            clientId = created.id;
            isNewClient = true;
        }

        // Um contato pode chegar aqui já carregando mais de um card aberto, herdados de
        // antes desta correção. Unifica primeiro, para que o negócio reaproveitado logo
        // abaixo seja o único aberto que resta.
        await consolidateOpenDeals(tx, clientId);

        // O negócio em andamento tem precedência sobre o mais recente. Ordenar só por data
        // pegaria o card que a consolidação acabou de arquivar — ou um "ganho" recente ao
        // lado de um card aberto mais antigo — e reabri-lo devolveria a duplicata à pipeline.
        const dealSelect = { id: true, status: true, consultantId: true, stageId: true, funnelId: true };
        const existingDeal =
            (await tx.deal.findFirst({
                where: { clientId, status: "open" },
                orderBy: { createdAt: "desc" },
                select: dealSelect,
            })) ??
            (await tx.deal.findFirst({
                where: { clientId },
                orderBy: { createdAt: "desc" },
                select: dealSelect,
            }));

        const noteLines: string[] = [];
        if (input.message?.trim()) noteLines.push(`Mensagem: ${input.message.trim()}`);
        if (input.projectType?.trim()) noteLines.push(`Tipo de projeto: ${input.projectType.trim()}`);
        if (input.budget?.trim()) noteLines.push(`Faixa de investimento: ${input.budget.trim()}`);
        if (input.conversionUrl?.trim()) noteLines.push(`URL de conversão: ${input.conversionUrl.trim()}`);
        if (input.urlData?.trim()) noteLines.push(`Dados da URL: ${input.urlData.trim()}`);

        const noteContent = noteLines.length > 0
            ? `**Reconversão via ${input.source}**\n${noteLines.join("\n")}`
            : `**Reconversão via ${input.source}**`;

        let dealId: string;
        let isNewDeal = false;
        let consultantId: string | null;
        let stageIdForChatbot: string;
        let funnelIdForChatbot: string;

        if (existingDeal) {
            dealId = existingDeal.id;
            consultantId = existingDeal.consultantId;

            // Reconversão sempre devolve o negócio ao começo do funil, qualquer que fosse
            // o status anterior — inclusive um já ganho, que volta a ser trabalhado no
            // mesmo card em vez de gerar um segundo.
            const stageChanged = existingDeal.stageId !== firstStageId || existingDeal.funnelId !== funnel.id;
            const updateData: Prisma.DealUpdateInput = {
                status: "open",
                stage: { connect: { id: firstStageId } },
                funnel: { connect: { id: funnel.id } },
                lastActivity: `Novo contato recebido via ${input.source}`,
            };

            // O relógio de permanência na etapa só reinicia se a etapa de fato mudou.
            if (stageChanged) {
                updateData.stageEnteredAt = new Date();
            }

            if (typeof input.value === "number" && input.value > 0) {
                updateData.value = input.value;
            }

            // Uma reconversão pode carregar um sinal de campanha mais recente/melhor do
            // que o que originou o deal (ex.: 1ª conversão orgânica, reconversão meses
            // depois vinda de um clique pago real). Reclassifica a fonte só quando esta
            // reconversão de fato reconhece uma plataforma — nunca apaga uma fonte já
            // conhecida quando a reconversão não carrega nenhum sinal (ex.: reconversão
            // via WhatsApp direto, sem URL rastreável).
            const reconversionSource = classifySourceFromConversionInput(input.conversionUrl, input.urlData);
            if (reconversionSource) {
                updateData.source = reconversionSource;
            }

            await tx.deal.update({ where: { id: dealId }, data: updateData });

            await tx.dealNote.create({
                data: {
                    dealId,
                    userId: input.userId,
                    content: noteContent,
                    type: "system_event",
                },
            });

            stageIdForChatbot = firstStageId;
            funnelIdForChatbot = funnel.id;
        } else {
            // assignedUserId is expected to already be a validated, existing user id — the
            // round-robin resolver (lib/lead-assignment.service.ts) filters out stale/deleted
            // users before returning one, so consultantId here should never violate the FK.
            const assignedUserId = input.assignedUserId || input.userId;
            const classifiedSource = classifySourceFromConversionInput(input.conversionUrl, input.urlData);
            const deal = await tx.deal.create({
                data: {
                    userId: input.userId,
                    consultantId: assignedUserId,
                    assigneeIds: [assignedUserId],
                    clientId,
                    funnelId: funnel.id,
                    stageId: firstStageId,
                    title: input.title?.trim() || input.name.trim(),
                    source: classifiedSource || input.source,
                    tags: input.tags || [],
                    status: "open",
                    value: typeof input.value === "number" ? input.value : 0,
                    priority: input.priority || "low",
                    temperature: input.temperature || "cold",
                    expectedClose: input.expectedClose ? new Date(input.expectedClose) : null,
                    nextAction: input.nextAction?.trim() || null,
                },
                select: { id: true },
            });
            dealId = deal.id;
            isNewDeal = true;
            consultantId = assignedUserId;
            stageIdForChatbot = firstStageId;
            funnelIdForChatbot = funnel.id;

            if (noteLines.length > 0) {
                await tx.dealNote.create({
                    data: {
                        dealId,
                        userId: input.userId,
                        content: noteLines.join("\n"),
                        type: "note",
                    },
                });
            }
        }

        return {
            clientId,
            dealId,
            consultantId,
            isNewClient,
            isNewDeal,
            wasReactivated: !!existingDeal,
            funnelId: funnelIdForChatbot,
            stageId: stageIdForChatbot,
        };
    }, {
        // O advisory lock faz requisições concorrentes do mesmo contato esperarem a vez;
        // os 5s padrão do Prisma são apertados demais para uma rajada de reenvios.
        timeout: 20_000,
    });

    // Chatbot trigger runs only after the transaction has committed, and stays
    // fire-and-forget (onDealStageChange is idempotent per deal, safe on reactivation too).
    chatbotEngine.onDealStageChange(result.dealId, result.stageId, result.funnelId).catch((err: any) => {
        logger.error({ err, dealId: result.dealId, wasReactivated: result.wasReactivated }, "Error triggering chatbot from upsertDealByContact");
    });

    return {
        clientId: result.clientId,
        dealId: result.dealId,
        consultantId: result.consultantId,
        isNewClient: result.isNewClient,
        isNewDeal: result.isNewDeal,
        wasReactivated: result.wasReactivated,
    };
}

async function _checkDealAccess(id: string, user: JwtUser) {
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) throw new Error("Negócio não encontrado.");
    if (deal.userId === user.userId) return deal;
    
    const dbUser = await prisma.user.findUnique({ 
        where: { id: user.userId },
        include: { permissions: true }
    });
    if (dbUser?.role === 'OWNER') return deal;
    
    const allowedFunnels = (dbUser as any)?.allowedFunnels || [];
    if (deal.funnelId && allowedFunnels.length > 0 && !allowedFunnels.includes(deal.funnelId)) {
        throw new Error("Acesso negado ao funil.");
    }
    
    const pipelinePerm = dbUser?.permissions?.find((p: any) => p.module === "crm.pipeline" && p.action === "view");
    const oppsPerm = dbUser?.permissions?.find((p: any) => p.module === "crm.opportunities" && p.action === "view");
    
    const hasAllAccess = pipelinePerm?.dataScope === "ALL" || oppsPerm?.dataScope === "ALL";
    if (hasAllAccess) {
        return deal;
    }
    
    if (deal.consultantId === user.userId || deal.assigneeIds.includes(user.userId)) {
        return deal;
    }
    
    throw new Error("Acesso negado ao negócio. Você só pode visualizar seus próprios negócios.");
}

export const dealsService = {
    async list(user: JwtUser, query: { funnelId?: string; search?: string; consultantId?: string }) {
        const dbUser = await prisma.user.findUnique({ 
            where: { id: user.userId },
            include: { permissions: true }
        });

        const isOwner = dbUser?.role === "OWNER";

        // ─── Step 1: Determine Data Scope ───────────────────────────────────────
        // OWNER sees everything. Everyone else is subject to their permission matrix.
        let scopeFilter: any;

        if (isOwner) {
            // Owner sees all deals — no restriction
            scopeFilter = {};
        } else {
            const pipelinePerm = dbUser?.permissions?.find(
                (p: any) => p.module === "crm.pipeline" && p.action === "view"
            );
            const oppsPerm = dbUser?.permissions?.find(
                (p: any) => p.module === "crm.opportunities" && p.action === "view"
            );

            const hasAllAccess =
                pipelinePerm?.dataScope === "ALL" || oppsPerm?.dataScope === "ALL";

            if (hasAllAccess) {
                // User has "ALL" scope — they can see every deal in allowed funnels
                // But not limited to own deals
                scopeFilter = {};
            } else {
                // User has "OWN" scope — strictly only deals where they are the consultant or assignee
                scopeFilter = {
                    OR: [
                        { consultantId: user.userId },
                        { assigneeIds: { has: user.userId } }
                    ]
                };
            }
        }

        // ─── Step 2: Apply funnelId filter on top of scope ──────────────────────
        // For OWN scope users: funnelId is just an extra filter (show MY deals in that funnel)
        // For ALL scope users: funnelId restricts to only that funnel's deals
        const funnelFilter: any = query.funnelId
            ? { funnelId: query.funnelId }
            : {};

        // ─── Step 3: Search filter ───────────────────────────────────────────────
        const searchFilter: any = query.search
            ? { title: { contains: query.search, mode: "insensitive" } }
            : {};

        // ─── Step 3b: Consultant filter (for owner/manager filtering by team member) ───
        const consultantFilter: any = query.consultantId
            ? { OR: [{ consultantId: query.consultantId }, { assigneeIds: { has: query.consultantId } }] }
            : {};

        // ─── Step 4: Compose final where clause ─────────────────────────────────
        const whereClause: any = {
            ...funnelFilter,
            ...searchFilter,
        };

        // Combine OR-based filters (scopeFilter, consultantFilter) with AND
        const orConditions: any[] = [];
        if (scopeFilter.OR) orConditions.push({ OR: scopeFilter.OR });
        if (consultantFilter.OR) orConditions.push({ OR: consultantFilter.OR });

        const extraConditions: any[] = [];
        if (funnelFilter.funnelId) extraConditions.push(funnelFilter);
        if (searchFilter.title) extraConditions.push(searchFilter);

        if (orConditions.length > 0 || extraConditions.length > 0) {
            whereClause.AND = [...orConditions, ...extraConditions];
            delete whereClause.funnelId;
            delete whereClause.title;
        } else if (!scopeFilter.OR && !consultantFilter.OR) {
            // Simple case — no OR conditions, just merge
            Object.assign(whereClause, scopeFilter);
        }


        return prisma.deal.findMany({
            where: whereClause,
            include: {
                client: {
                    select: { id: true, name: true, email: true, company: true, phone: true }
                },
                consultant: {
                    select: { id: true, name: true, avatar: true }
                },
                stage: {
                    select: { id: true, name: true, color: true }
                },
                lossReason: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    async getById(id: string, user: JwtUser) {
        await _checkDealAccess(id, user);
        const deal = await prisma.deal.findUnique({
            where: { id },
            include: {
                client: {
                    select: { id: true, name: true, email: true, company: true, phone: true }
                },
                consultant: {
                    select: { id: true, name: true, avatar: true }
                },
                stage: {
                    select: { id: true, name: true, color: true }
                },
                funnel: {
                    select: {
                        id: true,
                        name: true,
                        stages: {
                            select: { id: true, name: true, color: true, orderIndex: true },
                            orderBy: { orderIndex: 'asc' }
                        }
                    }
                },
                notes: {
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                tasks: {
                    orderBy: { date: 'asc' }
                },
                lossReason: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!deal) {
            throw new Error("Negócio não encontrado.");
        }

        // Fetch proposals linked to the deal's client
        let clientProposals: { id: string; title: string; status: string; createdAt: Date }[] = [];
        if (deal.clientId) {
            clientProposals = await prisma.proposal.findMany({
                where: { clientId: deal.clientId, userId: user.userId },
                select: { id: true, title: true, status: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
            });
        }

        // Resolve assigneeIds into full user objects
        let assigneeIdsList = deal.assigneeIds;
        
        // If assigneeIds is empty but a consultant is assigned, auto-populate
        // so the detail page "Responsável" section stays in sync with the pipeline card
        if (assigneeIdsList.length === 0 && deal.consultantId) {
            assigneeIdsList = [deal.consultantId];
            // Persist the sync so it's consistent going forward
            await prisma.deal.update({
                where: { id },
                data: { assigneeIds: assigneeIdsList },
            });
        }

        const assignees = assigneeIdsList.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: assigneeIdsList } },
                select: { id: true, name: true, avatar: true },
            })
            : [];

        return { ...deal, assigneeIds: assigneeIdsList, assignees, clientProposals };
    },

    async create(data: CreateDealDto, user: JwtUser) {
        let funnelId = data.funnelId;
        let stageId = data.stageId;

        const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
        const allowedFunnels = (dbUser as any)?.allowedFunnels || [];

        if (!funnelId) {
            const defaultFunnel = await prisma.funnel.findFirst({
                where: { userId: user.userId, isDefault: true }
            });
            if (defaultFunnel) {
                funnelId = defaultFunnel.id;
            } else if (allowedFunnels.length > 0) {
                // If the user hasn't created a default funnel, but has allowed funnels, use the first allowed
                funnelId = allowedFunnels[0];
            }
        }

        if (!funnelId) {
            const anyFunnel = await prisma.funnel.findFirst({
                where: { userId: user.userId }
            });
            if (anyFunnel) {
                funnelId = anyFunnel.id;
            } else if (allowedFunnels.length > 0) {
                funnelId = allowedFunnels[0];
            }
        }
        
        if (!funnelId) throw new Error("Nenhum funil encontrado. Crie um primeiro.");

        if (!stageId) {
            const stage = await prisma.funnelStage.findFirst({
                where: { funnelId: funnelId },
                orderBy: { orderIndex: 'asc' }
            });
            if (!stage) throw new Error("Funil sem etapas válidas.");
            stageId = stage.id;
        }

        const deal = await prisma.deal.create({
            data: {
                ...data,
                assigneeIds: data.consultantId ? [data.consultantId] : [], // Populate assigneeIds to sync UI
                funnelId,
                stageId,
                userId: user.userId,
            },
            include: { client: true, consultant: true }
        });

        if (deal.clientId) {
            await prisma.assembledProposal.updateMany({
                where: { clientId: deal.clientId, dealId: null },
                data: { dealId: deal.id }
            });
        }

        // Trigger chatbot for the initial stage (non-blocking)
        chatbotEngine.onDealStageChange(deal.id, stageId, funnelId).catch(err => {
            logger.error({ err, dealId: deal.id, stageId }, "Error triggering chatbot for new deal");
        });
        return deal;
    },

    async update(id: string, data: UpdateDealDto, user: JwtUser) {
        await _checkDealAccess(id, user);

        // Keep consultantId in sync with the primary assigneeId so the pipeline card stays accurate
        if (data.assigneeIds !== undefined) {
            (data as any).consultantId = data.assigneeIds.length > 0 ? data.assigneeIds[0] : null;
        }

        const updated = await prisma.deal.update({
            where: { id },
            data,
            include: {
                client: { select: { id: true, name: true, email: true, company: true, phone: true } },
                consultant: { select: { id: true, name: true, avatar: true } },
                stage: { select: { id: true, name: true, color: true } },
                funnel: {
                    select: {
                        id: true,
                        name: true,
                        stages: {
                            select: { id: true, name: true, color: true, orderIndex: true },
                            orderBy: { orderIndex: 'asc' }
                        }
                    }
                },
                notes: {
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                tasks: { orderBy: { date: 'asc' } },
                lossReason: {
                    select: { id: true, name: true }
                }
            }
        });

        // Resolve assigneeIds → full user objects (keeps UI in sync after every update)
        const assignees = updated.assigneeIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: updated.assigneeIds } },
                select: { id: true, name: true, avatar: true },
            })
            : [];

        // Integrar com WhatsApp e Propostas: Sincronizar responsável
        if (data.assigneeIds !== undefined) {
            const primaryAssigneeId = data.assigneeIds.length > 0 ? data.assigneeIds[0] : null;

            if (primaryAssigneeId) {
                // 1. WhatsApp
                if (updated.clientId) {
                    const wContact = await prisma.whatsappContact.findFirst({
                        where: { clientId: updated.clientId }
                    });
                    
                    if (wContact) {
                        await prisma.whatsappConversation.updateMany({
                            where: { contactId: wContact.id },
                            data: { assigneeId: primaryAssigneeId }
                        });
                    }

                    // 2. Propostas Regulares
                    await prisma.proposal.updateMany({
                        where: { clientId: updated.clientId },
                        data: { userId: primaryAssigneeId }
                    });

                    // 3. Propostas AI (Assembled Proposals)
                    await prisma.assembledProposal.updateMany({
                        where: { 
                            OR: [
                                { clientId: updated.clientId },
                                { dealId: updated.id }
                            ]
                        },
                        data: { userId: primaryAssigneeId }
                    });
                }
            }
        }

        return { ...updated, assignees };
    },

    async updateStage(id: string, stageId: string, user: JwtUser) {
        await _checkDealAccess(id, user);
        const deal = await prisma.deal.update({
            where: { id },
            data: {
                stageId: stageId,
                stageEnteredAt: new Date()
            },
            include: { client: true, consultant: true }
        });

        // Trigger sales cadence for the new stage (non-blocking)
        salesCadenceService.triggerCadenceForDeal(id, stageId, user.userId).catch(err => {
            logger.error({ err, dealId: id, stageId }, "Error triggering sales cadence");
        });

        // Trigger chatbot engine for the new stage (non-blocking)
        chatbotEngine.onDealStageChange(id, stageId, deal.funnelId).catch(err => {
            logger.error({ err, dealId: id, stageId }, "Error triggering chatbot for deal stage change");
        });

        return deal;
    },

    async changeFunnel(id: string, funnelId: string, user: JwtUser) {
        const firstStage = await prisma.funnelStage.findFirst({
            where: { funnelId: funnelId },
            orderBy: { orderIndex: 'asc' }
        });

        if (!firstStage) {
            throw new Error("O novo funil não possui etapas válidas.");
        }

        await _checkDealAccess(id, user);
        const deal = await prisma.deal.update({
            where: { id },
            data: {
                funnelId: funnelId,
                stageId: firstStage.id,
                stageEnteredAt: new Date()
            },
            include: { client: true, consultant: true }
        });

        // Trigger chatbot for the new funnel/stage (non-blocking)
        chatbotEngine.onDealStageChange(id, firstStage.id, funnelId).catch(err => {
            logger.error({ err, dealId: id, funnelId }, "Error triggering chatbot for funnel change");
        });

        return deal;
    },

    async delete(id: string, user: JwtUser) {
        await _checkDealAccess(id, user);
        return prisma.deal.delete({
            where: { id }
        });
    },

    async addNote(dealId: string, data: { content: string, type?: string }, user: JwtUser) {
        // Verifica se o deal existe
        await this.getById(dealId, user);

        return prisma.dealNote.create({
            data: {
                dealId,
                userId: user.userId,
                content: data.content,
                type: data.type || "note"
            },
            include: { user: { select: { id: true, name: true, avatar: true } } }
        });
    },

    async getNotes(dealId: string, user: JwtUser) {
        // Verifica se o deal existe
        await this.getById(dealId, user);

        return prisma.dealNote.findMany({
            where: { dealId },
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
};
