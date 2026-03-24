import { prisma } from "../../config/database.js";
import { AppError } from "../../lib/errors.js";
import { Prisma } from "@prisma/client";

interface JwtUser {
    userId: string;
    role: string;
}

export const companiesService = {
    async create(data: any, jwtUser: JwtUser) {
        const { clientIds, ...companyData } = data;

        const company = await prisma.company.create({
            data: {
                ...companyData,
                userId: jwtUser.userId,
            },
            include: {
                clients: {
                    select: { id: true, name: true, email: true, phone: true, role: true, status: true },
                },
            },
        });

        // Link selected contacts to this company
        if (clientIds && clientIds.length > 0) {
            await prisma.client.updateMany({
                where: {
                    id: { in: clientIds },
                    companyId: null, // only unassigned
                    userId: jwtUser.userId,
                },
                data: { companyId: company.id },
            });

            // Re-fetch with linked clients
            return prisma.company.findUnique({
                where: { id: company.id },
                include: {
                    clients: {
                        select: { id: true, name: true, email: true, phone: true, role: true, status: true },
                    },
                },
            });
        }

        return company;
    },

    async list(jwtUser: JwtUser, query: { search?: string; status?: string; segment?: string }) {
        const whereClause: Prisma.CompanyWhereInput = {
            userId: jwtUser.userId,
        };

        if (query.status && query.status !== "all") {
            whereClause.status = query.status;
        }

        if (query.segment && query.segment !== "all") {
            whereClause.segment = query.segment;
        }

        if (query.search) {
            whereClause.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { cnpj: { contains: query.search, mode: "insensitive" } },
            ];
        }

        return prisma.company.findMany({
            where: whereClause,
            include: {
                clients: {
                    select: { id: true, name: true, email: true, phone: true, role: true, status: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string, jwtUser: JwtUser) {
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                clients: {
                    select: { id: true, name: true, email: true, phone: true, role: true, status: true },
                },
            },
        });

        if (!company) {
            throw new AppError("Empresa não encontrada", 404);
        }

        if (company.userId !== jwtUser.userId) {
            throw new AppError("Acesso negado", 403);
        }

        return company;
    },

    async update(id: string, data: any, jwtUser: JwtUser) {
        await this.getById(id, jwtUser);

        const { clientIds, ...companyData } = data;

        const company = await prisma.company.update({
            where: { id },
            data: companyData,
            include: {
                clients: {
                    select: { id: true, name: true, email: true, phone: true, role: true, status: true },
                },
            },
        });

        // Re-link contacts if clientIds provided
        if (clientIds !== undefined) {
            // Unlink all current contacts from this company
            await prisma.client.updateMany({
                where: { companyId: id },
                data: { companyId: null },
            });

            // Link new contacts
            if (clientIds.length > 0) {
                await prisma.client.updateMany({
                    where: {
                        id: { in: clientIds },
                        userId: jwtUser.userId,
                    },
                    data: { companyId: id },
                });
            }

            // Re-fetch with updated contacts
            return prisma.company.findUnique({
                where: { id },
                include: {
                    clients: {
                        select: { id: true, name: true, email: true, phone: true, role: true, status: true },
                    },
                },
            });
        }

        return company;
    },

    async delete(id: string, jwtUser: JwtUser) {
        await this.getById(id, jwtUser);

        // Unlink clients before deleting (set companyId to null)
        await prisma.client.updateMany({
            where: { companyId: id },
            data: { companyId: null },
        });

        return prisma.company.delete({
            where: { id },
        });
    },
};
