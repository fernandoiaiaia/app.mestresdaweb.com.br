import { prisma } from "../../config/database.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

export const chatbotFlowService = {
    async list() {
        const ownerId = await getOwnerUserId();
        if (!ownerId) return [];
        return prisma.chatbotFlow.findMany({
            where: { userId: ownerId },
            include: {
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true, color: true } },
                _count: { select: { sessions: true } },
            },
            orderBy: [{ funnelId: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
        });
    },

    async create(data: any) {
        const ownerId = await getOwnerUserId();
        if (!ownerId) throw new Error("Nenhum OWNER encontrado.");
        return prisma.chatbotFlow.create({
            data: {
                userId: ownerId,
                funnelId: data.funnelId,
                stageId: data.stageId,
                name: data.name,
                mode: data.mode || "inbound",
                systemPrompt: data.systemPrompt || "",
                qualificationFields: data.qualificationFields || [],
                autoCreateDeal: data.autoCreateDeal ?? true,
                moveToStageId: data.moveToStageId || null,
                outboundTrigger: data.outboundTrigger || "manual",
                outboundTemplateId: data.outboundTemplateId || null,
                isActive: data.isActive ?? true,
                priority: data.priority ?? 0,
            },
            include: {
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true, color: true } },
            },
        });
    },

    async update(id: string, data: any) {
        return prisma.chatbotFlow.update({
            where: { id },
            data,
            include: {
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true, color: true } },
            },
        });
    },

    async delete(id: string) {
        return prisma.chatbotFlow.delete({ where: { id } });
    },

    /** Find active flows for a given stage (used by the engine) */
    async findActiveForStage(stageId: string, mode?: string) {
        const where: any = { stageId, isActive: true };
        if (mode) where.mode = { in: [mode, "both"] };
        return prisma.chatbotFlow.findMany({
            where,
            orderBy: { priority: "desc" },
            include: { funnel: true, stage: true },
        });
    },
};
