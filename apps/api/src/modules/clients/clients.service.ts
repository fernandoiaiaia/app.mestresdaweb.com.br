import { clientsRepository } from "./clients.repository.js";
import { AppError, ConflictError } from "../../lib/errors.js";
import { Prisma } from "@prisma/client";
import { usersRepository } from "../users/users.repository.js";
import { prisma } from "../../config/database.js";
import { hashPassword } from "../../lib/hash.js";
import { upsertDealByContact } from "../deals/deals.service.js";
import { contactIdentity } from "../../lib/contact-identity.js";
import { findClientByIdentity, lockContactIdentity } from "./clients.identity.js";

interface JwtUser {
    userId: string;
    role: string;
}

export const clientsService = {
    async create(data: any, jwtUser: JwtUser) {
        const { contacts, portalPassword, ...clientData } = data;

        // Ensure Portal user if requested
        if (portalPassword && clientData.email) {
            const emailStr = String(clientData.email).trim().toLowerCase();
            const passStr = String(portalPassword).trim();
            const hashedPassword = await hashPassword(passStr);

            const userExists = await prisma.user.findUnique({ where: { email: emailStr } });
            if (userExists) {
                await prisma.user.update({
                    where: { id: userExists.id },
                    data: { password: hashedPassword, role: "VIEWER", allowedApps: ["client"], twoFactorEnabled: false }
                });
            } else {
                await prisma.user.create({
                    data: {
                        name: clientData.name || "Cliente",
                        email: emailStr,
                        password: hashedPassword,
                        role: "VIEWER",
                        allowedApps: ["client"],
                        twoFactorEnabled: false
                    }
                });
            }
        }

        // O e-mail era gravado como veio do formulário. Como a deduplicação compara em
        // caixa baixa, um "Joao@Empresa.com" cadastrado aqui nunca era reconhecido como o
        // mesmo "joao@empresa.com" que chegava pelo site, e a pessoa virava dois registros.
        const identity = contactIdentity(clientData.email, clientData.phone);

        const createPayload: Prisma.ClientUncheckedCreateInput = {
            ...clientData,
            email: identity.emailKey ?? clientData.email ?? null,
            emailKey: identity.emailKey,
            phoneKey: identity.phoneKey,
            userId: jwtUser.userId,
        };

        if (contacts && contacts.length > 0) {
            createPayload.contacts = {
                create: contacts.map((c: any) => ({
                    name: c.name,
                    email: c.email,
                    phone: c.phone,
                    role: c.role,
                    isPrimary: c.isPrimary || false,
                }))
            };
        }

        return prisma.$transaction(async (tx) => {
            await lockContactIdentity(tx, identity);

            const existing = await findClientByIdentity(tx, identity);
            if (existing) {
                throw new ConflictError(
                    `Já existe um contato com este e-mail ou telefone: ${existing.name}.`,
                );
            }

            return tx.client.create({ data: createPayload, include: { contacts: true } });
        });
    },

    async bulkCreate(dataArray: any[], jwtUser: JwtUser) {
        // Assign the creator as the userId for all imported clients
        const clientsForDb = dataArray.map(data => {
            // Sem as chaves de identidade, um contato importado em massa fica invisível
            // para a deduplicação e o próximo lead dessa pessoa abre um card novo.
            const identity = contactIdentity(data.email, data.phone);
            return {
                ...data,
                email: identity.emailKey ?? data.email ?? null,
                emailKey: identity.emailKey,
                phoneKey: identity.phoneKey,
                userId: jwtUser.userId,
            };
        });
        return clientsRepository.createMany(clientsForDb);
    },

    async bulkCreateWithDeals(data: { funnelId?: string; items: any[] }, jwtUser: JwtUser) {
        const { items } = data;
        let clientsCreated = 0;
        let dealsCreated = 0;
        const errors: string[] = [];

        // ─── Step 1: Resolve Funnel ──────────────────────────────────────────
        let funnelId = data.funnelId;
        if (!funnelId) {
            const defaultFunnel = await prisma.funnel.findFirst({
                where: { userId: jwtUser.userId, isDefault: true }
            });
            if (!defaultFunnel) {
                const anyFunnel = await prisma.funnel.findFirst({
                    where: { userId: jwtUser.userId }
                });
                if (!anyFunnel) throw new AppError("Nenhum funil encontrado. Crie um primeiro.", 400);
                funnelId = anyFunnel.id;
            } else {
                funnelId = defaultFunnel.id;
            }
        }

        // ─── Step 2: Load all stages for the funnel ──────────────────────────
        let stages = await prisma.funnelStage.findMany({
            where: { funnelId },
            orderBy: { orderIndex: 'asc' }
        });

        // ─── Step 3: Load all users for consultant matching ──────────────────
        const allUsers = await prisma.user.findMany({
            select: { id: true, name: true }
        });

        // Helper: normalize string for fuzzy matching (lowercase, remove accents)
        const normalize = (s: string) =>
            s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        // Helper: find stage by name (fuzzy)
        const findStage = (name: string) => {
            const n = normalize(name);
            return stages.find(s => normalize(s.name) === n);
        };

        // Helper: find consultant by name (fuzzy, partial match)
        const findConsultant = (name: string) => {
            const n = normalize(name);
            // Exact match first
            let match = allUsers.find(u => normalize(u.name) === n);
            if (match) return match;
            // Partial match
            match = allUsers.find(u => normalize(u.name).includes(n) || n.includes(normalize(u.name)));
            if (match) return match;
            // Fallback: match by first name only
            const firstName = n.split(" ")[0];
            if (firstName && firstName.length > 2) {
                match = allUsers.find(u => normalize(u.name).split(" ")[0] === firstName);
            }
            return match || null;
        };

        // ─── Step 4: Process each row ────────────────────────────────────────
        for (let i = 0; i < items.length; i++) {
            const row = items[i];
            try {
                // 4a. Resolve consultant
                let consultantId = jwtUser.userId;
                const consultantName = row.consultantName?.trim();
                if (consultantName) {
                    const matched = findConsultant(consultantName);
                    if (matched) consultantId = matched.id;
                }

                // 4b. Parse value
                let dealValue: number | undefined;
                if (row.dealValue !== null && row.dealValue !== undefined) {
                    dealValue = typeof row.dealValue === 'number' ? row.dealValue : parseFloat(String(row.dealValue).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                }

                // 4c. Parse tags
                let tags: string[] = [];
                if (row.dealTags && Array.isArray(row.dealTags)) {
                    tags = row.dealTags;
                }

                // 4d. Parse expectedClose
                let expectedClose: string | undefined;
                if (row.expectedClose) {
                    const d = new Date(row.expectedClose);
                    if (!isNaN(d.getTime())) expectedClose = row.expectedClose;
                }

                // 4e. Use centralized upsert to avoid duplicate deals for the same contact
                const result = await upsertDealByContact({
                    userId: jwtUser.userId,
                    assignedUserId: consultantId,
                    name: row.name || "Contato Importado",
                    email: row.email ? String(row.email).trim().toLowerCase() : null,
                    phone: row.phone ? String(row.phone).trim() : null,
                    source: row.dealSource || row.dealOrigin || "Importação",
                    title: row.dealTitle || row.name || "Oportunidade Importada",
                    value: dealValue ?? null,
                    tags,
                    expectedClose,
                    priority: "low",
                    temperature: "cold",
                });

                if (result.isNewClient) clientsCreated++;
                if (result.isNewDeal) dealsCreated++;

                // 4f. Keep campaign note if provided
                if (row.campaignNote) {
                    await prisma.dealNote.create({
                        data: {
                            dealId: result.dealId,
                            userId: jwtUser.userId,
                            content: `Campanha de origem: ${row.campaignNote}`,
                            type: "note",
                        }
                    });
                }
            } catch (err: any) {
                errors.push(`Linha ${i + 2}: ${err.message || "Erro desconhecido"}`);
            }
        }

        return { clientsCreated, dealsCreated, errors, totalRows: items.length };
    },


    async list(jwtUser: JwtUser, query: { search?: string; status?: string; segment?: string }) {
        const fullUser = await usersRepository.findById(jwtUser.userId);
        if (!fullUser) throw new AppError("Usuário não encontrado", 404);

        let whereClause: Prisma.ClientWhereInput = {};

        // 1. DATA SCOPE ENFORCEMENT
        const isSuperAdmin = fullUser.role === "OWNER";
        const crmPermission = fullUser.permissions?.find((p: any) => p.module === "crm.clients" && p.action === "view");

        if (!isSuperAdmin) {
            if (!crmPermission) {
                return [];
            }
            if (crmPermission.dataScope === "OWN") {
                whereClause.OR = [
                    { userId: fullUser.id },
                    { deals: { some: { OR: [{ consultantId: fullUser.id }, { assigneeIds: { has: fullUser.id } }] } } }
                ];
            }
        }

        // 2. FILTERS
        if (query.status && query.status !== "all") {
            whereClause.status = query.status;
        }

        if (query.segment && query.segment !== "all") {
            whereClause.segment = query.segment;
        }

        if (query.search) {
            whereClause.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { company: { contains: query.search, mode: "insensitive" } },
                { email: { contains: query.search, mode: "insensitive" } },
            ];
        }

        return clientsRepository.findAll(whereClause);
    },

    async getById(id: string, jwtUser: JwtUser) {
        const client = await clientsRepository.findById(id);
        if (!client) {
            throw new AppError("Cliente não encontrado", 404);
        }

        const fullUser = await usersRepository.findById(jwtUser.userId);
        if (!fullUser) throw new AppError("Usuário não encontrado", 404);

        // Data scope check
        const isSuperAdmin = fullUser.role === "OWNER";
        const crmPermission = fullUser.permissions?.find((p: any) => p.module === "crm.clients" && p.action === "view");

        if (!isSuperAdmin && crmPermission?.dataScope === "OWN") {
            if (client.userId !== fullUser.id) {
                const hasAssignedDeal = await prisma.deal.findFirst({
                    where: {
                        clientId: id,
                        OR: [{ consultantId: fullUser.id }, { assigneeIds: { has: fullUser.id } }]
                    }
                });
                if (!hasAssignedDeal) {
                    throw new AppError("Acesso negado", 403);
                }
            }
        }

        return client;
    },

    async update(id: string, data: any, jwtUser: JwtUser) {
        await this.getById(id, jwtUser);

        const { contacts, portalPassword, ...clientData } = data;

        // Ensure Portal user if requested
        if (portalPassword && clientData.email) {
            const emailStr = String(clientData.email).trim().toLowerCase();
            const passStr = String(portalPassword).trim();
            const hashedPassword = await hashPassword(passStr);

            const userExists = await prisma.user.findUnique({ where: { email: emailStr } });
            if (userExists) {
                await prisma.user.update({
                    where: { id: userExists.id },
                    data: { password: hashedPassword, role: "VIEWER", allowedApps: ["client"], twoFactorEnabled: false }
                });
            } else {
                await prisma.user.create({
                    data: {
                        name: clientData.name || "Cliente",
                        email: emailStr,
                        password: hashedPassword,
                        role: "VIEWER",
                        allowedApps: ["client"],
                        twoFactorEnabled: false
                    }
                });
            }
        }

        const updatePayload: Prisma.ClientUncheckedUpdateInput = {
            ...clientData,
        };

        // Chaves de identidade acompanham a edição — sem isso, corrigir o telefone de um
        // contato deixaria a chave velha para trás e o próximo lead da mesma pessoa não
        // seria reconhecido.
        if ("email" in clientData || "phone" in clientData) {
            const current = await prisma.client.findUnique({
                where: { id },
                select: { email: true, phone: true },
            });
            const identity = contactIdentity(
                "email" in clientData ? clientData.email : current?.email,
                "phone" in clientData ? clientData.phone : current?.phone,
            );
            if ("email" in clientData) {
                updatePayload.email = identity.emailKey ?? clientData.email ?? null;
            }
            updatePayload.emailKey = identity.emailKey;
            updatePayload.phoneKey = identity.phoneKey;
        }

        if (contacts) {
            updatePayload.contacts = {
                deleteMany: {}, // Clear existing
                create: contacts.map((c: any) => ({
                    name: c.name,
                    email: c.email,
                    phone: c.phone,
                    role: c.role,
                    isPrimary: c.isPrimary || false,
                }))
            };
        }

        return clientsRepository.update(id, updatePayload);
    },

    async delete(id: string, jwtUser: JwtUser) {
        await this.getById(id, jwtUser);
        return clientsRepository.delete(id);
    },
};
