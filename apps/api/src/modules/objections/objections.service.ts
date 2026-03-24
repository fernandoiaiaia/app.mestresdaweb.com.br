import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; role: string; }

export const objectionsService = {
    // ═══ Categories ═══

    async listCategories(user: JwtUser) {
        return prisma.objectionCategory.findMany({
            where: { userId: user.userId },
            include: { _count: { select: { objections: true } } },
            orderBy: { createdAt: "asc" },
        });
    },

    async createCategory(data: { name: string; emoji?: string; color?: string }, user: JwtUser) {
        return prisma.objectionCategory.create({
            data: {
                name: data.name,
                emoji: data.emoji || "💰",
                color: data.color || "#ef4444",
                userId: user.userId,
            },
        });
    },

    async updateCategory(id: string, data: { name?: string; emoji?: string; color?: string }, user: JwtUser) {
        return prisma.objectionCategory.update({
            where: { id, userId: user.userId },
            data,
        });
    },

    async deleteCategory(id: string, user: JwtUser) {
        const fallback = await prisma.objectionCategory.findFirst({
            where: { userId: user.userId, id: { not: id } },
        });
        if (fallback) {
            await prisma.objection.updateMany({
                where: { categoryId: id, userId: user.userId },
                data: { categoryId: fallback.id },
            });
        }
        return prisma.objectionCategory.delete({ where: { id, userId: user.userId } });
    },

    // ═══ Objections ═══

    async listObjections(user: JwtUser) {
        return prisma.objection.findMany({
            where: { userId: user.userId },
            include: {
                category: { select: { id: true, name: true, emoji: true, color: true } },
            },
            orderBy: { usageCount: "desc" },
        });
    },

    async createObjection(data: { objection: string; categoryId: string; scripts?: string[] }, user: JwtUser) {
        return prisma.objection.create({
            data: {
                objection: data.objection,
                categoryId: data.categoryId,
                scripts: data.scripts || [],
                userId: user.userId,
            },
            include: {
                category: { select: { id: true, name: true, emoji: true, color: true } },
            },
        });
    },

    async updateObjection(id: string, data: any, user: JwtUser) {
        return prisma.objection.update({
            where: { id, userId: user.userId },
            data,
            include: {
                category: { select: { id: true, name: true, emoji: true, color: true } },
            },
        });
    },

    async toggleObjection(id: string, user: JwtUser) {
        const obj = await prisma.objection.findFirst({ where: { id, userId: user.userId } });
        if (!obj) throw new Error("Objeção não encontrada");
        return prisma.objection.update({
            where: { id, userId: user.userId },
            data: { active: !obj.active },
            include: {
                category: { select: { id: true, name: true, emoji: true, color: true } },
            },
        });
    },

    async deleteObjection(id: string, user: JwtUser) {
        return prisma.objection.delete({ where: { id, userId: user.userId } });
    },
};
