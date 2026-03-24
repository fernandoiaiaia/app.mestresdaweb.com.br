import { z } from "zod";

export const createSegmentSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    description: z.string().optional().nullable(),
    color: z.string().default("blue"),
});

export const updateSegmentSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    color: z.string().optional(),
});

export const idParamSchema = z.object({
    id: z.string().uuid("ID inválido"),
});
