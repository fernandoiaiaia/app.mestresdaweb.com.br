import { z } from "zod";

export const createCadenceSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    description: z.string().optional(),
});

export const updateCadenceSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
});

export const updateCadenceStatusSchema = z.object({
    status: z.enum(["active", "paused", "draft"]),
});

export const addStepSchema = z.object({
    type: z.enum(["email", "whatsapp", "phone", "task"]),
    title: z.string().min(1),
    delay: z.number().min(0).default(0),
    delayUnit: z.enum(["hours", "days"]).default("days"),
});

export const cadenceParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});

export const stepParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
    stepId: z.string().uuid("ID do passo inválido")
});
