import { leadsRepository } from "./leads.repository.js";
import type { CreateLeadPublicInput } from "./leads.schemas.js";
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";

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
        // Use OWNER user as the record owner; fall back to the first user if none exists
        const owner = await prisma.user.findFirst({
            where: { role: "OWNER" },
            select: { id: true },
        }) ?? await prisma.user.findFirst({ select: { id: true } });

        if (!owner) throw new Error("Nenhum usuário encontrado no sistema.");

        let companyId: string | null = null;

        if (data.company?.trim()) {
            const companyName = data.company.trim();

            // Avoid duplicates: reuse existing company with same name
            const existing = await prisma.company.findFirst({
                where: { userId: owner.id, name: { equals: companyName, mode: "insensitive" } },
                select: { id: true },
            });

            if (existing) {
                companyId = existing.id;
            } else {
                const created = await prisma.company.create({
                    data: { userId: owner.id, name: companyName, status: "new_lead" },
                    select: { id: true },
                });
                companyId = created.id;
            }
        }

        const client = await prisma.client.create({
            data: {
                userId: owner.id,
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
     * Step 2 — Creates a Deal (Opportunity) in the default funnel's first stage.
     * If no active funnel exists, creates a default one automatically.
     * Title = client name; tags = selected services.
     */
    async createPublicOpportunity(data: { clientId: string; services: string[] }) {
        const owner = await prisma.user.findFirst({
            where: { role: "OWNER" },
            select: { id: true },
        }) ?? await prisma.user.findFirst({ select: { id: true } });

        if (!owner) throw new Error("Nenhum usuário encontrado no sistema.");

        const client = await prisma.client.findUnique({
            where: { id: data.clientId },
            select: { name: true },
        });
        if (!client) throw new Error("Contato não encontrado.");

        // Try default funnel first, then any active funnel
        let funnel = await prisma.funnel.findFirst({
            where: { userId: owner.id, isDefault: true, active: true },
            include: { stages: { orderBy: { orderIndex: "asc" }, take: 1 } },
        }) ?? await prisma.funnel.findFirst({
            where: { userId: owner.id, active: true },
            include: { stages: { orderBy: { orderIndex: "asc" }, take: 1 } },
        });

        // Auto-create a default funnel if none exists
        if (!funnel || funnel.stages.length === 0) {
            logger.info({ userId: owner.id }, "[Cz Form] No funnel found — creating default funnel automatically");
            const newFunnel = await prisma.funnel.create({
                data: {
                    userId: owner.id,
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
            funnel = newFunnel;
        }

        const deal = await prisma.deal.create({
            data: {
                userId: owner.id,
                clientId: data.clientId,
                funnelId: funnel.id,
                stageId: funnel.stages[0].id,
                title: client.name,
                source: "Website",
                tags: data.services,
                status: "open",
            },
            select: { id: true },
        });

        logger.info({ dealId: deal.id, clientId: data.clientId, funnelId: funnel.id }, "[Cz Form] Public opportunity created");
        return { dealId: deal.id };
    },


    /**
     * Final step — updates the Deal with budget value + adds message as DealNote.
     */
    async updatePublicOpportunity(dealId: string, data: {
        value?: number;
        budgetText?: string | null;
        message?: string | null;
    }) {
        const owner = await prisma.user.findFirst({
            where: { role: "OWNER" },
            select: { id: true },
        }) ?? await prisma.user.findFirst({ select: { id: true } });

        if (!owner) throw new Error("Nenhum usuário encontrado no sistema.");

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
                    userId: owner.id,
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
        const owner = await prisma.user.findFirst({
            where: { role: "OWNER" },
            select: { id: true },
        }) ?? await prisma.user.findFirst({ select: { id: true } });

        if (!owner) throw new Error("Nenhum usuário encontrado no sistema.");

        // ── 1) Create Client ──
        const client = await prisma.client.create({
            data: {
                userId: owner.id,
                name: data.name.trim(),
                email: data.email.trim().toLowerCase() || null,
                phone: data.phone?.trim() || null,
                source: data.tag || "website",
                status: "new_lead",
            },
            select: { id: true },
        });

        // ── 2) Find or create default funnel ──
        let funnel = await prisma.funnel.findFirst({
            where: { userId: owner.id, isDefault: true, active: true },
            include: { stages: { orderBy: { orderIndex: "asc" }, take: 1 } },
        }) ?? await prisma.funnel.findFirst({
            where: { userId: owner.id, active: true },
            include: { stages: { orderBy: { orderIndex: "asc" }, take: 1 } },
        });

        if (!funnel || funnel.stages.length === 0) {
            logger.info({ userId: owner.id }, "[Website Lead] No funnel found — creating default funnel");
            const newFunnel = await prisma.funnel.create({
                data: {
                    userId: owner.id,
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
            funnel = newFunnel;
        }

        // ── 3) Determine deal source label ──
        const sourceLabel = data.tag || data.source || "Website";

        // ── 4) Parse budget to numeric value ──
        let budgetValue = 0;
        if (data.budget) {
            const match = data.budget.match(/[\d.]+/g);
            if (match) {
                const nums = match.map(Number).filter(n => !isNaN(n));
                budgetValue = nums.length > 0 ? Math.max(...nums) * 1000 : 0;
            }
        }

        // ── 5) Build tags from services/project type ──
        const tags: string[] = [];
        if (data.tag) tags.push(data.tag);
        if (data.project_type) tags.push(data.project_type);

        // ── 6) Create Deal ──
        const deal = await prisma.deal.create({
            data: {
                userId: owner.id,
                clientId: client.id,
                funnelId: funnel.id,
                stageId: funnel.stages[0].id,
                title: data.name.trim(),
                source: sourceLabel,
                tags,
                status: "open",
                value: budgetValue,
            },
            select: { id: true },
        });

        // ── 7) Add notes (message + conversion metadata) ──
        const noteLines: string[] = [];
        if (data.message?.trim()) noteLines.push(`Mensagem: ${data.message.trim()}`);
        if (data.project_type) noteLines.push(`Tipo de projeto: ${data.project_type}`);
        if (data.budget) noteLines.push(`Faixa de investimento: ${data.budget}`);
        if (data.conversion_url) noteLines.push(`URL de conversão: ${data.conversion_url}`);
        if (data.url_data) noteLines.push(`Dados da URL: ${data.url_data}`);

        if (noteLines.length > 0) {
            await prisma.dealNote.create({
                data: {
                    dealId: deal.id,
                    userId: owner.id,
                    content: noteLines.join("\n"),
                    type: "note",
                },
            });
        }

        logger.info(
            { clientId: client.id, dealId: deal.id, source: sourceLabel },
            "[Website Lead] Full lead created (Client + Deal + Notes)"
        );

        return { clientId: client.id, dealId: deal.id };
    },
};
