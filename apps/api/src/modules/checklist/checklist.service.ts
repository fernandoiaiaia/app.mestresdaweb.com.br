import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; role: string; }

export const checklistService = {
    // ═══ Categories ═══
    async listCategories(user: JwtUser) {
        return prisma.checklistCategory.findMany({
            where: { userId: user.userId },
            include: { _count: { select: { questions: true } } },
            orderBy: { createdAt: "asc" },
        });
    },

    async createCategory(data: { name: string; color?: string }, user: JwtUser) {
        return prisma.checklistCategory.create({
            data: { name: data.name, color: data.color || "#3b82f6", userId: user.userId },
        });
    },

    async updateCategory(id: string, data: { name?: string; color?: string }, user: JwtUser) {
        return prisma.checklistCategory.update({ where: { id, userId: user.userId }, data });
    },

    async deleteCategory(id: string, user: JwtUser) {
        const fallback = await prisma.checklistCategory.findFirst({ where: { userId: user.userId, id: { not: id } } });
        if (fallback) {
            await prisma.checklistQuestion.updateMany({ where: { categoryId: id, userId: user.userId }, data: { categoryId: fallback.id } });
        }
        return prisma.checklistCategory.delete({ where: { id, userId: user.userId } });
    },

    // ═══ Questions ═══
    async listQuestions(user: JwtUser) {
        return prisma.checklistQuestion.findMany({
            where: { userId: user.userId },
            include: { category: { select: { id: true, name: true, color: true } } },
            orderBy: { sortOrder: "asc" },
        });
    },

    async createQuestion(data: { text: string; categoryId: string; defaultValue?: string | null; isRequired?: boolean }, user: JwtUser) {
        const maxOrder = await prisma.checklistQuestion.findFirst({ where: { userId: user.userId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
        return prisma.checklistQuestion.create({
            data: {
                text: data.text,
                categoryId: data.categoryId,
                defaultValue: data.defaultValue || null,
                isRequired: data.isRequired ?? false,
                sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
                userId: user.userId,
            },
            include: { category: { select: { id: true, name: true, color: true } } },
        });
    },

    async updateQuestion(id: string, data: any, user: JwtUser) {
        return prisma.checklistQuestion.update({
            where: { id, userId: user.userId },
            data,
            include: { category: { select: { id: true, name: true, color: true } } },
        });
    },

    async deleteQuestion(id: string, user: JwtUser) {
        return prisma.checklistQuestion.delete({ where: { id, userId: user.userId } });
    },
};
