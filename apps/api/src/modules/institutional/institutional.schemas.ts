import { z } from "zod";

export const upsertInstitutionalSchema = z.object({
    companyName: z.string().optional().nullable(),
    tradeName: z.string().optional().nullable(),
    cnpj: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    tagline: z.string().optional().nullable(),
    about: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    buttonColor: z.string().optional(),
});
