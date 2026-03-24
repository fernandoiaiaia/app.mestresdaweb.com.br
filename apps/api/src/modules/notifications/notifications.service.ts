import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; }

interface PreferenceInput { eventId: string; email: boolean; push: boolean; inApp: boolean; }

export const notificationsService = {
    // ═══ Global Settings ═══
    async getSettings(user: JwtUser) {
        return prisma.notificationSettings.findUnique({ where: { userId: user.userId } });
    },

    async upsertSettings(data: any, user: JwtUser) {
        return prisma.notificationSettings.upsert({
            where: { userId: user.userId },
            create: { userId: user.userId, ...data },
            update: data,
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
