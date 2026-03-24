import { z } from "zod";

export const createDealSchema = z.object({
    clientId: z.string().uuid(),
    funnelId: z.string().uuid().optional(),
    stageId: z.string().uuid().optional(),
    consultantId: z.string().uuid(),
    title: z.string().min(1, "O título do negócio é obrigatório"),
    value: z.number().min(0).default(0),
    probability: z.number().min(0).max(100).default(0),
    tags: z.array(z.string()).optional(),
    priority: z.enum(["high", "medium", "low"]).default("low"),
    source: z.string().optional(),
    temperature: z.enum(["hot", "warm", "cold"]).default("cold"),
    expectedClose: z.string().datetime().optional(),
    nextAction: z.string().optional(),
});

export const updateDealSchema = z.object({
    title: z.string().min(1).optional(),
    value: z.number().min(0).optional(),
    probability: z.number().min(0).max(100).optional(),
    status: z.enum(["open", "won", "lost"]).optional(),
    tags: z.array(z.string()).optional(),
    clientId: z.string().uuid().optional(),
    consultantId: z.string().uuid().optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    source: z.string().optional(),
    temperature: z.enum(["hot", "warm", "cold"]).optional(),
    expectedClose: z.string().datetime().nullable().optional(),
    nextAction: z.string().nullable().optional(),
});

export const updateDealStageSchema = z.object({
    stageId: z.string().uuid("ID da etapa é obrigatório"),
});

export const changeDealFunnelSchema = z.object({
    funnelId: z.string().uuid("ID do funil é obrigatório"),
});

export const dealParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});

export const createDealNoteSchema = z.object({
    content: z.string().min(1, "Anotação não pode ser vazia"),
    type: z.enum(["note", "email", "call", "meeting", "system_event"]).optional()
});
