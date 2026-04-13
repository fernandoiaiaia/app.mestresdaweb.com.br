import { prisma } from "../../config/database.js";

interface JwtUser {
    userId: string;
    role: string;
}

export const lossReasonsService = {
    // ═══ Loss Reasons ═══

    async listReasons(user: JwtUser) {
        return prisma.lossReason.findMany({
            where: { userId: user.userId },
            include: {
                funnel: {
                    select: { id: true, name: true },
                },
                stage: {
                    select: { id: true, name: true, color: true },
                },
            },
            orderBy: { usageCount: "desc" },
        });
    },

    async createReason(data: { name: string; description?: string | null; funnelId: string; stageId: string; active?: boolean }, user: JwtUser) {
        return prisma.lossReason.create({
            data: {
                name: data.name,
                description: data.description || null,
                funnelId: data.funnelId,
                stageId: data.stageId,
                active: data.active ?? true,
                userId: user.userId,
            },
            include: {
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true, color: true } },
            },
        });
    },

    async updateReason(id: string, data: { name?: string; description?: string | null; funnelId?: string; stageId?: string; active?: boolean }, user: JwtUser) {
        return prisma.lossReason.update({
            where: { id, userId: user.userId },
            data,
            include: {
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true, color: true } },
            },
        });
    },

    async deleteReason(id: string, user: JwtUser) {
        return prisma.lossReason.delete({
            where: { id, userId: user.userId },
        });
    },

    async incrementUsage(id: string, user: JwtUser) {
        return prisma.lossReason.update({
            where: { id, userId: user.userId },
            data: {
                usageCount: { increment: 1 },
                lastUsed: new Date(),
            },
        });
    },
};
