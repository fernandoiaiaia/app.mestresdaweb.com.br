import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; role: string; }

export const institutionalService = {
    async get(user: JwtUser) {
        return prisma.institutionalProfile.findUnique({
            where: { userId: user.userId },
        });
    },

    async upsert(data: any, user: JwtUser) {
        return prisma.institutionalProfile.upsert({
            where: { userId: user.userId },
            create: { userId: user.userId, ...data },
            update: data,
        });
    },
};
