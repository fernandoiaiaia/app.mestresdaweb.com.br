import { z } from "zod";

export const createFunnelSchema = z.object({
    name: z.string().min(1, "O nome do funil é obrigatório"),
    description: z.string().optional(),
});

export const updateFunnelSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    active: z.boolean().optional(),
    isDefault: z.boolean().optional(),
});

export const addStageSchema = z.object({
    name: z.string().min(1, "O nome da etapa é obrigatório"),
    color: z.string().optional(),
});

export const updateStageSchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
});

export const reorderStagesSchema = z.object({
    stageIds: z.array(z.string()).min(1, "A lista de etapas não pode estar vazia"),
});

export const reorderFunnelsSchema = z.object({
    funnelIds: z.array(z.string()).min(1, "A lista de funis não pode estar vazia"),
});

export const funnelParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});

export const stageParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
    stageId: z.string().uuid("ID da etapa inválido"),
});
