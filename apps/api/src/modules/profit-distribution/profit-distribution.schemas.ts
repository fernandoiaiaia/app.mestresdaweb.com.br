import { z } from "zod";

export const executeDistributionSchema = z.object({
    referencePeriod: z.string().min(1, "O período é obrigatório"),
    totalProfit: z.number().min(0, "O lucro total não pode ser negativo"),
    distributedAmount: z.number().min(0.01, "O valor a distribuir deve ser maior que 0"),
    accountId: z.string().min(1, "A conta bancária é obrigatória"),
    items: z.array(z.object({
        name: z.string(),
        share: z.number(),
        value: z.number()
    })).min(1, "É necessário ao menos um sócio para a distribuição")
});
