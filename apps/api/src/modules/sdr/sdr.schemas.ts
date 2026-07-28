import { z } from "zod";

// ═══════════════════════════════════════
// SDR Zod Schemas — Request Validation
// ═══════════════════════════════════════

// ═══ Cadences ═══
export const createCadenceSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional(),
    tone: z.enum(["formal", "casual", "tecnico"]).default("formal"),
    targetSegment: z.string().optional(),
    businessHoursStart: z.string().default("08:00"),
    businessHoursEnd: z.string().default("18:00"),
    timezone: z.string().default("America/Sao_Paulo"),
    maxAttempts: z.number().int().min(1).default(5),
    automationLevel: z.enum(["autopilot", "semi", "assisted"]).default("semi"),
    playbookData: z.any().optional(),
    personaData: z.any().optional(),
    identityData: z.any().optional(),
});

export const updateCadenceSchema = createCadenceSchema.partial();

export const updateCadenceStatusSchema = z.object({
    status: z.enum(["draft", "active", "paused", "archived"]),
});

// ═══ Cadence Steps ═══
export const addStepSchema = z.object({
    type: z.string().default("email"),
    title: z.string().min(1),
    delay: z.number().int().default(0),
    delayUnit: z.enum(["hours", "days"]).default("days"),
    channel: z.enum(["email", "whatsapp", "phone", "wait"]).default("email"),
    delayDays: z.number().int().default(0),
    delayHours: z.number().int().default(0),
    templateContent: z.string().optional(),
    subject: z.string().optional(),
    stopOnReply: z.boolean().default(true),
});

export const updateStepSchema = addStepSchema.partial();

export const reorderStepsSchema = z.object({
    stepIds: z.array(z.string()),
});

// ═══ SDR Leads ═══
export const createLeadSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    company: z.string().optional(),
    segment: z.string().optional(),
    role: z.string().optional(),
    tags: z.array(z.string()).default([]),
    notes: z.string().optional(),
    origin: z.string().optional(),
    consultantId: z.string().uuid().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const activateLeadsSchema = z.object({
    leadIds: z.array(z.string().uuid()).min(1, "Selecione pelo menos 1 lead"),
    cadenceId: z.string().uuid("Cadência é obrigatória"),
    consultantId: z.string().uuid().optional(),
});

export const importLeadsSchema = z.object({
    leads: z.array(createLeadSchema).min(1),
    cadenceId: z.string().uuid().optional(),
});

// ═══ Qualification ═══
export const createCriteriaSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    fieldType: z.enum(["boolean", "text", "number"]).default("boolean"),
    weight: z.number().int().min(0).max(100).default(0),
    aiPrompt: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
});

export const updateCriteriaSchema = createCriteriaSchema.partial();

export const reorderCriteriaSchema = z.object({
    criteriaIds: z.array(z.string()),
});

export const updateThresholdsSchema = z.object({
    hotMin: z.number().int().min(0).max(100),
    warmMin: z.number().int().min(0).max(100),
    hotAction: z.string(),
    warmAction: z.string(),
    coldAction: z.string(),
});

// ═══ Scheduling ═══
export const createMeetingSchema = z.object({
    leadId: z.string().uuid(),
    consultantId: z.string().uuid(),
    scheduledAt: z.string().datetime(),
    meetLink: z.string().optional(),
});

export const updateMeetingSchema = z.object({
    status: z.enum(["agendada", "confirmada", "cancelada", "reagendada", "realizada"]).optional(),
    scheduledAt: z.string().datetime().optional(),
    meetLink: z.string().optional(),
});

// ═══ Query Params ═══
export const listLeadsQuerySchema = z.object({
    status: z.string().optional(),
    segment: z.string().optional(),
    temperature: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().default(1),
    limit: z.coerce.number().int().default(20),
});

export const monitorLeadsQuerySchema = z.object({
    cadenceId: z.string().optional(),
    status: z.string().optional(),
    temperature: z.string().optional(),
    needsIntervention: z.coerce.boolean().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().default(1),
    limit: z.coerce.number().int().default(20),
});
