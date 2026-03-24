import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; role: string; }

export const sourcesService = {
    // ═══ Source Types ═══

    async listTypes(user: JwtUser) {
        return prisma.sourceType.findMany({
            where: { userId: user.userId },
            include: { _count: { select: { sources: true } } },
            orderBy: { createdAt: "asc" },
        });
    },

    async createType(data: { name: string; emoji?: string; color?: string }, user: JwtUser) {
        return prisma.sourceType.create({
            data: {
                name: data.name,
                emoji: data.emoji || "🌐",
                color: data.color || "#22c55e",
                userId: user.userId,
            },
        });
    },

    async updateType(id: string, data: { name?: string; emoji?: string; color?: string }, user: JwtUser) {
        return prisma.sourceType.update({
            where: { id, userId: user.userId },
            data,
        });
    },

    async deleteType(id: string, user: JwtUser) {
        const fallback = await prisma.sourceType.findFirst({
            where: { userId: user.userId, id: { not: id } },
        });
        if (fallback) {
            await prisma.source.updateMany({
                where: { typeId: id, userId: user.userId },
                data: { typeId: fallback.id },
            });
        }
        return prisma.sourceType.delete({ where: { id, userId: user.userId } });
    },

    // ═══ Sources ═══

    async listSources(user: JwtUser) {
        return prisma.source.findMany({
            where: { userId: user.userId },
            include: {
                type: { select: { id: true, name: true, emoji: true, color: true } },
                campaigns: { orderBy: { createdAt: "asc" } },
            },
            orderBy: { leads: "desc" },
        });
    },

    async createSource(data: { name: string; description?: string | null; typeId: string }, user: JwtUser) {
        return prisma.source.create({
            data: {
                name: data.name,
                description: data.description || null,
                typeId: data.typeId,
                userId: user.userId,
            },
            include: {
                type: { select: { id: true, name: true, emoji: true, color: true } },
                campaigns: true,
            },
        });
    },

    async updateSource(id: string, data: any, user: JwtUser) {
        return prisma.source.update({
            where: { id, userId: user.userId },
            data,
            include: {
                type: { select: { id: true, name: true, emoji: true, color: true } },
                campaigns: true,
            },
        });
    },

    async toggleSource(id: string, user: JwtUser) {
        const source = await prisma.source.findFirst({ where: { id, userId: user.userId } });
        if (!source) throw new Error("Fonte não encontrada");
        return prisma.source.update({
            where: { id, userId: user.userId },
            data: { active: !source.active },
            include: {
                type: { select: { id: true, name: true, emoji: true, color: true } },
                campaigns: true,
            },
        });
    },

    async deleteSource(id: string, user: JwtUser) {
        return prisma.source.delete({ where: { id, userId: user.userId } });
    },

    // ═══ Campaigns ═══

    async createCampaign(sourceId: string, data: { name: string; utm?: string | null }, user: JwtUser) {
        return prisma.sourceCampaign.create({
            data: {
                name: data.name,
                utm: data.utm || null,
                sourceId,
                userId: user.userId,
            },
        });
    },

    async updateCampaign(campaignId: string, data: { name?: string; utm?: string | null }, user: JwtUser) {
        return prisma.sourceCampaign.update({
            where: { id: campaignId, userId: user.userId },
            data,
        });
    },

    async toggleCampaign(campaignId: string, user: JwtUser) {
        const camp = await prisma.sourceCampaign.findFirst({ where: { id: campaignId, userId: user.userId } });
        if (!camp) throw new Error("Campanha não encontrada");
        return prisma.sourceCampaign.update({
            where: { id: campaignId, userId: user.userId },
            data: { active: !camp.active },
        });
    },

    async deleteCampaign(campaignId: string, user: JwtUser) {
        return prisma.sourceCampaign.delete({ where: { id: campaignId, userId: user.userId } });
    },
};
