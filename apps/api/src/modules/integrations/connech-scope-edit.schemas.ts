import { z } from "zod";

// Contrato consumido pelo Connech (Connech-main/apps/api/src/crm/http-advisor-crm.adapter.ts)
export const connechScopeEditRequestSchema = z.object({
    source: z.literal("connech"),
    requestId: z.string().min(1),
    opportunityId: z.string().min(1),
    crmDealId: z.string().min(1),
    crmClientId: z.string().optional(),
    clientName: z.string().min(1),
    clientPhone: z.string().optional(),
    message: z.string().min(1),
    scopeVersion: z.number().optional(),
    requestedAt: z.string().min(1),
});

export type ConnechScopeEditRequest = z.infer<typeof connechScopeEditRequestSchema>;
