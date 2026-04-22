import { prisma } from "../../config/database.js";

interface JwtUser {
    userId: string;
    role: string;
}

interface CreateFunnelDto {
    name: string;
    description?: string;
    assigneeIds?: string[];
}

interface UpdateFunnelDto {
    name?: string;
    description?: string;
    active?: boolean;
    isDefault?: boolean;
    assigneeIds?: string[];
}

interface AddStageDto {
    name: string;
    color?: string;
}

interface UpdateStageDto {
    name?: string;
    color?: string;
}

interface ReorderStagesDto {
    stageIds: string[];
}

interface ReorderFunnelsDto {
    funnelIds: string[];
}

export const funnelsService = {
    async list(user: JwtUser) {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId }
        });

        const allowedFunnels: string[] = (dbUser as any)?.allowedFunnels || [];
        let whereClause: any = { userId: user.userId };
        
        if (allowedFunnels.length > 0) {
            whereClause = {
                OR: [
                    { userId: user.userId },
                    { id: { in: allowedFunnels } }
                ]
            };
        }

        const funnels = await prisma.funnel.findMany({
            where: whereClause,
            include: {
                stages: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        _count: {
                            select: { deals: true }
                        }
                    }
                }
            },
            orderBy: { orderIndex: 'asc' }
        });

        return funnels.map((f: any) => ({
            ...f,
            stages: f.stages.map((s: any) => ({
                ...s,
                deals: s._count.deals,
                value: 0,
            }))
        }));
    },

    async create(data: CreateFunnelDto, user: JwtUser) {
        const existingFunnelsCount = await prisma.funnel.count({
            where: { userId: user.userId }
        });

        return prisma.funnel.create({
            data: {
                name: data.name,
                description: data.description,
                userId: user.userId,
                isDefault: existingFunnelsCount === 0,
                orderIndex: existingFunnelsCount,
                assigneeIds: data.assigneeIds || [],
                stages: {
                    create: [
                        { name: "Novo Lead", color: "blue", orderIndex: 0 },
                        { name: "Fechado — Ganho", color: "green", orderIndex: 1 },
                        { name: "Fechado — Perdido", color: "red", orderIndex: 2 }
                    ]
                }
            },
            include: { stages: true }
        });
    },

    async update(id: string, data: UpdateFunnelDto, user: JwtUser) {
        if (data.isDefault) {
            await prisma.funnel.updateMany({
                where: { userId: user.userId },
                data: { isDefault: false }
            });
        }
        const updateData: any = { ...data };
        // Reset Round-Robin pointer when assignees change
        if (data.assigneeIds) {
            updateData.lastAssignedIndex = -1;
        }
        return prisma.funnel.update({
            where: { id, userId: user.userId },
            data: updateData
        });
    },

    async delete(id: string, user: JwtUser) {
        return prisma.funnel.delete({
            where: { id, userId: user.userId }
        });
    },

    async addStage(funnelId: string, data: AddStageDto, user: JwtUser) {
        const funnel = await prisma.funnel.findUnique({
            where: { id: funnelId, userId: user.userId },
            include: { stages: true }
        });
        if (!funnel) throw new Error("Funil não encontrado");

        const count = funnel.stages.length;

        return prisma.funnelStage.create({
            data: {
                funnelId,
                name: data.name,
                color: data.color || "blue",
                orderIndex: count
            }
        });
    },

    async updateStage(funnelId: string, stageId: string, data: UpdateStageDto, user: JwtUser) {
        const funnel = await prisma.funnel.findUnique({
            where: { id: funnelId, userId: user.userId }
        });
        if (!funnel) throw new Error("Funil não encontrado");

        return prisma.funnelStage.update({
            where: { id: stageId, funnelId },
            data
        });
    },

    async deleteStage(funnelId: string, stageId: string, user: JwtUser) {
        const funnel = await prisma.funnel.findUnique({
            where: { id: funnelId, userId: user.userId }
        });
        if (!funnel) throw new Error("Funil não encontrado");

        return prisma.funnelStage.delete({
            where: { id: stageId, funnelId }
        });
    },

    async reorderStages(funnelId: string, data: ReorderStagesDto, user: JwtUser) {
        const funnel = await prisma.funnel.findUnique({
            where: { id: funnelId, userId: user.userId }
        });
        if (!funnel) throw new Error("Funil não encontrado");

        return prisma.$transaction(
            data.stageIds.map((id, index) =>
                prisma.funnelStage.update({
                    where: { id, funnelId },
                    data: { orderIndex: index }
                })
            )
        );
    },

    async reorderFunnels(data: ReorderFunnelsDto, user: JwtUser) {
        return prisma.$transaction(
            data.funnelIds.map((id, index) =>
                prisma.funnel.update({
                    where: { id, userId: user.userId },
                    data: { orderIndex: index }
                })
            )
        );
    }
};
