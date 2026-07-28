import { prisma } from "../../config/database.js";
import { AppError } from "../../lib/errors.js";

export const paymentMethodsService = {
    async list(userId: string) {
        return prisma.paymentMethod.findMany({
            distinct: ["name"],
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string, userId: string) {
        const item = await prisma.paymentMethod.findUnique({
            where: { id },
        });

        if (!item) {
            throw new AppError("Forma de pagamento não encontrada.", 404);
        }

        if (item.userId !== userId) {
            throw new AppError("Acesso negado.", 403);
        }

        return item;
    },

    async create(userId: string, data: { name: string; active?: boolean }) {
        if (!data.name) {
            throw new AppError("Nome é obrigatório.", 400);
        }

        return prisma.paymentMethod.create({
            data: {
                userId,
                name: data.name,
                active: data.active ?? true,
            },
        });
    },

    async update(id: string, userId: string, data: { name?: string; active?: boolean }) {
        await this.getById(id, userId); // verify ownership

        return prisma.paymentMethod.update({
            where: { id },
            data,
        });
    },

    async delete(id: string, userId: string) {
        await this.getById(id, userId); // verify ownership

        await prisma.paymentMethod.delete({
            where: { id },
        });

        return true;
    },
};
