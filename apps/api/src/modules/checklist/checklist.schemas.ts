import { z } from "zod";

// Categories
export const createChecklistCategorySchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    color: z.string().default("#3b82f6"),
});

export const updateChecklistCategorySchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
});

// Questions
export const createChecklistQuestionSchema = z.object({
    text: z.string().min(1, "A pergunta é obrigatória"),
    categoryId: z.string().uuid("Categoria inválida"),
    defaultValue: z.string().optional().nullable(),
    isRequired: z.boolean().default(false),
});

export const updateChecklistQuestionSchema = z.object({
    text: z.string().min(1).optional(),
    categoryId: z.string().uuid().optional(),
    defaultValue: z.string().optional().nullable(),
    isRequired: z.boolean().optional(),
});

export const idParamSchema = z.object({
    id: z.string().uuid("ID inválido"),
});
