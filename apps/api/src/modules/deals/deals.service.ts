import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { salesCadenceService } from "../sales-cadence/sales-cadence.service.js";
import { logger } from "../../lib/logger.js";
import { chatbotEngine } from "../chatbot/chatbot.engine.js";
import { classifySourceFromConversionInput } from "./deals.source-classifier.js";

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

// Normalize contact identifiers for deduplication
function normalizeEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    return String(email).trim().toLowerCase();
}

function normalizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
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
        // Auto-create a default funnel as last resort
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

/**
 * Creates or reactivates a single Deal for a given contact.
 * Deduplication rule: same e-mail AND same phone (both filled).
 * If a matching Client is found, the most recent Deal is reused:
 *   - status becomes "open"
 *   - stage moves to the default funnel's first stage
 *   - a system_event DealNote is added with conversion metadata
 * If no matching Client/Deal exists, a new Client + Deal are created.
 * In both cases, chatbotEngine.onDealStageChange is fired for the first stage.
 */
export async function upsertDealByContact(input: UpsertDealByContactInput) {
    const cleanEmail = normalizeEmail(input.email);
    const cleanPhone = normalizePhone(input.phone);

    // Client + Deal (+ DealNote) are created atomically: if Deal creation fails for any
    // reason (e.g. an invalid consultantId), the Client insert rolls back too instead of
    // leaving an orphan Contact with no Opportunity in the pipeline.
    const result = await prisma.$transaction(async (tx) => {
        const funnel = await _resolveDefaultFunnel(input.userId, tx);
        const firstStageId = funnel.stages[0].id;

        // Dedup by e-mail OR by the last-10-digit phone suffix — tolerant of country-code
        // (+55) and punctuation differences between submissions. Matches the exact heuristic
        // already proven for consultant-affinity routing (lib/lead-assignment.service.ts), so a
        // lead recognized as "the same person" there is also recognized as the same person here,
        // instead of spawning a new Client/Deal every time the phone is typed slightly differently.
        const phoneSuffix = cleanPhone && cleanPhone.length >= 8 ? cleanPhone.slice(-10) : null;
        let existingClient: { id: string; name: string } | null = null;

        const orConditions: any[] = [];
        if (cleanEmail) orConditions.push({ email: cleanEmail });
        if (phoneSuffix) {
            const clientsByPhone = await tx.$queryRaw<Array<{ id: string }>>`
                SELECT id FROM clients
                WHERE user_id = ${input.userId}
                  AND phone IS NOT NULL
                  AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${"%" + phoneSuffix}
            `;
            if (clientsByPhone.length > 0) {
                orConditions.push({ id: { in: clientsByPhone.map((c) => c.id) } });
            }
        }

        if (orConditions.length > 0) {
            const candidates = await tx.client.findMany({
                where: { userId: input.userId, OR: orConditions },
                select: { id: true, name: true },
                orderBy: { createdAt: "desc" },
            });
            existingClient = candidates[0] || null;
        }

        let clientId: string;
        let isNewClient = false;

        if (existingClient) {
            clientId = existingClient.id;
        } else {
            const created = await tx.client.create({
                data: {
                    userId: input.userId,
                    name: input.name.trim(),
                    email: cleanEmail,
                    phone: input.phone?.trim() || null,
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

        // Find the most recent deal for this client (any status/funnel)
        const existingDeal = await tx.deal.findFirst({
            where: { clientId, userId: input.userId },
            orderBy: { createdAt: "desc" },
            select: { id: true, status: true, consultantId: true },
        });

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

        if (existingDeal) {
            dealId = existingDeal.id;
            consultantId = existingDeal.consultantId;
            const updateData: any = {
                status: "open",
                stageId: firstStageId,
                funnelId: funnel.id,
                lastActivity: `Novo contato recebido via ${input.source}`,
            };

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

        return { clientId, dealId, consultantId, isNewClient, isNewDeal, wasReactivated: !!existingDeal, funnelId: funnel.id, firstStageId };
    });

    // Chatbot trigger runs only after the transaction has committed, and stays
    // fire-and-forget (onDealStageChange is idempotent per deal, safe on reactivation too).
    chatbotEngine.onDealStageChange(result.dealId, result.firstStageId, result.funnelId).catch((err: any) => {
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
