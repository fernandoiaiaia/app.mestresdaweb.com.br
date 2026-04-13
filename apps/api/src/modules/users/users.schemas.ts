import { z } from "zod";

export const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    avatar: z.string().url().optional().nullable(),
    phone: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
});

export const toggle2faSchema = z.object({
    enabled: z.boolean(),
});

export const userParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});

export const permissionSchema = z.object({
    module: z.string().min(1),
    action: z.string().min(1),
    dataScope: z.enum(["OWN", "ALL"]).default("OWN"),
});

export const createUserSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    phone: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    role: z.enum(["OWNER", "ADMIN", "MANAGER", "USER", "VIEWER"]).default("USER"),
    permissions: z.array(permissionSchema).default([]),
    allowedApps: z.array(z.string()).default([]),
    allowedFunnels: z.array(z.string()).default([]),
});

export const updateUserFullSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    role: z.enum(["OWNER", "ADMIN", "MANAGER", "USER", "VIEWER"]).optional(),
    active: z.boolean().optional(),
    permissions: z.array(permissionSchema).optional(),
    allowedApps: z.array(z.string()).optional(),
    allowedFunnels: z.array(z.string()).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserFullInput = z.infer<typeof updateUserFullSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type Toggle2faInput = z.infer<typeof toggle2faSchema>;
export type PermissionInput = z.infer<typeof permissionSchema>;
