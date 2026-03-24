import { prisma } from "../../config/database.js";

interface JwtUser {
    userId: string;
    role: string;
}

export const lossReasonsService = {
    // ═══ Categories ═══

    async listCategories(user: JwtUser) {
        return prisma.lossReasonCategory.findMany({
            where: { userId: user.userId },
            include: {
                _count: { select: { reasons: true } },
            },
            orderBy: { createdAt: "asc" },
        });
    },

    async createCategory(data: { name: string; emoji?: string; color?: string }, user: JwtUser) {
        return prisma.lossReasonCategory.create({
            data: {
                name: data.name,
                emoji: data.emoji || "📋",
                color: data.color || "#64748b",
                userId: user.userId,
            },
        });
    },

    async updateCategory(id: string, data: { name?: string; emoji?: string; color?: string }, user: JwtUser) {
        return prisma.lossReasonCategory.update({
            where: { id, userId: user.userId },
            data,
        });
    },

    async deleteCategory(id: string, user: JwtUser) {
        // Find a fallback category for orphaned reasons
        const fallback = await prisma.lossReasonCategory.findFirst({
            where: { userId: user.userId, id: { not: id } },
        });

        if (fallback) {
            // Move reasons to fallback category
            await prisma.lossReason.updateMany({
                where: { categoryId: id, userId: user.userId },
                data: { categoryId: fallback.id },
            });
        }

        return prisma.lossReasonCategory.delete({
            where: { id, userId: user.userId },
        });
    },

    // ═══ Loss Reasons ═══

    async listReasons(user: JwtUser) {
        return prisma.lossReason.findMany({
            where: { userId: user.userId },
            include: {
                category: {
                    select: { id: true, name: true, emoji: true, color: true },
                },
            },
            orderBy: { usageCount: "desc" },
        });
    },

    async createReason(data: { name: string; description?: string | null; categoryId: string; active?: boolean }, user: JwtUser) {
        return prisma.lossReason.create({
            data: {
                name: data.name,
                description: data.description || null,
                categoryId: data.categoryId,
                active: data.active ?? true,
                userId: user.userId,
            },
            include: {
                category: {
                    select: { id: true, name: true, emoji: true, color: true },
                },
            },
        });
    },

    async updateReason(id: string, data: { name?: string; description?: string | null; categoryId?: string; active?: boolean }, user: JwtUser) {
        return prisma.lossReason.update({
            where: { id, userId: user.userId },
            data,
            include: {
                category: {
                    select: { id: true, name: true, emoji: true, color: true },
                },
            },
        });
    },

    async deleteReason(id: string, user: JwtUser) {
        return prisma.lossReason.delete({
            where: { id, userId: user.userId },
        });
    },

    async incrementUsage(id: string, user: JwtUser) {
        return prisma.lossReason.update({
            where: { id, userId: user.userId },
            data: {
                usageCount: { increment: 1 },
                lastUsed: new Date(),
            },
        });
    },
};
