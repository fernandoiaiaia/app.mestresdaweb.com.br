import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; role: string; }

export const companyBranchesService = {
    async list(user: JwtUser) {
        return prisma.companyBranch.findMany({
            where: { userId: user.userId },
            orderBy: { name: 'asc' }
        });
    },

    async getById(id: string, user: JwtUser) {
        const branch = await prisma.companyBranch.findFirst({
            where: { id, userId: user.userId }
        });
        if (!branch) throw new Error("Filial não encontrada");
        return branch;
    },

    async create(data: any, user: JwtUser) {
        return prisma.companyBranch.create({
            data: {
                ...data,
                userId: user.userId
            }
        });
    },

    async update(id: string, data: any, user: JwtUser) {
        const branch = await this.getById(id, user);
        return prisma.companyBranch.update({
            where: { id: branch.id },
            data
        });
    },

    async delete(id: string, user: JwtUser) {
        const branch = await this.getById(id, user);
        await prisma.companyBranch.delete({
            where: { id: branch.id }
        });
        return { success: true };
    }
};
