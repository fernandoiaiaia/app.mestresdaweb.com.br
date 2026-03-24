import { prisma } from "../../config/database.js";
import { hashPassword, comparePassword } from "../../lib/hash.js";

interface JwtUser { userId: string; role: string; }

export const securityService = {
    async getSettings(user: JwtUser) {
        return prisma.securitySettings.findUnique({ where: { userId: user.userId } });
    },

    async upsertSettings(data: any, user: JwtUser) {
        return prisma.securitySettings.upsert({
            where: { userId: user.userId },
            create: { userId: user.userId, ...data },
            update: data,
        });
    },

    async changePassword(currentPassword: string, newPassword: string, user: JwtUser) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { password: true } });
        if (!dbUser) throw new Error("Usuário não encontrado");

        const valid = await comparePassword(currentPassword, dbUser.password);
        if (!valid) throw new Error("Senha atual incorreta");

        const hashed = await hashPassword(newPassword);
        await prisma.user.update({ where: { id: user.userId }, data: { password: hashed } });
        return true;
    },

    // ═══ Sessions ═══

    async listSessions(user: JwtUser) {
        return prisma.session.findMany({
            where: { userId: user.userId },
            orderBy: { lastActive: "desc" },
        });
    },

    async revokeSession(sessionId: string, user: JwtUser) {
        return prisma.session.deleteMany({
            where: { id: sessionId, userId: user.userId },
        });
    },

    async revokeAllOtherSessions(currentSessionId: string | undefined, user: JwtUser) {
        const where: any = { userId: user.userId };
        if (currentSessionId) {
            where.id = { not: currentSessionId };
        }
        return prisma.session.deleteMany({ where });
    },

    async createSession(userId: string, data: { device?: string; browser?: string; ip?: string; location?: string }) {
        return prisma.session.create({
            data: { userId, ...data },
        });
    },

    async touchSession(sessionId: string) {
        return prisma.session.update({
            where: { id: sessionId },
            data: { lastActive: new Date() },
        }).catch(() => null);
    },

    // ═══ Login History ═══

    async listLoginHistory(user: JwtUser) {
        return prisma.loginLog.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: "desc" },
            take: 30,
        });
    },

    async logLogin(userId: string, ip: string | null, device: string | null, status: "success" | "failed") {
        return prisma.loginLog.create({
            data: { userId, ip, device, status },
        });
    },
};
