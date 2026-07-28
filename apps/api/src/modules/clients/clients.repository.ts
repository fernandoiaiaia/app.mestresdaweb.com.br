import { prisma } from "../../config/database.js";
import { Prisma } from "@prisma/client";

export const clientsRepository = {
    async create(data: Prisma.ClientUncheckedCreateInput) {
        return prisma.client.create({
            data,
            include: { contacts: true },
        });
    },

    async createMany(data: Prisma.ClientCreateManyInput[]) {
        return prisma.client.createMany({
            data,
            skipDuplicates: true,
        });
    },

    async findById(id: string) {
        return prisma.client.findUnique({
            where: { id },
            include: { contacts: true }
        });
    },

    async findAll(whereClause: Prisma.ClientWhereInput = {}) {
        return prisma.client.findMany({
            where: whereClause,
            include: { contacts: true },
            orderBy: { createdAt: "desc" },
        });
    },

    async update(id: string, data: Prisma.ClientUncheckedUpdateInput) {
        return prisma.client.update({
            where: { id },
            data,
            include: { contacts: true },
        });
    },

    async delete(id: string) {
        return prisma.client.delete({
            where: { id },
        });
    },
};
