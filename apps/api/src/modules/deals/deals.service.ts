import { prisma } from "../../config/database.js";
import { salesCadenceService } from "../sales-cadence/sales-cadence.service.js";
import { logger } from "../../lib/logger.js";

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

async function _checkDealAccess(id: string, user: JwtUser) {
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) throw new Error("Negócio não encontrado.");
    if (deal.userId === user.userId) return deal;
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (dbUser?.role === 'OWNER' || dbUser?.role === 'ADMIN') return deal;
    
    const allowedFunnels = (dbUser as any)?.allowedFunnels || [];
    if (deal.funnelId && allowedFunnels.includes(deal.funnelId)) return deal;
    
    throw new Error("Acesso negado ao negócio.");
}

export const dealsService = {
    async list(user: JwtUser, query: { funnelId?: string; search?: string }) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
        const allowedFunnels = (dbUser as any)?.allowedFunnels || [];
        
        let whereClause: any = { userId: user.userId };

        if (allowedFunnels.length > 0) {
            if (query.funnelId) {
                if (allowedFunnels.includes(query.funnelId)) {
                    whereClause = { funnelId: query.funnelId };
                } else {
                    whereClause = { funnelId: { in: allowedFunnels } };
                }
            } else {
                whereClause = { 
                    OR: [
                        { userId: user.userId },
                        { funnelId: { in: allowedFunnels } }
                    ]
                 };
            }
        } else {
            if (query.funnelId) {
                whereClause.funnelId = query.funnelId;
            }
        }

        if (query.search) {
            whereClause.title = { contains: query.search, mode: "insensitive" };
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
        const assignees = deal.assigneeIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: deal.assigneeIds } },
                select: { id: true, name: true, avatar: true },
            })
            : [];

        return { ...deal, clientProposals, assignees };
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

        return deal;
    },

    async update(id: string, data: UpdateDealDto, user: JwtUser) {
        await _checkDealAccess(id, user);
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
        return prisma.deal.update({
            where: { id },
            data: {
                funnelId: funnelId,
                stageId: firstStage.id,
                stageEnteredAt: new Date()
            },
            include: { client: true, consultant: true }
        });
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
