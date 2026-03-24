import { prisma } from "../../config/database.js";
import type { User, Permission, DataScope } from "@prisma/client";

const SELECT_SAFE = {
    id: true,
    name: true,
    email: true,
    role: true,
    avatar: true,
    phone: true,
    position: true,
    active: true,
    allowedApps: true,
    twoFactorEnabled: true,
    createdAt: true,
    updatedAt: true,
} as const;

const SELECT_WITH_PERMISSIONS = {
    ...SELECT_SAFE,
    permissions: {
        select: {
            id: true,
            module: true,
            action: true,
            dataScope: true,
        },
    },
    sessions: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" as const },
        take: 1,
    },
} as const;

export const usersRepository = {
    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: SELECT_WITH_PERMISSIONS,
        });
    },

    async findAll() {
        return prisma.user.findMany({
            select: SELECT_WITH_PERMISSIONS,
            orderBy: { createdAt: "desc" },
        });
    },

    async update(id: string, data: Partial<Pick<User, "name" | "avatar" | "phone" | "position">>) {
        return prisma.user.update({
            where: { id },
            data,
            select: SELECT_WITH_PERMISSIONS,
        });
    },

    async createWithPermissions(data: {
        name: string;
        email: string;
        password: string;
        phone?: string | null;
        position?: string | null;
        role?: string;
        allowedApps?: string[];
        permissions?: Array<{ module: string; action: string; dataScope: DataScope }>;
    }) {
        const { permissions = [], ...userData } = data;

        return prisma.user.create({
            data: {
                ...userData,
                role: (userData.role as any) || "USER",
                permissions: {
                    create: permissions,
                },
            },
            select: SELECT_WITH_PERMISSIONS,
        });
    },

    async updateWithPermissions(
        id: string,
        data: {
            name?: string;
            email?: string;
            phone?: string | null;
            position?: string | null;
            role?: string;
            active?: boolean;
            allowedApps?: string[];
        },
        permissions?: Array<{ module: string; action: string; dataScope: DataScope }>
    ) {
        // If permissions provided, delete all existing and recreate
        if (permissions !== undefined) {
            await prisma.permission.deleteMany({ where: { userId: id } });
        }

        return prisma.user.update({
            where: { id },
            data: {
                ...data,
                ...(data.role && { role: data.role as any }),
                ...(permissions !== undefined && {
                    permissions: {
                        create: permissions,
                    },
                }),
            },
            select: SELECT_WITH_PERMISSIONS,
        });
    },

    async deleteUser(id: string) {
        return prisma.user.delete({ where: { id } });
    },

    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
    },

    async findByIdWithPassword(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: { id: true, password: true, twoFactorEnabled: true },
        });
    },

    async updatePassword(id: string, hashedPassword: string) {
        return prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
            select: { id: true },
        });
    },

    async updateTwoFactor(id: string, enabled: boolean) {
        return prisma.user.update({
            where: { id },
            data: { twoFactorEnabled: enabled },
            select: { id: true, twoFactorEnabled: true },
        });
    },

    async updateAvatar(id: string, avatar: string | null) {
        return prisma.user.update({
            where: { id },
            data: { avatar },
            select: SELECT_WITH_PERMISSIONS,
        });
    },
};
