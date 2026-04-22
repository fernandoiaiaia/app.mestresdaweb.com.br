import { prisma } from "../../config/database.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

export const chatbotSettingsService = {
    async get() {
        const ownerId = await getOwnerUserId();
        if (!ownerId) throw new Error("Nenhum OWNER encontrado.");

        let settings = await prisma.chatbotSettings.findUnique({ where: { userId: ownerId } });
        if (!settings) {
            settings = await prisma.chatbotSettings.create({ data: { userId: ownerId } });
        }
        return settings;
    },

    async update(data: any) {
        const ownerId = await getOwnerUserId();
        if (!ownerId) throw new Error("Nenhum OWNER encontrado.");

        return prisma.chatbotSettings.upsert({
            where: { userId: ownerId },
            create: { userId: ownerId, ...data },
            update: data,
        });
    },
};
