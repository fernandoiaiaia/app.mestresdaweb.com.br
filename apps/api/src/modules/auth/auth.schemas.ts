import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const loginSchema = z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token é obrigatório"),
});

export const verify2faSchema = z.object({
    tempToken: z.string().min(1, "Token temporário é obrigatório"),
    code: z.string().length(6, "Código deve ter 6 dígitos"),
});

export const googleLoginSchema = z.object({
    credential: z.string().min(1, "Credencial Google é obrigatória"),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("E-mail inválido"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token é obrigatório"),
    newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type Verify2faInput = z.infer<typeof verify2faSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
