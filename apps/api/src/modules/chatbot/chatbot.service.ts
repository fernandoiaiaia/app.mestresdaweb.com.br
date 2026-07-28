// ═══════════════════════════════════════
// CHATBOT SERVICE — CRUD & Business Logic
// ═══════════════════════════════════════

import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { WhatsappService } from "../whatsapp/whatsapp.service.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

// ═══ CONFIG ═══

export const chatbotConfigService = {

    async getOrCreate(userId: string) {
        let config = await prisma.chatbotConfig.findFirst({
            where: { userId }
        });

        if (!config) {
            config = await prisma.chatbotConfig.create({
                data: { userId }
            });
        }

        return config;
    },

    async update(userId: string, data: {
        botName?: string;
        toneOfVoice?: string;
        systemPrompt?: string;
        aiProvider?: string;
        aiModel?: string;
        maxConsecutiveBotMsgs?: number;
        maxFollowupsPerDay?: number;
        businessHoursStart?: string;
        businessHoursEnd?: string;
        warmupEnabled?: boolean;
        currentDailyLimit?: number;
        isActive?: boolean;
    }) {
        const config = await this.getOrCreate(userId);
        return prisma.chatbotConfig.update({
            where: { id: config.id },
            data
        });
    }
};

// ═══ FLOWS ═══

export const chatbotFlowService = {

    async list(userId: string, page = 1, limit = 10, search?: string) {
        const config = await chatbotConfigService.getOrCreate(userId);

        const where: any = { chatbotId: config.id };
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        const [flows, total] = await Promise.all([
            prisma.chatbotFlow.findMany({
                where,
                include: {
                    funnel: { select: { id: true, name: true } },
                    stage: { select: { id: true, name: true } },
                    _count: { select: { sessions: true } }
                },
                orderBy: { orderIndex: "asc" },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.chatbotFlow.count({ where })
        ]);

        // Enrich with session stats
        const enriched = await Promise.all(flows.map(async (flow) => {
            const stats = await prisma.chatbotSession.aggregate({
                where: { flowId: flow.id },
                _count: { id: true }
            });

            const conversions = await prisma.chatbotSession.count({
                where: { flowId: flow.id, status: "completed" }
            });

            return {
                ...flow,
                sessions: stats._count.id,
                conversions,
                funnel: flow.funnel.name,
                stage: flow.stage.name,
                funnelId: flow.funnel.id,
                stageId: flow.stage.id
            };
        }));

        return {
            data: enriched,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    async getById(id: string) {
        return prisma.chatbotFlow.findUnique({
            where: { id },
            include: {
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true } }
            }
        });
    },

    async create(userId: string, data: {
        name: string;
        description?: string;
        funnelId: string;
        stageId: string;
        objective?: string;
        outboundTemplateName?: string;
        outboundPrompt?: string;
        inboundPrompt?: string;
        qualificationFields?: any[];
        handoffOnQualified?: boolean;
        handoffOnHumanRequest?: boolean;
        handoffAfterMessages?: number;
    }) {
        const config = await chatbotConfigService.getOrCreate(userId);

        return prisma.chatbotFlow.create({
            data: {
                chatbotId: config.id,
                name: data.name,
                description: data.description,
                funnelId: data.funnelId,
                stageId: data.stageId,
                objective: data.objective || "qualify",
                outboundTemplateName: data.outboundTemplateName,
                outboundPrompt: data.outboundPrompt,
                inboundPrompt: data.inboundPrompt,
                qualificationFields: data.qualificationFields || [],
                handoffOnQualified: data.handoffOnQualified ?? true,
                handoffOnHumanRequest: data.handoffOnHumanRequest ?? true,
                handoffAfterMessages: data.handoffAfterMessages ?? 10
            },
            include: {
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true } }
            }
        });
    },

    async update(id: string, data: {
        name?: string;
        description?: string;
        funnelId?: string;
        stageId?: string;
        objective?: string;
        isActive?: boolean;
        outboundTemplateName?: string;
        outboundPrompt?: string;
        inboundPrompt?: string;
        qualificationFields?: any[];
        handoffOnQualified?: boolean;
        handoffOnHumanRequest?: boolean;
        handoffAfterMessages?: number;
    }) {
        return prisma.chatbotFlow.update({
            where: { id },
            data,
            include: {
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true } }
            }
        });
    },

    async delete(id: string) {
        return prisma.chatbotFlow.delete({ where: { id } });
    },

    async toggleActive(id: string) {
        const flow = await prisma.chatbotFlow.findUnique({ where: { id } });
        if (!flow) throw new Error("Fluxo não encontrado");
        return prisma.chatbotFlow.update({
            where: { id },
            data: { isActive: !flow.isActive }
        });
    }
};

// ═══ KNOWLEDGE BASE ═══

export const chatbotKnowledgeService = {

    async list(userId: string, page = 1, limit = 10, search?: string) {
        const config = await chatbotConfigService.getOrCreate(userId);

        const where: any = { chatbotId: config.id };
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        const [docs, total] = await Promise.all([
            prisma.chatbotKnowledge.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.chatbotKnowledge.count({ where })
        ]);

        return {
            data: docs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        };
    },

    async create(userId: string, data: {
        name: string;
        type: "text" | "file" | "url";
        content?: string;
        fileUrl?: string;
    }) {
        const config = await chatbotConfigService.getOrCreate(userId);

        const doc = await prisma.chatbotKnowledge.create({
            data: {
                chatbotId: config.id,
                name: data.name,
                type: data.type,
                content: data.content,
                fileUrl: data.fileUrl,
                status: "PENDING"
            }
        });

        // Process immediately for text content (small enough to be inline)
        if (data.type === "text" && data.content) {
            await prisma.chatbotKnowledge.update({
                where: { id: doc.id },
                data: {
                    status: "PROCESSED",
                    info: `${data.content.length} caracteres`
                }
            });
        } else if (data.type === "url" && data.content) {
            // Start URL scraping in background
            this._processUrl(doc.id, data.content).catch(err =>
                logger.error({ err, docId: doc.id }, "[KnowledgeBase] URL processing failed")
            );
        }

        return doc;
    },

    async delete(id: string) {
        return prisma.chatbotKnowledge.delete({ where: { id } });
    },

    // Background URL processor
    async _processUrl(docId: string, url: string) {
        try {
            await prisma.chatbotKnowledge.update({
                where: { id: docId },
                data: { status: "PROCESSING", info: "Extraindo conteúdo..." }
            });

            // Simple text extraction from URL
            const response = await fetch(url, {
                headers: { "User-Agent": "Mozilla/5.0 ProposalAI-Bot" }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();

            // Basic HTML to text conversion
            const text = html
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<style[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .trim()
                .substring(0, 50000); // Limit to 50k chars

            await prisma.chatbotKnowledge.update({
                where: { id: docId },
                data: {
                    content: text,
                    status: "PROCESSED",
                    info: `${text.length} caracteres extraídos`
                }
            });

            logger.info({ docId, url, chars: text.length }, "[KnowledgeBase] URL processed successfully");
        } catch (err) {
            logger.error({ err, docId, url }, "[KnowledgeBase] URL processing error");
            await prisma.chatbotKnowledge.update({
                where: { id: docId },
                data: { status: "ERROR", info: "Falha ao extrair conteúdo da URL" }
            });
        }
    }
};

// ═══ TEMPLATES (Meta WhatsApp) ═══

export const whatsappTemplateService = {

    async list(userId: string, page = 1, limit = 10, search?: string) {
        const ownerId = await getOwnerUserId() || userId;

        const where: any = { userId: ownerId };
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        const [templates, total] = await Promise.all([
            prisma.whatsappTemplate.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.whatsappTemplate.count({ where })
        ]);

        return {
            data: templates,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        };
    },

    async create(userId: string, data: {
        name: string;
        category: string;
        body: string;
        language?: string;
    }) {
        const ownerId = await getOwnerUserId() || userId;

        // Create locally
        const template = await prisma.whatsappTemplate.create({
            data: {
                userId: ownerId,
                name: data.name,
                category: data.category,
                body: data.body,
                language: data.language || "pt_BR",
                status: "PENDING"
            }
        });

        // Submit to Meta API in background
        this._submitToMeta(template.id, ownerId).catch(err =>
            logger.error({ err, templateId: template.id }, "[Templates] Meta submission failed")
        );

        return template;
    },

    async delete(id: string) {
        return prisma.whatsappTemplate.delete({ where: { id } });
    },

    async syncFromMeta(userId: string) {
        const ownerId = await getOwnerUserId() || userId;
        const credentials = await WhatsappService.getCredentials(ownerId);

        if (!credentials || !credentials.wabaId) {
            throw new Error("Credenciais WhatsApp não configuradas ou WABA ID ausente");
        }

        try {
            const url = `https://graph.facebook.com/v23.0/${credentials.wabaId}/message_templates?limit=250`;
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${credentials.accessToken}` }
            });

            const data = await response.json() as any;

            if (!response.ok) {
                throw new Error(data?.error?.message || `HTTP ${response.status}`);
            }

            const metaTemplates = data.data || [];
            let synced = 0;

            for (const mt of metaTemplates) {
                const body = mt.components?.find((c: any) => c.type === "BODY")?.text || "";

                await prisma.whatsappTemplate.upsert({
                    where: { userId_name: { userId: ownerId, name: mt.name } },
                    update: {
                        status: mt.status === "APPROVED" ? "APPROVED" : mt.status === "REJECTED" ? "REJECTED" : "PENDING",
                        category: mt.category || "Marketing",
                        body: body || undefined,
                        metaId: mt.id,
                        language: mt.language || "pt_BR"
                    },
                    create: {
                        userId: ownerId,
                        name: mt.name,
                        category: mt.category || "Marketing",
                        body,
                        language: mt.language || "pt_BR",
                        status: mt.status === "APPROVED" ? "APPROVED" : mt.status === "REJECTED" ? "REJECTED" : "PENDING",
                        metaId: mt.id
                    }
                });
                synced++;
            }

            logger.info({ synced }, "[Templates] Synced from Meta");
            return { synced };
        } catch (err) {
            logger.error({ err }, "[Templates] Sync from Meta failed");
            throw err;
        }
    },

    // Submit template to Meta for approval
    async _submitToMeta(templateId: string, userId: string) {
        const template = await prisma.whatsappTemplate.findUnique({ where: { id: templateId } });
        if (!template) return;

        const credentials = await WhatsappService.getCredentials(userId);
        if (!credentials || !credentials.wabaId) {
            logger.warn("[Templates] No WhatsApp credentials for Meta submission");
            return;
        }

        try {
            const url = `https://graph.facebook.com/v23.0/${credentials.wabaId}/message_templates`;
            const payload = {
                name: template.name,
                category: template.category.toUpperCase(),
                language: template.language,
                components: [
                    { type: "BODY", text: template.body }
                ]
            };

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${credentials.accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json() as any;

            if (response.ok && data.id) {
                await prisma.whatsappTemplate.update({
                    where: { id: templateId },
                    data: { metaId: data.id, status: "PENDING" }
                });
                logger.info({ templateId, metaId: data.id }, "[Templates] Submitted to Meta");
            } else {
                logger.error({ data }, "[Templates] Meta rejection");
                await prisma.whatsappTemplate.update({
                    where: { id: templateId },
                    data: { status: "REJECTED", info: data?.error?.message || "Rejeitado pela Meta" } as any
                });
            }
        } catch (err) {
            logger.error({ err }, "[Templates] Meta submission error");
        }
    }
};

// ═══ SESSIONS (Read-only for dashboard) ═══

export const chatbotSessionService = {

    async getDashboardStats(userId: string) {
        const config = await chatbotConfigService.getOrCreate(userId);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [
            totalSessions,
            activeSessions,
            completedSessions,
            handedOffSessions,
            todaySessions,
            avgScore
        ] = await Promise.all([
            prisma.chatbotSession.count({ where: { chatbotId: config.id } }),
            prisma.chatbotSession.count({ where: { chatbotId: config.id, status: "active" } }),
            prisma.chatbotSession.count({ where: { chatbotId: config.id, status: "completed" } }),
            prisma.chatbotSession.count({ where: { chatbotId: config.id, status: "handed_off" } }),
            prisma.chatbotSession.count({
                where: { chatbotId: config.id, createdAt: { gte: todayStart } }
            }),
            prisma.chatbotSession.aggregate({
                where: { chatbotId: config.id, qualificationScore: { gt: 0 } },
                _avg: { qualificationScore: true }
            })
        ]);

        return {
            totalSessions,
            activeSessions,
            completedSessions,
            handedOffSessions,
            todaySessions,
            avgQualificationScore: Math.round(avgScore._avg.qualificationScore || 0),
            conversionRate: totalSessions > 0
                ? Math.round(((completedSessions + handedOffSessions) / totalSessions) * 100)
                : 0
        };
    }
};
