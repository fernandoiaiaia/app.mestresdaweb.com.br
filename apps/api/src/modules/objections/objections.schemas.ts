import { z } from "zod";

// ═══ Objection Categories ═══
export const createObjCategorySchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    emoji: z.string().default("💰"),
    color: z.string().default("#ef4444"),
});

export const updateObjCategorySchema = z.object({
    name: z.string().min(1).optional(),
    emoji: z.string().optional(),
    color: z.string().optional(),
});

// ═══ Objections ═══
export const createObjectionSchema = z.object({
    objection: z.string().min(1, "A objeção é obrigatória"),
    categoryId: z.string().uuid("Categoria inválida"),
    scripts: z.array(z.string()).default([]),
});

export const updateObjectionSchema = z.object({
    objection: z.string().min(1).optional(),
    categoryId: z.string().uuid().optional(),
    scripts: z.array(z.string()).optional(),
});

export const idParamSchema = z.object({
    id: z.string().uuid("ID inválido"),
});
