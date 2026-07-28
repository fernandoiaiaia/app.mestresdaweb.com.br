import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; }

interface PreferenceInput { eventId: string; email: boolean; push: boolean; inApp: boolean; }

export const notificationsService = {
    // ═══ Global Settings ═══
    async getSettings(user: JwtUser) {
        return prisma.notificationSettings.findFirst();
    },

    async upsertSettings(data: any, user: JwtUser) {
        const existing = await prisma.notificationSettings.findFirst();
        if (existing) {
            return prisma.notificationSettings.update({
                where: { id: existing.id },
                data,
            });
        }
        return prisma.notificationSettings.create({
            data: { userId: user.userId, ...data },
        });
    },

    // ═══ Per-event Preferences ═══
    async getPreferences(user: JwtUser) {
        return prisma.notificationPreference.findMany({
            where: { userId: user.userId },
            orderBy: { eventId: "asc" },
        });
    },

    async bulkUpsertPreferences(preferences: PreferenceInput[], user: JwtUser) {
        // Use a transaction for atomic bulk upsert
        const ops = preferences.map(p =>
            prisma.notificationPreference.upsert({
                where: { userId_eventId: { userId: user.userId, eventId: p.eventId } },
                create: { userId: user.userId, eventId: p.eventId, email: p.email, push: p.push, inApp: p.inApp },
                update: { email: p.email, push: p.push, inApp: p.inApp },
            })
        );
        return prisma.$transaction(ops);
    },
};
