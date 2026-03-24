import { z } from "zod";

export const createCompanySchema = z.object({
    name: z.string().min(1, "O nome da empresa é obrigatório"),
    cnpj: z.string().optional().nullable(),
    segment: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    status: z.string().optional(),
    clientIds: z.array(z.string().uuid()).optional(),
});

export const updateCompanySchema = z.object({
    name: z.string().min(1, "O nome não pode ser vazio").optional(),
    cnpj: z.string().optional().nullable(),
    segment: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    status: z.string().optional(),
    clientIds: z.array(z.string().uuid()).optional(),
});

export const companyParamsSchema = z.object({
    id: z.string().uuid("ID de empresa inválido"),
});
