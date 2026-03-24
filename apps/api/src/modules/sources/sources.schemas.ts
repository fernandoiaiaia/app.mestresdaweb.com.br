import { z } from "zod";

// ═══ Source Types ═══
export const createSourceTypeSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    emoji: z.string().default("🌐"),
    color: z.string().default("#22c55e"),
});

export const updateSourceTypeSchema = z.object({
    name: z.string().min(1).optional(),
    emoji: z.string().optional(),
    color: z.string().optional(),
});

// ═══ Sources ═══
export const createSourceSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    description: z.string().optional().nullable(),
    typeId: z.string().uuid("Tipo inválido"),
});

export const updateSourceSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    typeId: z.string().uuid().optional(),
});

// ═══ Campaigns ═══
export const createCampaignSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    utm: z.string().optional().nullable(),
});

export const updateCampaignSchema = z.object({
    name: z.string().min(1).optional(),
    utm: z.string().optional().nullable(),
});

export const idParamSchema = z.object({
    id: z.string().uuid("ID inválido"),
});

export const campaignParamsSchema = z.object({
    id: z.string().uuid("ID da fonte inválido"),
    campaignId: z.string().uuid("ID da campanha inválido"),
});
