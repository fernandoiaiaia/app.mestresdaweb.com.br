import { prisma } from "../../config/database.js";
import { AppError } from "../../lib/errors.js";

export const transactionTypesService = {
    async list(userId: string) {
        return prisma.transactionType.findMany({
            distinct: ["name"],
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string, userId: string) {
        const item = await prisma.transactionType.findUnique({
            where: { id },
        });

        if (!item) {
            throw new AppError("Tipo não encontrado.", 404);
        }

        if (item.userId !== userId) {
            throw new AppError("Acesso negado.", 403);
        }

        return item;
    },

    async create(userId: string, data: { name: string; nature: string; active?: boolean }) {
        if (!data.name || !data.nature) {
            throw new AppError("Nome e Natureza são obrigatórios.", 400);
        }

        return prisma.transactionType.create({
            data: {
                userId,
                name: data.name,
                nature: data.nature,
                active: data.active ?? true,
            },
        });
    },

    async update(id: string, userId: string, data: { name?: string; nature?: string; active?: boolean }) {
        await this.getById(id, userId); // verify ownership

        return prisma.transactionType.update({
            where: { id },
            data,
        });
    },

    async delete(id: string, userId: string) {
        await this.getById(id, userId); // verify ownership

        await prisma.transactionType.delete({
            where: { id },
        });

        return true;
    },
};
