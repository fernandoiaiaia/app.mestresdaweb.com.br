import { prisma } from "../../config/database.js";

export class TasksService {
    // ═══════════════════════════════════════
    // Core Functions
    // ═══════════════════════════════════════

    async findMany(userId: string, filters: { clientId?: string, startDate?: Date, endDate?: Date } = {}) {
        return prisma.task.findMany({
            where: {
                userId,
                ...(filters.clientId && { clientId: filters.clientId }),
                ...(filters.startDate && filters.endDate && {
                    date: {
                        gte: filters.startDate,
                        lte: filters.endDate
                    }
                })
            },
            include: {
                client: {
                    select: { id: true, name: true, company: true }
                }
            },
            orderBy: {
                date: "asc"
            }
        });
    }

    async findById(userId: string, id: string) {
        return prisma.task.findFirst({
            where: { id, userId },
            include: {
                client: {
                    select: { id: true, name: true, company: true }
                }
            }
        });
    }

    async create(userId: string, data: any) {
        return prisma.task.create({
            data: {
                ...data,
                userId,
            },
            include: {
                client: {
                    select: { id: true, name: true, company: true }
                }
            }
        });
    }

    async update(userId: string, id: string, data: any) {
        const task = await this.findById(userId, id);
        if (!task) throw new Error("Tarefa não encontrada");

        return prisma.task.update({
            where: { id },
            data,
            include: {
                client: {
                    select: { id: true, name: true, company: true }
                }
            }
        });
    }

    async delete(userId: string, id: string) {
        const task = await this.findById(userId, id);
        if (!task) throw new Error("Tarefa não encontrada");

        await prisma.task.delete({
            where: { id }
        });

        return { success: true };
    }
}

export const tasksService = new TasksService();
