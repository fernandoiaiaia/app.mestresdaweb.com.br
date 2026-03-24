import { prisma } from "../../config/database.js";
import { Prisma } from "@prisma/client";

export const leadsRepository = {
    async create(data: Prisma.LeadUncheckedCreateInput) {
        return prisma.lead.create({ data });
    },

    async findById(id: string) {
        return prisma.lead.findUnique({
            where: { id },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
    },

    async findAll(whereClause: Prisma.LeadWhereInput = {}) {
        return prisma.lead.findMany({
            where: whereClause,
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
        });
    },
};
