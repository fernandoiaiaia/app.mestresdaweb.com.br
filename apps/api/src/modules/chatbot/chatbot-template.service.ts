import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { getOwnerUserId } from "../../lib/get-owner.js";
import { WhatsappService } from "../whatsapp/whatsapp.service.js";

export const chatbotTemplateService = {
    async list() {
        const ownerId = await getOwnerUserId();
        if (!ownerId) return [];
        return prisma.chatbotTemplate.findMany({
            where: { userId: ownerId },
            orderBy: { createdAt: "desc" },
        });
    },

    async create(data: { name: string; category?: string; language?: string; bodyText: string; headerText?: string; footerText?: string }) {
        const ownerId = await getOwnerUserId();
        if (!ownerId) throw new Error("Nenhum OWNER encontrado.");

        // Normalize name to snake_case as required by Meta
        const safeName = data.name.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");

        // Save locally first
        const template = await prisma.chatbotTemplate.create({
            data: {
                userId: ownerId,
                name: safeName,
                category: data.category || "UTILITY",
                language: data.language || "pt_BR",
                bodyText: data.bodyText,
                headerText: data.headerText || null,
                footerText: data.footerText || null,
                status: "PENDING",
            },
        });

        // Submit to Meta API
        try {
            const creds = await WhatsappService.getCredentials(ownerId);
            if (!creds) throw new Error("Credenciais WhatsApp não configuradas.");

            // Get WABA ID from integration settings
            const setting = await prisma.integrationSetting.findFirst({
                where: { userId: ownerId, provider: "whatsapp", isActive: true },
            });
            const wabaId = (setting?.credentials as any)?.businessAccountId;
            if (!wabaId) throw new Error("Business Account ID não configurado.");

            const components: any[] = [];
            if (data.headerText) {
                components.push({ type: "HEADER", format: "TEXT", text: data.headerText });
            }
            components.push({ type: "BODY", text: data.bodyText });
            if (data.footerText) {
                components.push({ type: "FOOTER", text: data.footerText });
            }

            const resp = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/message_templates`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${creds.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: safeName,
                    category: data.category || "UTILITY",
                    language: data.language || "pt_BR",
                    components,
                }),
            });

            const result = await resp.json();
            if (resp.ok && result.id) {
                await prisma.chatbotTemplate.update({
                    where: { id: template.id },
                    data: { metaTemplateId: result.id, status: result.status || "PENDING" },
                });
                logger.info({ templateId: template.id, metaId: result.id }, "[Whatsbot] Template submitted to Meta");
            } else {
                logger.error({ result }, "[Whatsbot] Failed to submit template to Meta");
                await prisma.chatbotTemplate.update({
                    where: { id: template.id },
                    data: { status: "REJECTED", rejectionReason: JSON.stringify(result.error || result) },
                });
            }
        } catch (err: any) {
            logger.error({ err: err.message }, "[Whatsbot] Error submitting template to Meta");
        }

        return prisma.chatbotTemplate.findUnique({ where: { id: template.id } });
    },

    async delete(id: string) {
        return prisma.chatbotTemplate.delete({ where: { id } });
    },

    /** Sync status of all templates from Meta API */
    async syncAll() {
        const ownerId = await getOwnerUserId();
        if (!ownerId) return;

        const creds = await WhatsappService.getCredentials(ownerId);
        if (!creds) return;

        const setting = await prisma.integrationSetting.findFirst({
            where: { userId: ownerId, provider: "whatsapp", isActive: true },
        });
        const wabaId = (setting?.credentials as any)?.businessAccountId;
        if (!wabaId) return;

        try {
            const resp = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/message_templates`, {
                headers: { "Authorization": `Bearer ${creds.accessToken}` },
            });
            const result = await resp.json();
            if (!resp.ok || !result.data) return;

            for (const metaTemplate of result.data) {
                await prisma.chatbotTemplate.updateMany({
                    where: { userId: ownerId, name: metaTemplate.name },
                    data: {
                        metaTemplateId: metaTemplate.id,
                        status: metaTemplate.status,
                        rejectionReason: metaTemplate.rejected_reason || null,
                    },
                });
            }
            logger.info({ count: result.data.length }, "[Whatsbot] Templates synced from Meta");
        } catch (err: any) {
            logger.error({ err: err.message }, "[Whatsbot] Error syncing templates");
        }
    },

    /** Get approved templates for dropdown selectors */
    async getApproved() {
        const ownerId = await getOwnerUserId();
        if (!ownerId) return [];
        return prisma.chatbotTemplate.findMany({
            where: { userId: ownerId, status: "APPROVED" },
            select: { id: true, name: true, bodyText: true },
        });
    },
};
