import { clientsRepository } from "./clients.repository.js";
import { AppError } from "../../lib/errors.js";
import { Prisma } from "@prisma/client";
import { usersRepository } from "../users/users.repository.js";
import { prisma } from "../../config/database.js";
import { hashPassword } from "../../lib/hash.js";

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

        const createPayload: Prisma.ClientUncheckedCreateInput = {
            ...clientData,
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

        return clientsRepository.create(createPayload);
    },

    async bulkCreate(dataArray: any[], jwtUser: JwtUser) {
        // Assign the creator as the userId for all imported clients
        const clientsForDb = dataArray.map(data => ({
            ...data,
            userId: jwtUser.userId,
        }));
        return clientsRepository.createMany(clientsForDb);
    },

    async list(jwtUser: JwtUser, query: { search?: string; status?: string; segment?: string }) {
        const fullUser = await usersRepository.findById(jwtUser.userId);
        if (!fullUser) throw new AppError("Usuário não encontrado", 404);

        let whereClause: Prisma.ClientWhereInput = {};

        // 1. DATA SCOPE ENFORCEMENT
        const isSuperAdmin = fullUser.role === "OWNER" || fullUser.role === "ADMIN";
        const crmPermission = fullUser.permissions?.find((p: any) => p.module === "crm.clients" && p.action === "view");

        if (!isSuperAdmin) {
            if (!crmPermission) {
                return [];
            }
            if (crmPermission.dataScope === "OWN") {
                whereClause.userId = fullUser.id;
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
        const isSuperAdmin = fullUser.role === "OWNER" || fullUser.role === "ADMIN";
        const crmPermission = fullUser.permissions?.find((p: any) => p.module === "crm.clients" && p.action === "view");

        if (!isSuperAdmin && crmPermission?.dataScope === "OWN" && client.userId !== fullUser.id) {
            throw new AppError("Acesso negado", 403);
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
