import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { leadAssignmentService } from "../../lib/lead-assignment.service.js";

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

        // 4. Create Client (Contact)
        const client = await prisma.client.create({
            data: {
                userId: ownerId,
                name: payload.name.trim(),
                email: payload.email?.trim().toLowerCase() || null,
                phone: payload.phone?.trim() || null,
                role: payload.role?.trim() || null,
                city: payload.city?.trim() || null,
                state: payload.state?.trim() || null,
                website: payload.website?.trim() || null,
                segment: payload.segment?.trim() || null,
                source: payload.source?.trim() || "Inbound Webhook",
                companyId,
                status: "new_lead",
                notes: payload.notes?.trim() || null,
            },
            select: { id: true, name: true },
        });

        // 5. Detect Default Funnel for Opportunity
        let funnel = await prisma.funnel.findFirst({
            where: { userId: ownerId, active: true },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            include: { stages: { orderBy: { orderIndex: "asc" }, take: 1 } },
        });

        if (!funnel || funnel.stages.length === 0) {
            // Auto-create a default funnel if none exists
            funnel = await prisma.funnel.create({
                data: {
                    userId: ownerId,
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

        // 6. Create Deal
        const deal = await prisma.deal.create({
            data: {
                userId: ownerId,
                consultantId: assignedUserId, // Round-Robin designated user!
                clientId: client.id,
                funnelId: funnel.id,
                stageId: funnel.stages[0].id,
                title: payload.dealTitle?.trim() || `Negócio - ${client.name}`,
                value: payload.dealValue ? Number(payload.dealValue) : null,
                priority: payload.dealPriority || "medium",
                source: payload.source?.trim() || "Inbound Webhook",
                tags: Array.isArray(payload.dealTags) ? payload.dealTags : [],
                status: "open",
            },
            select: { id: true },
        });

        // 7. Add Message logic to DealNote
        if (payload.dealMessage?.trim()) {
            await prisma.dealNote.create({
                data: {
                    dealId: deal.id,
                    userId: ownerId, // Note created by system/webhook mapping
                    content: payload.dealMessage.trim(),
                    type: "note",
                },
            });
        }

        logger.info({ dealId: deal.id, assignedUserId, tenantId: ownerId }, "[Webhook] Lead Processed and Assigned");

        return {
            success: true,
            dealId: deal.id,
            clientId: client.id,
            assignedUserId,
        };
    }
};
