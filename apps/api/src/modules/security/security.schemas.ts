import { z } from "zod";

export const upsertSecuritySettingsSchema = z.object({
    twoFactorEnabled: z.boolean().optional(),
    sessionTimeout: z.number().int().min(5).optional(),
    minPasswordLength: z.number().int().min(4).max(32).optional(),
    requireSpecialChars: z.boolean().optional(),
    requireUppercase: z.boolean().optional(),
    requireNumbers: z.boolean().optional(),
    passwordExpiry: z.number().int().min(0).optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z.string().min(4, "Nova senha deve ter ao menos 4 caracteres"),
});
