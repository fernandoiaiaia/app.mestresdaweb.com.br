import { z } from "zod";

// ═══ Loss Reasons ═══

export const createReasonSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    description: z.string().optional().nullable(),
    funnelId: z.string().uuid("Funil inválido"),
    stageId: z.string().uuid("Etapa inválida"),
    active: z.boolean().default(true),
});

export const updateReasonSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    funnelId: z.string().uuid().optional(),
    stageId: z.string().uuid().optional(),
    active: z.boolean().optional(),
});

export const reasonParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});
