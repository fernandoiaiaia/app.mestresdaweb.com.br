import { z } from "zod";

export const createLeadPublicSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(8, "Telefone inválido"),
    company: z.string().nullable().optional(),
    services: z.array(z.string()).default([]),
    budget: z.any().nullable().optional(),
    message: z.string().nullable().optional(),
});

export type CreateLeadPublicInput = z.infer<typeof createLeadPublicSchema>;
