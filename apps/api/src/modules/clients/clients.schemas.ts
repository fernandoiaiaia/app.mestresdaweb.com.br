import { z } from "zod";

export const createClientSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório"),
    company: z.string().optional().nullable(),
    companyId: z.string().uuid().optional().nullable(),
    email: z.string().email("E-mail inválido").optional().nullable(),
    phone: z.string().optional().nullable(),
    role: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    website: z.string().url("URL inválida").optional().nullable(),
    segment: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    status: z.enum(["active", "inactive", "prospect"]).default("prospect"),
    isFavorite: z.boolean().default(false).optional(),
    notes: z.string().optional().nullable(),
    portalPassword: z.string().optional().nullable(),

    // Métricas (Optional as they might not be passed initially)
    lastContact: z.string().datetime().optional().nullable(),
    proposalCount: z.number().int().min(0).optional(),
    totalRevenue: z.number().min(0).optional(),

    contacts: z.array(z.object({
        name: z.string(),
        email: z.string().email("E-mail inválido").optional().nullable(),
        phone: z.string().optional().nullable(),
        role: z.string().optional().nullable(),
        isPrimary: z.boolean().optional()
    })).optional()
});

export const updateClientSchema = createClientSchema.partial();

export const bulkCreateClientSchema = z.object({
    clients: z.array(createClientSchema)
});

export const bulkCreateWithDealsSchema = z.object({
    funnelId: z.string().uuid().optional(),
    items: z.array(z.object({
        // Client data
        name: z.string().min(1),
        email: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        company: z.string().optional().nullable(),
        segment: z.string().optional().nullable(),
        source: z.string().optional().nullable(),
        createdAt: z.string().optional().nullable(),
        // Deal data
        stageName: z.string().optional().nullable(),
        consultantName: z.string().optional().nullable(),
        dealTitle: z.string().optional().nullable(),
        dealValue: z.number().optional().nullable(),
        dealTags: z.array(z.string()).optional().nullable(),
        dealSource: z.string().optional().nullable(),
        expectedClose: z.string().optional().nullable(),
        dealOrigin: z.string().optional().nullable(),
        campaignNote: z.string().optional().nullable(),
    }))
});

export const clientParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});
