import { prisma } from "../../config/database.js";

interface JwtUser {
    userId: string;
    role: string;
}

interface CreateCadenceDto {
    name: string;
    description?: string;
}

interface UpdateCadenceDto {
    name?: string;
    description?: string;
}

interface AddStepDto {
    type: string;
    title: string;
    delay?: number;
    delayUnit?: string;
}

export const cadencesService = {
    async list(user: JwtUser) {
        return prisma.cadence.findMany({
            where: { userId: user.userId },
            include: {
                steps: {
                    orderBy: { orderIndex: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    async create(data: CreateCadenceDto, user: JwtUser) {
        return prisma.cadence.create({
            data: {
                name: data.name,
                description: data.description,
                userId: user.userId,
                status: "draft"
            },
            include: { steps: true }
        });
    },

    async update(id: string, data: UpdateCadenceDto, user: JwtUser) {
        return prisma.cadence.update({
            where: { id, userId: user.userId },
            data
        });
    },

    async updateStatus(id: string, status: string, user: JwtUser) {
        return prisma.cadence.update({
            where: { id, userId: user.userId },
            data: { status }
        });
    },

    async delete(id: string, user: JwtUser) {
        return prisma.cadence.delete({
            where: { id, userId: user.userId }
        });
    },

    async addStep(cadenceId: string, data: AddStepDto, user: JwtUser) {
        const cadence = await prisma.cadence.findUnique({
            where: { id: cadenceId, userId: user.userId },
            include: { steps: true }
        });

        if (!cadence) throw new Error("Cadência não encontrada");

        const count = cadence.steps.length;

        return prisma.cadenceStep.create({
            data: {
                cadenceId,
                type: data.type,
                title: data.title,
                delay: data.delay || 0,
                delayUnit: data.delayUnit || "days",
                orderIndex: count
            }
        });
    },

    async deleteStep(cadenceId: string, stepId: string, user: JwtUser) {
        const cadence = await prisma.cadence.findUnique({
            where: { id: cadenceId, userId: user.userId }
        });
        if (!cadence) throw new Error("Cadência não encontrada");

        return prisma.cadenceStep.delete({
            where: { id: stepId, cadenceId }
        });
    }
};
