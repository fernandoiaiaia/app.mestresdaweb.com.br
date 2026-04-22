import { prisma } from "../../config/database.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

export const chatbotKnowledgeService = {
    async list() {
        const ownerId = await getOwnerUserId();
        if (!ownerId) return [];
        return prisma.chatbotKnowledge.findMany({
            where: { userId: ownerId },
            orderBy: { createdAt: "desc" },
        });
    },

    async create(data: { title: string; content: string; category?: string }) {
        const ownerId = await getOwnerUserId();
        if (!ownerId) throw new Error("Nenhum OWNER encontrado.");
        return prisma.chatbotKnowledge.create({
            data: { userId: ownerId, title: data.title, content: data.content, category: data.category || null },
        });
    },

    async update(id: string, data: any) {
        return prisma.chatbotKnowledge.update({ where: { id }, data });
    },

    async delete(id: string) {
        return prisma.chatbotKnowledge.delete({ where: { id } });
    },

    /** Get all active KB documents concatenated (for the AI prompt) */
    async getActiveContext(): Promise<string> {
        const ownerId = await getOwnerUserId();
        if (!ownerId) return "";
        const docs = await prisma.chatbotKnowledge.findMany({
            where: { userId: ownerId, isActive: true },
            select: { title: true, content: true },
            orderBy: { createdAt: "asc" },
        });
        if (docs.length === 0) return "";
        return docs.map(d => `## ${d.title}\n${d.content}`).join("\n\n---\n\n");
    },
};
