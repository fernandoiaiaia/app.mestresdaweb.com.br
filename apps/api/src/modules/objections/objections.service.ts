import { prisma } from "../../config/database.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

interface JwtUser { userId: string; role: string; }

export const objectionsService = {
    // ═══ Categories ═══

    async listCategories(user: JwtUser) {
        const ownerId = await getOwnerUserId();
        return prisma.objectionCategory.findMany({
            where: ownerId ? { userId: ownerId } : {},
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
                userId: (await getOwnerUserId()) || user.userId,
            },
        });
    },

    async updateCategory(id: string, data: { name?: string; emoji?: string; color?: string }, user: JwtUser) {
        return prisma.objectionCategory.update({
            where: { id },
            data,
        });
    },

    async deleteCategory(id: string, user: JwtUser) {
        const fallback = await prisma.objectionCategory.findFirst({
            where: { id: { not: id } },
        });
        if (fallback) {
            await prisma.objection.updateMany({
                where: { categoryId: id},
                data: { categoryId: fallback.id },
            });
        }
        return prisma.objectionCategory.delete({ where: { id } });
    },

    // ═══ Objections ═══

    async listObjections(user: JwtUser) {
        const ownerId = await getOwnerUserId();
        return prisma.objection.findMany({
            where: ownerId ? { userId: ownerId } : {},
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
                userId: (await getOwnerUserId()) || user.userId,
            },
            include: {
                category: { select: { id: true, name: true, emoji: true, color: true } },
            },
        });
    },

    async updateObjection(id: string, data: any, user: JwtUser) {
        return prisma.objection.update({
            where: { id },
            data,
            include: {
                category: { select: { id: true, name: true, emoji: true, color: true } },
            },
        });
    },

    async toggleObjection(id: string, user: JwtUser) {
        const obj = await prisma.objection.findFirst({ where: { id } });
        if (!obj) throw new Error("Objeção não encontrada");
        return prisma.objection.update({
            where: { id },
            data: { active: !obj.active },
            include: {
                category: { select: { id: true, name: true, emoji: true, color: true } },
            },
        });
    },

    async deleteObjection(id: string, user: JwtUser) {
        return prisma.objection.delete({ where: { id } });
    },
};
