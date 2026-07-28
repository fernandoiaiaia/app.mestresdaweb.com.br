import { z } from "zod";

const functionalitySchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    estimatedHours: z.number().optional(),
});

const screenSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    functionalities: z.array(functionalitySchema).default([]),
});

const moduleSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    screens: z.array(screenSchema).default([]),
});

const platformSchema = z.object({
    id: z.string().optional(),
    platformName: z.string(),
    objective: z.string().optional(),
    modules: z.array(moduleSchema).default([]),
});

const userSchema = z.object({
    id: z.string().optional(),
    userName: z.string(),
    platforms: z.array(platformSchema).min(1),
});

const integrationSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    estimatedHours: z.number().optional(),
});

export const generateScopeSchema = z.object({
    mode: z.enum(["scope", "estimate", "scope_user", "scope_integrations"]).optional().default("scope"),
    projectSummary: z.string().min(1, "Resumo do projeto obrigatório"),
    users: z.array(userSchema).min(1, "Pelo menos um usuário/plataforma é necessário"),
    integrations: z.array(integrationSchema).optional(),
});
