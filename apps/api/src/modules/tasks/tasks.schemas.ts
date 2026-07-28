import { z } from "zod";

export const createTaskSchema = z.object({
    title: z.string().min(1, "O título é obrigatório"),
    description: z.string().optional(),
    touchPoint: z.string().optional(),
    date: z.string().datetime({ message: "Data inválida (esperava formato ISO 8601)" }),
    status: z.enum(["pending", "completed"]).optional().default("pending"),
    clientId: z.string().uuid("ID de cliente inválido").optional().nullable(),
    dealId: z.string().uuid("ID de negócio inválido").optional().nullable()
});

export const updateTaskSchema = z.object({
    title: z.string().min(1, "O título não pode ser vazio").optional(),
    description: z.string().optional().nullable(),
    touchPoint: z.string().optional().nullable(),
    date: z.string().datetime({ message: "Data inválida (esperava formato ISO 8601)" }).optional(),
    status: z.enum(["pending", "completed"]).optional(),
    clientId: z.string().uuid("ID de cliente inválido").optional().nullable(),
    dealId: z.string().uuid("ID de negócio inválido").optional().nullable()
});

export const taskParamsSchema = z.object({
    id: z.string().uuid("ID de tarefa inválido"),
});
