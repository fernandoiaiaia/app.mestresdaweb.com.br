import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; }

interface ListFilters {
    type?: string;
    read?: string;       // "true" | "false"
    search?: string;
    page?: number;
    limit?: number;
}

interface CreateNotificationInput {
    userId: string;
    type: string;
    title: string;
    description: string;
    link?: string;
    proposalId?: string;
    dealId?: string;
    metadata?: Record<string, unknown>;
}

export const notificationFeedService = {

    // ═══ List with filters, search, pagination ═══
    async list(user: JwtUser, filters: ListFilters = {}) {
        const { type, read, search, page = 1, limit = 50 } = filters;

        const where: Record<string, unknown> = { userId: user.userId };

        if (type && type !== "all") {
            where.type = type;
        }

        if (read === "true") where.read = true;
        else if (read === "false") where.read = false;

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.notification.findMany({
                where: where as any,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.notification.count({ where: where as any }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    },

    // ═══ Unread count ═══
    async getUnreadCount(user: JwtUser) {
        const count = await prisma.notification.count({
            where: { userId: user.userId, read: false },
        });
        return { count };
    },

    // ═══ Mark single as read ═══
    async markAsRead(id: string, user: JwtUser) {
        return prisma.notification.updateMany({
            where: { id, userId: user.userId },
            data: { read: true },
        });
    },

    // ═══ Mark all as read ═══
    async markAllAsRead(user: JwtUser) {
        return prisma.notification.updateMany({
            where: { userId: user.userId, read: false },
            data: { read: true },
        });
    },

    // ═══ Delete single ═══
    async delete(id: string, user: JwtUser) {
        return prisma.notification.deleteMany({
            where: { id, userId: user.userId },
        });
    },

    // ═══ Delete all ═══
    async deleteAll(user: JwtUser) {
        return prisma.notification.deleteMany({
            where: { userId: user.userId },
        });
    },

    // ═══ Create (internal emitter — used by other modules) ═══
    async create(input: CreateNotificationInput) {
        return prisma.notification.create({ data: input as any });
    },

    // ═══ Bulk create (for broadcasting to multiple users) ═══
    async createMany(inputs: CreateNotificationInput[]) {
        return prisma.notification.createMany({ data: inputs as any });
    },
};
