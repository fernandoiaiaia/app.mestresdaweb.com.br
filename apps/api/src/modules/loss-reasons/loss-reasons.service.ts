import { prisma } from "../../config/database.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

interface JwtUser {
    userId: string;
    role: string;
}

export const lossReasonsService = {
    // ═══ Loss Reasons (Universal / Company-wide) ═══

    async listReasons(user: JwtUser) {
        // Busca pelo OWNER para garantir que todos vejam os mesmos dados
        const ownerId = await getOwnerUserId();
        return prisma.lossReason.findMany({
            where: ownerId ? { userId: ownerId } : {},
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
        // Sempre cria vinculado ao OWNER para ser universal
        const ownerId = await getOwnerUserId();
        return prisma.lossReason.create({
            data: {
                name: data.name,
                description: data.description || null,
                funnelId: data.funnelId,
                stageId: data.stageId,
                active: data.active ?? true,
                userId: ownerId || user.userId,
            },
            include: {
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true, color: true } },
            },
        });
    },

    async updateReason(id: string, data: { name?: string; description?: string | null; funnelId?: string; stageId?: string; active?: boolean }, user: JwtUser) {
        return prisma.lossReason.update({
            where: { id },
            data,
            include: {
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true, color: true } },
            },
        });
    },

    async deleteReason(id: string, user: JwtUser) {
        return prisma.lossReason.delete({
            where: { id },
        });
    },

    async incrementUsage(id: string, user: JwtUser) {
        return prisma.lossReason.update({
            where: { id },
            data: {
                usageCount: { increment: 1 },
                lastUsed: new Date(),
            },
        });
    },
};
