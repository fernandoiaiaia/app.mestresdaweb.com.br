import { prisma } from "../../config/database.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

interface JwtUser { userId: string; role: string; }

export const segmentsService = {
    async list(user: JwtUser) {
        const ownerId = await getOwnerUserId();
        return prisma.segment.findMany({
            where: ownerId ? { userId: ownerId } : {},
            orderBy: { clientCount: "desc" },
        });
    },

    async create(data: { name: string; description?: string | null; color?: string }, user: JwtUser) {
        return prisma.segment.create({
            data: {
                name: data.name,
                description: data.description || null,
                color: data.color || "blue",
                userId: (await getOwnerUserId()) || user.userId,
            },
        });
    },

    async update(id: string, data: any, user: JwtUser) {
        return prisma.segment.update({
            where: { id },
            data,
        });
    },

    async toggleActive(id: string, user: JwtUser) {
        const seg = await prisma.segment.findFirst({ where: { id } });
        if (!seg) throw new Error("Segmento não encontrado");
        return prisma.segment.update({
            where: { id },
            data: { active: !seg.active },
        });
    },

    async delete(id: string, user: JwtUser) {
        return prisma.segment.delete({ where: { id } });
    },
};
