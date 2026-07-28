import { prisma } from "../../config/database.js";
import { NotFoundError } from "../../lib/errors.js";

export const bankAccountsService = {
    async list(userId: string) {
        return prisma.bankAccount.findMany({
            where: { isActive: true },
            distinct: ["name"],
            orderBy: { createdAt: "desc" }
        });
    },

    async getById(userId: string, id: string) {
        const account = await prisma.bankAccount.findFirst({
            where: { id, userId }
        });
        if (!account) throw new NotFoundError("Conta bancária não encontrada");
        return account;
    },

    async create(userId: string, data: any) {
        return prisma.bankAccount.create({
            data: {
                ...data,
                userId
            }
        });
    },

    async update(userId: string, id: string, data: any) {
        const account = await this.getById(userId, id);
        return prisma.bankAccount.update({
            where: { id: account.id },
            data
        });
    },

    async delete(userId: string, id: string) {
        const account = await this.getById(userId, id);
        await prisma.bankAccount.delete({
            where: { id: account.id }
        });
    }
};
