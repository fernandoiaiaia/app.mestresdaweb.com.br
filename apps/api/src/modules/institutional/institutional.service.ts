import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; role: string; }

export const institutionalService = {
    async get(user: JwtUser) {
        let profile = await prisma.institutionalProfile.findUnique({
            where: { userId: user.userId },
        });
        if (!profile) {
            profile = await prisma.institutionalProfile.create({
                data: { userId: user.userId },
            });
        }
        return this.formatProfileResponse(profile);
    },

    async upsert(data: any, user: JwtUser) {
        const profile = await prisma.institutionalProfile.upsert({
            where: { userId: user.userId },
            update: data,
            create: { userId: user.userId, ...data },
        });
        return this.formatProfileResponse(profile);
    },

    formatProfileResponse(profile: any) {
        if (!profile) return profile;
        const { certPassword, ...safeProfile } = profile;
        return {
            ...safeProfile,
            hasCertPassword: !!certPassword
        };
    }
};
