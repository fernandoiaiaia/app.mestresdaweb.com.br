import { prisma } from "../../config/database.js";
import { AppError } from "../../lib/errors.js";

export const categoriesService = {
    async list(userId: string) {
        return prisma.transactionCategory.findMany({
            distinct: ["name", "typeGroup"],
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string, userId: string) {
        const category = await prisma.transactionCategory.findUnique({
            where: { id },
        });

        if (!category) {
            throw new AppError("Categoria não encontrada.", 404);
        }

        if (category.userId !== userId) {
            throw new AppError("Acesso negado.", 403);
        }

        return category;
    },

    async create(userId: string, data: { name: string; typeGroup: string; active?: boolean }) {
        if (!data.name || !data.typeGroup) {
            throw new AppError("Nome e Grupo são obrigatórios.", 400);
        }

        return prisma.transactionCategory.create({
            data: {
                userId,
                name: data.name,
                typeGroup: data.typeGroup,
                active: data.active ?? true,
            },
        });
    },

    async update(id: string, userId: string, data: { name?: string; typeGroup?: string; active?: boolean }) {
        await this.getById(id, userId); // verify ownership

        return prisma.transactionCategory.update({
            where: { id },
            data,
        });
    },

    async delete(id: string, userId: string) {
        await this.getById(id, userId); // verify ownership

        await prisma.transactionCategory.delete({
            where: { id },
        });

        return true;
    },
};
