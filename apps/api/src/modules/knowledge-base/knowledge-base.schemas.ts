import { z } from "zod";

export const uploadKbSchema = z.object({
    name: z.string().min(1, "O nome do arquivo é obrigatório"),
    content: z.string().min(1, "O conteúdo do arquivo não pode ser vazio"),
    sizeBytes: z.number().int().min(0).optional(),
});

export const kbParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});
