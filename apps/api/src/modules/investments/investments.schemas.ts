import { z } from "zod";

export const createInvestmentSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    institution: z.string().min(1, "A instituição é obrigatória"),
    type: z.string().min(1, "O tipo é obrigatório"),
    initialAmount: z.number().min(0, "O valor inicial deve ser maior ou igual a 0"),
    startDate: z.string(),
    accountId: z.string().optional().nullable(),
});

export const updateBalanceSchema = z.object({
    newBalance: z.number().min(0, "O novo saldo deve ser maior ou igual a 0"),
    notes: z.string().optional(),
});
