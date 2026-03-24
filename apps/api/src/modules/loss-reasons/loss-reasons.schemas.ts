import { z } from "zod";

// ═══ Categories ═══

export const createCategorySchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    emoji: z.string().default("📋"),
    color: z.string().default("#64748b"),
});

export const updateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    emoji: z.string().optional(),
    color: z.string().optional(),
});

export const categoryParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});

// ═══ Loss Reasons ═══

export const createReasonSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    description: z.string().optional().nullable(),
    categoryId: z.string().uuid("Categoria inválida"),
    active: z.boolean().default(true),
});

export const updateReasonSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    categoryId: z.string().uuid().optional(),
    active: z.boolean().optional(),
});

export const reasonParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});
