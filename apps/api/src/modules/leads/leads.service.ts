// @ts-nocheck
import { leadsRepository } from "./leads.repository.js";
import type { CreateLeadPublicInput } from "./leads.schemas.js";
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { leadAssignmentService } from "../../lib/lead-assignment.service.js";
import { chatbotEngine } from "../chatbot/chatbot.engine.js";
import { upsertDealByContact } from "../deals/deals.service.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

export const leadsService = {
    async createPublic(data: CreateLeadPublicInput) {
        return leadsRepository.create({
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company ?? null,
            services: data.services,
            budget: data.budget ?? undefined,
            message: data.message ?? null,
            status: "new",
            source: "website",
        });
    },

    /**
     * Step 1 — Creates a Contact (Client) and optionally a Company from the public Cz form.
     * Both are created with status "new_lead" so the CRM highlights them in red until opened.
     */
    async createPublicContact(data: { name: string; email: string; phone: string; company?: string | null }) {
        // Resolved consistently with every other lead-intake channel (WhatsApp, settings) via
        // the shared getOwnerUserId() helper, so the same real-world contact always lands
        // under the same account regardless of which channel they came through.
        const ownerId = await getOwnerUserId();

        if (!ownerId) throw new Error("Nenhum usuário OWNER/ADMIN ativo encontrado no sistema.");

        let companyId: string | null = null;

        if (data.company?.trim()) {
            const companyName = data.company.trim();

            // Avoid duplicates: reuse existing company with same name
            const existing = await prisma.company.findFirst({
                where: { userId: ownerId, name: { equals: companyName, mode: "insensitive" } },
                select: { id: true },
            });

            if (existing) {
                companyId = existing.id;
            } else {
                const created = await prisma.company.create({
                    data: { userId: ownerId, name: companyName, status: "new_lead" },
                    select: { id: true },
                });
                companyId = created.id;
            }
        }

        const client = await prisma.client.create({
            data: {
                userId: ownerId,
                name: data.name.trim(),
                email: data.email.trim().toLowerCase() || null,
                phone: data.phone.trim() || null,
                company: data.company?.trim() || null,
                companyId,
                source: "website",
                status: "new_lead",
            },
            select: { id: true },
        });

        logger.info({ clientId: client.id, companyId }, "[Cz Form] Public contact created");
        return { clientId: client.id, companyId };
    },

    /**
     * Step 2 — Creates or reactivates a Deal (Opportunity) in the default funnel's first stage.
     * If a deal already exists for this contact, it is reactivated to MQL instead of duplicated.
     * Title = client name; tags = selected services.
     */
    async createPublicOpportunity(data: { clientId: string; services: string[] }) {
        // Resolved consistently with every other lead-intake channel (WhatsApp, settings) via
        // the shared getOwnerUserId() helper, so the same real-world contact always lands
        // under the same account regardless of which channel they came through.
        const ownerId = await getOwnerUserId();

        if (!ownerId) throw new Error("Nenhum usuário OWNER/ADMIN ativo encontrado no sistema.");

        const client = await prisma.client.findUnique({
            where: { id: data.clientId },
            select: { id: true, name: true, phone: true, email: true },
        });
        if (!client) throw new Error("Contato não encontrado.");

        // Resolve assignee via Round-Robin
        const assignedUserId = await leadAssignmentService.resolveAssignee(
            client.phone || null,
            client.email || null
        );

        const result = await upsertDealByContact({
            userId: ownerId,
            assignedUserId,
            name: client.name,
            email: client.email || null,
            phone: client.phone || null,
            source: "Website",
            title: client.name,
            tags: data.services,
        });

        logger.info(
            { dealId: result.dealId, clientId: data.clientId, isNewDeal: result.isNewDeal, wasReactivated: result.wasReactivated },
            "[Cz Form] Public opportunity processed"
        );

        return { dealId: result.dealId };
    },


    /**
     * Final step — updates the Deal with budget value + adds message as DealNote.
     */
    async updatePublicOpportunity(dealId: string, data: {
        value?: number;
        budgetText?: string | null;
        message?: string | null;
    }) {
        // Resolved consistently with every other lead-intake channel (WhatsApp, settings) via
        // the shared getOwnerUserId() helper, so the same real-world contact always lands
        // under the same account regardless of which channel they came through.
        const ownerId = await getOwnerUserId();

        if (!ownerId) throw new Error("Nenhum usuário OWNER/ADMIN ativo encontrado no sistema.");

        // Build update payload
        const updateData: Record<string, unknown> = {};
        if (typeof data.value === "number" && data.value > 0) updateData.value = data.value;
        if (data.budgetText) updateData.lastActivity = `Faixa de investimento: ${data.budgetText}`;

        if (Object.keys(updateData).length > 0) {
            await prisma.deal.update({ where: { id: dealId }, data: updateData });
        }

        // Add message as a DealNote
        if (data.message?.trim()) {
            await prisma.dealNote.create({
                data: {
                    dealId,
                    userId: ownerId,
                    content: data.message.trim(),
                    type: "note",
                },
            });
        }

        logger.info({ dealId, value: data.value }, "[Cz Form] Opportunity finalized with budget + message");
    },

    /**
     * Unified endpoint — creates Client + Deal + optional DealNote in a single call.
     * Designed for the mestresdaweb.com.br website lead forms (WhatsApp, Site, Blog).
     * Deduplicates by e-mail AND phone; reactivates existing won/lost deals to MQL.
     */
    async createFullLead(data: {
        name: string;
        email: string;
        phone: string;
        tag?: string;
        source?: string;
        project_type?: string;
        budget?: string;
        message?: string;
        conversion_url?: string;
        url_data?: string;
    }) {
        // Resolved consistently with every other lead-intake channel (WhatsApp, settings) via
        // the shared getOwnerUserId() helper, so the same real-world contact always lands
        // under the same account regardless of which channel they came through.
        const ownerId = await getOwnerUserId();

        if (!ownerId) throw new Error("Nenhum usuário OWNER/ADMIN ativo encontrado no sistema.");

        // Parse budget to numeric value
        let budgetValue: number | undefined;
        if (data.budget) {
            const match = data.budget.match(/[\d.]+/g);
            if (match) {
                const nums = match.map(Number).filter(n => !isNaN(n));
                budgetValue = nums.length > 0 ? Math.max(...nums) * 1000 : undefined;
            }
        }

        // Build tags from services/project type
        const tags: string[] = [];
        if (data.tag) tags.push(data.tag);
        if (data.project_type) tags.push(data.project_type);

        // Resolve assignee via Round-Robin
        const assignedUserId = await leadAssignmentService.resolveAssignee(
            data.phone?.trim() || null,
            data.email?.trim()?.toLowerCase() || null
        );

        const sourceLabel = data.tag || data.source || "Website";

        const result = await upsertDealByContact({
            userId: ownerId,
            assignedUserId,
            name: data.name.trim(),
            email: data.email?.trim() || null,
            phone: data.phone?.trim() || null,
            source: sourceLabel,
            title: data.name.trim(),
            value: budgetValue ?? null,
            tags,
            message: data.message?.trim() || null,
            conversionUrl: data.conversion_url?.trim() || null,
            urlData: data.url_data?.trim() || null,
            projectType: data.project_type?.trim() || null,
            budget: data.budget?.trim() || null,
        });

        logger.info(
            { clientId: result.clientId, dealId: result.dealId, source: sourceLabel, isNewDeal: result.isNewDeal, wasReactivated: result.wasReactivated },
            "[Website Lead] Full lead processed (Client + Deal + Notes)"
        );

        return { clientId: result.clientId, dealId: result.dealId };
    },
};
