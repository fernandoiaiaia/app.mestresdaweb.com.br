import { z } from "zod";

export const createPaymentConditionSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    description: z.string().optional().nullable(),
    entryPercent: z.number().min(0).max(100).default(0),
    installments: z.number().int().min(0).default(1),
    discount: z.number().min(0).max(100).default(0),
    validityDays: z.number().int().min(1).default(15),
    methods: z.array(z.string()).default([]),
});

export const updatePaymentConditionSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    entryPercent: z.number().min(0).max(100).optional(),
    installments: z.number().int().min(0).optional(),
    discount: z.number().min(0).max(100).optional(),
    validityDays: z.number().int().min(1).optional(),
    methods: z.array(z.string()).optional(),
    active: z.boolean().optional(),
});

export const idParamSchema = z.object({
    id: z.string().uuid("ID inválido"),
});
