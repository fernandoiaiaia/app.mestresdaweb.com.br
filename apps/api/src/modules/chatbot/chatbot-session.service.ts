import { prisma } from "../../config/database.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

export const chatbotSessionService = {
    async list(filters?: { status?: string; flowId?: string }) {
        const ownerId = await getOwnerUserId();
        if (!ownerId) return [];
        const where: any = { flow: { userId: ownerId } };
        if (filters?.status) where.status = filters.status;
        if (filters?.flowId) where.flowId = filters.flowId;

        return prisma.chatbotSession.findMany({
            where,
            include: {
                flow: { select: { id: true, name: true, mode: true } },
                conversation: {
                    select: {
                        id: true,
                        contact: { select: { id: true, phone: true, profileName: true } },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
            take: 100,
        });
    },

    async getById(id: string) {
        return prisma.chatbotSession.findUnique({
            where: { id },
            include: {
                flow: true,
                conversation: {
                    include: {
                        contact: true,
                        messages: { orderBy: { timestamp: "desc" }, take: 50 },
                    },
                },
            },
        });
    },

    async transfer(id: string) {
        return prisma.chatbotSession.update({
            where: { id },
            data: { status: "transferred", transferredAt: new Date() },
        });
    },

    async getStats() {
        const ownerId = await getOwnerUserId();
        if (!ownerId) return { total: 0, completed: 0, transferred: 0, active: 0, avgMessages: 0 };

        const [total, completed, transferred, active, msgAgg] = await Promise.all([
            prisma.chatbotSession.count({ where: { flow: { userId: ownerId } } }),
            prisma.chatbotSession.count({ where: { flow: { userId: ownerId }, status: "completed" } }),
            prisma.chatbotSession.count({ where: { flow: { userId: ownerId }, status: "transferred" } }),
            prisma.chatbotSession.count({ where: { flow: { userId: ownerId }, status: "active" } }),
            prisma.chatbotSession.aggregate({
                where: { flow: { userId: ownerId } },
                _avg: { messageCount: true },
            }),
        ]);

        return {
            total,
            completed,
            transferred,
            active,
            avgMessages: Math.round(msgAgg._avg.messageCount || 0),
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    },
};
