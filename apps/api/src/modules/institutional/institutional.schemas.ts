import { z } from "zod";

export const upsertInstitutionalSchema = z.object({
    companyName: z.string().optional().nullable(),
    tradeName: z.string().optional().nullable(),
    cnpj: z.string().optional().nullable(),
    stateRegistration: z.string().optional().nullable(),
    municipalRegistration: z.string().optional().nullable(),
    cnae: z.string().optional().nullable(),
    taxRegime: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    zipCode: z.string().optional().nullable(),
    street: z.string().optional().nullable(),
    number: z.string().optional().nullable(),
    complement: z.string().optional().nullable(),
    neighborhood: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    tagline: z.string().optional().nullable(),
    about: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    buttonColor: z.string().optional(),
    partners: z.any().optional(), // allow any json for partners array
});
