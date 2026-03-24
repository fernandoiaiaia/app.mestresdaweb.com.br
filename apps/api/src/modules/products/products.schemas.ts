import { z } from "zod";

// ═══ Categories ═══

export const createProductCategorySchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    color: z.string().default("#3b82f6"),
});

export const updateProductCategorySchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
});

// ═══ Products ═══

export const createProductSchema = z.object({
    // Basic
    name: z.string().min(1, "O nome é obrigatório"),
    internalCode: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    detailedDescription: z.string().optional().nullable(),
    type: z.enum(["servico", "produto", "combo", "assinatura"]).default("servico"),
    categoryId: z.string().uuid("Categoria inválida"),

    // Pricing
    priceMin: z.number().min(0).optional().nullable(),
    priceMax: z.number().min(0).optional().nullable(),
    billingModel: z.enum(["unico", "mensal", "trimestral", "semestral", "anual", "sob-demanda", "por-hora"]).default("unico"),
    setupFee: z.number().min(0).optional().nullable(),

    // Commercial
    marginPercent: z.number().min(0).max(100).optional().nullable(),
    discountMax: z.number().min(0).max(100).optional().nullable(),
    warrantyMonths: z.number().int().min(0).optional().nullable(),

    // Scope
    complexity: z.enum(["low", "medium", "high", "enterprise"]).default("medium"),
    estimatedHours: z.number().int().min(0).optional().nullable(),
    slaResponse: z.string().optional().nullable(),
    slaResolution: z.string().optional().nullable(),

    // JSON arrays
    deliverables: z.array(z.string()).default([]),
    techStack: z.array(z.string()).default([]),

    // Visibility
    active: z.boolean().default(true),
    showInProposals: z.boolean().default(true),
    featured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const idParamSchema = z.object({
    id: z.string().uuid("ID inválido"),
});
