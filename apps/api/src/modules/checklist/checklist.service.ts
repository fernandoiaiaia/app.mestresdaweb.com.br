import { prisma } from "../../config/database.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

interface JwtUser { userId: string; role: string; }

export const checklistService = {
    // ═══ Categories ═══
    async listCategories(user: JwtUser) {
        const ownerId = await getOwnerUserId();
        return prisma.checklistCategory.findMany({
            where: ownerId ? { userId: ownerId } : {},
            include: { _count: { select: { questions: true } } },
            orderBy: { createdAt: "asc" },
        });
    },

    async createCategory(data: { name: string; color?: string }, user: JwtUser) {
        return prisma.checklistCategory.create({
            data: { name: data.name, color: data.color || "#3b82f6", userId: (await getOwnerUserId()) || user.userId },
        });
    },

    async updateCategory(id: string, data: { name?: string; color?: string }, user: JwtUser) {
        return prisma.checklistCategory.update({ where: { id }, data });
    },

    async deleteCategory(id: string, user: JwtUser) {
        const fallback = await prisma.checklistCategory.findFirst({ where: { id: { not: id } } });
        if (fallback) {
            await prisma.checklistQuestion.updateMany({ where: { categoryId: id}, data: { categoryId: fallback.id } });
        }
        return prisma.checklistCategory.delete({ where: { id } });
    },

    // ═══ Questions ═══
    async listQuestions(user: JwtUser) {
        const ownerId = await getOwnerUserId();
        return prisma.checklistQuestion.findMany({
            where: ownerId ? { userId: ownerId } : {},
            include: { category: { select: { id: true, name: true, color: true } } },
            orderBy: { sortOrder: "asc" },
        });
    },

    async createQuestion(data: { text: string; categoryId: string; defaultValue?: string | null; isRequired?: boolean }, user: JwtUser) {
        const maxOrder = await prisma.checklistQuestion.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
        return prisma.checklistQuestion.create({
            data: {
                text: data.text,
                categoryId: data.categoryId,
                defaultValue: data.defaultValue || null,
                isRequired: data.isRequired ?? false,
                sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
                userId: (await getOwnerUserId()) || user.userId,
            },
            include: { category: { select: { id: true, name: true, color: true } } },
        });
    },

    async updateQuestion(id: string, data: any, user: JwtUser) {
        return prisma.checklistQuestion.update({
            where: { id },
            data,
            include: { category: { select: { id: true, name: true, color: true } } },
        });
    },

    async deleteQuestion(id: string, user: JwtUser) {
        return prisma.checklistQuestion.delete({ where: { id } });
    },
};
