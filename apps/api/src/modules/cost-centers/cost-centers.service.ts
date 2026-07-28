import { prisma } from "../../config/database.js";
import { AppError } from "../../lib/errors.js";

export const costCentersService = {
    async list(userId: string) {
        return prisma.costCenter.findMany({
            distinct: ["name"],
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string, userId: string) {
        const costCenter = await prisma.costCenter.findUnique({
            where: { id },
        });

        if (!costCenter) {
            throw new AppError("Centro de custo não encontrado.", 404);
        }

        if (costCenter.userId !== userId) {
            throw new AppError("Acesso negado.", 403);
        }

        return costCenter;
    },

    async create(userId: string, data: { name: string; code?: string; active?: boolean; budget?: number; notes?: string }) {
        if (!data.name) {
            throw new AppError("Nome é obrigatório.", 400);
        }

        return prisma.costCenter.create({
            data: {
                userId,
                name: data.name,
                code: data.code,
                active: data.active ?? true,
                budget: data.budget ?? 0,
                notes: data.notes,
            },
        });
    },

    async update(id: string, userId: string, data: { name?: string; code?: string; active?: boolean; budget?: number; notes?: string }) {
        await this.getById(id, userId); // verify ownership

        return prisma.costCenter.update({
            where: { id },
            data,
        });
    },

    async delete(id: string, userId: string) {
        await this.getById(id, userId); // verify ownership

        await prisma.costCenter.delete({
            where: { id },
        });

        return true;
    },
};
