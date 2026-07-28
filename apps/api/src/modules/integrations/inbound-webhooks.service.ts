// @ts-nocheck
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { leadAssignmentService } from "../../lib/lead-assignment.service.js";
import { chatbotEngine } from "../chatbot/chatbot.engine.js";
import { upsertDealByContact } from "../deals/deals.service.js";
export const inboundWebhooksService = {
    async processIncoming(secretToken: string, payload: any) {
        // 1. Find the active IntegrationSetting matching the token
        const settings = await prisma.integrationSetting.findMany({
            where: {
                provider: "inbound_webhook",
                isActive: true,
            }
        });

        // Prisma JSON filtering can sometimes be tricky with string values directly, 
        // so finding in memory is safest for this low-volume scale.
        const setting = settings.find(s => {
            const creds = s.credentials as any;
            return creds && creds.secretToken === secretToken;
        });

        if (!setting) {
            throw new Error("Token de webhook inválido, desativado ou não encontrado.");
        }

        // 2. Resolve assignee via centralized Lead Assignment (Affinity + Round-Robin)
        const assignedUserId = await leadAssignmentService.resolveAssignee(
            payload.phone?.trim() || null,
            payload.email?.trim()?.toLowerCase() || null
        );

        // Validate payload minimally
        if (!payload.name?.trim()) {
            throw new Error("O campo 'name' é obrigatório no JSON.");
        }

        const ownerId = setting.userId; // Master owner ID of the tenant, usually the one who setup the integration

        // 3. Create Company (if provided)
        let companyId: string | null = null;
        if (payload.companyName?.trim()) {
            const companyName = payload.companyName.trim();
            // Avoid duplicates: reuse existing company
            const existing = await prisma.company.findFirst({
                where: { userId: ownerId, name: { equals: companyName, mode: "insensitive" } },
                select: { id: true },
            });

            if (existing) {
                companyId = existing.id;
            } else {
                const created = await prisma.company.create({
                    data: {
                        userId: ownerId,
                        name: companyName,
                        cnpj: payload.companyCnpj?.trim() || null,
                        status: "new_lead",
                    },
                    select: { id: true },
                });
                companyId = created.id;
            }
        }

        // 4. Upsert Client + Deal via centralized deduplication logic
        const dealSource = payload.source?.trim() || "Inbound Webhook";

        const result = await upsertDealByContact({
            userId: ownerId,
            assignedUserId,
            name: payload.name.trim(),
            email: payload.email?.trim() || null,
            phone: payload.phone?.trim() || null,
            source: dealSource,
            title: payload.dealTitle?.trim() || null,
            value: payload.dealValue ? Number(payload.dealValue) : null,
            tags: Array.isArray(payload.dealTags) ? payload.dealTags : [],
            message: payload.dealMessage?.trim() || null,
            companyId,
            companyName: payload.companyName?.trim() || null,
            segment: payload.segment?.trim() || null,
            city: payload.city?.trim() || null,
            state: payload.state?.trim() || null,
            website: payload.website?.trim() || null,
            role: payload.role?.trim() || null,
            priority: payload.dealPriority?.trim() || null,
        });

        logger.info(
            { dealId: result.dealId, clientId: result.clientId, assignedUserId, tenantId: ownerId, isNewDeal: result.isNewDeal, wasReactivated: result.wasReactivated },
            "[Webhook] Lead Processed and Assigned"
        );

        return {
            success: true,
            dealId: result.dealId,
            clientId: result.clientId,
            assignedUserId,
        };
    }
};
