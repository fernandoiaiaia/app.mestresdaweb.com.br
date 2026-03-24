import { prisma } from "../../config/database.js";

export const professionalsService = {
    async list(userId: string) {
        return prisma.professional.findMany({
            where: { userId },
            orderBy: [{ isActive: "desc" }, { role: "asc" }],
        });
    },

    async create(userId: string, data: { role: string; seniority: string; seniorityColor: string; hourlyRate: number; currency?: string }) {
        return prisma.professional.create({
            data: { userId, ...data },
        });
    },

    async update(id: string, userId: string, data: { role?: string; seniority?: string; seniorityColor?: string; hourlyRate?: number; isActive?: boolean }) {
        const existing = await prisma.professional.findFirst({ where: { id, userId } });
        if (!existing) throw new Error("Profissional não encontrado.");

        // Track rate history
        let history = (existing.history as any[]) || [];
        if (data.hourlyRate !== undefined && data.hourlyRate !== existing.hourlyRate) {
            history = [{ date: new Date().toISOString(), oldRate: existing.hourlyRate, newRate: data.hourlyRate }, ...history];
        }

        return prisma.professional.update({
            where: { id },
            data: { ...data, history },
        });
    },

    async delete(id: string, userId: string) {
        const existing = await prisma.professional.findFirst({ where: { id, userId } });
        if (!existing) throw new Error("Profissional não encontrado.");
        return prisma.professional.delete({ where: { id } });
    },

    async getActiveRoles(userId: string) {
        const pros = await prisma.professional.findMany({
            where: { userId, isActive: true },
            select: { role: true, hourlyRate: true },
            orderBy: { role: "asc" },
        });
        return pros;
    },
};
