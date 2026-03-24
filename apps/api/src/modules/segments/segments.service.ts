import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; role: string; }

export const segmentsService = {
    async list(user: JwtUser) {
        return prisma.segment.findMany({
            where: { userId: user.userId },
            orderBy: { clientCount: "desc" },
        });
    },

    async create(data: { name: string; description?: string | null; color?: string }, user: JwtUser) {
        return prisma.segment.create({
            data: {
                name: data.name,
                description: data.description || null,
                color: data.color || "blue",
                userId: user.userId,
            },
        });
    },

    async update(id: string, data: any, user: JwtUser) {
        return prisma.segment.update({
            where: { id, userId: user.userId },
            data,
        });
    },

    async toggleActive(id: string, user: JwtUser) {
        const seg = await prisma.segment.findFirst({ where: { id, userId: user.userId } });
        if (!seg) throw new Error("Segmento não encontrado");
        return prisma.segment.update({
            where: { id, userId: user.userId },
            data: { active: !seg.active },
        });
    },

    async delete(id: string, user: JwtUser) {
        return prisma.segment.delete({ where: { id, userId: user.userId } });
    },
};
