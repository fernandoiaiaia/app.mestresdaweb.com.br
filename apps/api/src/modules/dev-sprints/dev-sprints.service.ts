import { prisma } from "../../config/database.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Sprints Service
// ═══════════════════════════════════════

export const devSprintsService = {

    /** List sprints for a project, ordered by sortOrder — includes tasks */
    async listByProject(projectId: string) {
        return prisma.devSprint.findMany({
            where: { projectId },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
                tasks: {
                    select: { id: true, title: true, status: true, priority: true, epic: true },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    },

    /** Create a sprint and optionally assign tasks */
    async create(data: {
        projectId: string;
        name: string;
        goal?: string;
        startDate?: string;
        endDate?: string;
        taskIds?: string[];
    }) {
        // Get next sort order
        const lastSprint = await prisma.devSprint.findFirst({
            where: { projectId: data.projectId },
            orderBy: { sortOrder: "desc" },
        });
        const sortOrder = (lastSprint?.sortOrder ?? -1) + 1;

        const sprint = await prisma.devSprint.create({
            data: {
                projectId: data.projectId,
                name: data.name,
                goal: data.goal || null,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                sortOrder,
            },
        });

        // Assign tasks to this sprint
        if (data.taskIds && data.taskIds.length > 0) {
            await prisma.devTask.updateMany({
                where: {
                    id: { in: data.taskIds },
                    projectId: data.projectId,
                },
                data: { sprintId: sprint.id },
            });
        }

        // Return sprint with tasks
        return prisma.devSprint.findUnique({
            where: { id: sprint.id },
            include: {
                tasks: {
                    select: { id: true, title: true, status: true, priority: true, epic: true },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    },

    /** Update sprint (status, name, dates, taskIds, etc.) */
    async update(id: string, data: Partial<{
        name: string;
        goal: string;
        startDate: string;
        endDate: string;
        status: string;
        sortOrder: number;
        taskIds: string[];
    }>) {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.goal !== undefined) updateData.goal = data.goal;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
        if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
        if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

        const sprint = await prisma.devSprint.update({ where: { id }, data: updateData });

        // If taskIds provided, re-assign tasks
        if (data.taskIds !== undefined) {
            // Remove all previous tasks from this sprint
            await prisma.devTask.updateMany({
                where: { sprintId: id },
                data: { sprintId: null },
            });
            // Assign new tasks
            if (data.taskIds.length > 0) {
                await prisma.devTask.updateMany({
                    where: {
                        id: { in: data.taskIds },
                        projectId: sprint.projectId,
                    },
                    data: { sprintId: id },
                });
            }
        }

        return prisma.devSprint.findUnique({
            where: { id },
            include: {
                tasks: {
                    select: { id: true, title: true, status: true, priority: true, epic: true },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    },

    /** Delete a sprint (tasks get sprintId set to null via onDelete: SetNull) */
    async delete(id: string) {
        return prisma.devSprint.delete({ where: { id } });
    },
};
