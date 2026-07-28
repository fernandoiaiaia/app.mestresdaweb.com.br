import { prisma } from "../../config/database.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

interface JwtUser { userId: string; role: string; }

export const paymentService = {
    async list(user: JwtUser) {
        const ownerId = await getOwnerUserId();
        return prisma.paymentCondition.findMany({
            where: ownerId ? { userId: ownerId } : {},
            orderBy: { createdAt: "asc" },
        });
    },

    async create(data: any, user: JwtUser) {
        return prisma.paymentCondition.create({
            data: {
                name: data.name,
                description: data.description || null,
                entryPercent: data.entryPercent ?? 0,
                installments: data.installments ?? 1,
                discount: data.discount ?? 0,
                validityDays: data.validityDays ?? 15,
                methods: data.methods || [],
                userId: (await getOwnerUserId()) || user.userId,
            },
        });
    },

    async update(id: string, data: any, user: JwtUser) {
        return prisma.paymentCondition.update({
            where: { id },
            data,
        });
    },

    async toggleActive(id: string, user: JwtUser) {
        const cond = await prisma.paymentCondition.findFirst({ where: { id } });
        if (!cond) throw new Error("Condição não encontrada");
        return prisma.paymentCondition.update({
            where: { id },
            data: { active: !cond.active },
        });
    },

    async duplicate(id: string, user: JwtUser) {
        const cond = await prisma.paymentCondition.findFirst({ where: { id } });
        if (!cond) throw new Error("Condição não encontrada");
        return prisma.paymentCondition.create({
            data: {
                name: cond.name + " (cópia)",
                description: cond.description,
                entryPercent: cond.entryPercent,
                installments: cond.installments,
                discount: cond.discount,
                validityDays: cond.validityDays,
                methods: cond.methods as any,
                userId: (await getOwnerUserId()) || user.userId,
            },
        });
    },

    async delete(id: string, user: JwtUser) {
        return prisma.paymentCondition.delete({ where: { id } });
    },
};
