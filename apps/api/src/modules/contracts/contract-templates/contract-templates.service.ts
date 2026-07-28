import { prisma } from "../../../config/database.js";
import { logger } from "../../../lib/logger.js";
import { z } from "zod";

export const contractTemplateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
  content: z.string(),
  status: z.string().optional()
});

export const aiPromptSchema = z.object({
  prompt: z.string().min(1, "Prompt é obrigatório")
});

export class ContractTemplatesService {
  async list(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      name: { contains: search, mode: 'insensitive' as any }
    } : {};

    const [total, items] = await Promise.all([
      prisma.contractTemplate.count({ where }),
      prisma.contractTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getById(id: string) {
    return prisma.contractTemplate.findUnique({ where: { id } });
  }

  async create(data: z.infer<typeof contractTemplateSchema>) {
    const validatedData = contractTemplateSchema.parse(data);
    return prisma.contractTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || "",
        content: validatedData.content,
        status: validatedData.status || "active"
      }
    });
  }

  async update(id: string, data: z.infer<typeof contractTemplateSchema>) {
    const validatedData = contractTemplateSchema.parse(data);
    return prisma.contractTemplate.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description || "",
        content: validatedData.content,
        status: validatedData.status || "active"
      }
    });
  }

  async delete(id: string) {
    return prisma.contractTemplate.delete({ where: { id } });
  }

  async generateWithAI(prompt: string) {
    const int = await prisma.integrationSetting.findFirst({
        where: { provider: 'proposal_openai', isActive: true }
    });

    let apiKey = process.env.OPENAI_API_KEY;
    if (int && int.credentials && (int.credentials as any).apiKey) {
        apiKey = (int.credentials as any).apiKey;
    }

    if (!apiKey) {
        throw new Error("Integração com OpenAI (proposal_openai) não configurada ou inativa.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-5.4",
            messages: [
                { role: "system", content: "Você é um assistente jurídico especialista em redação de contratos. Formate sua resposta estritamente EM HTML válido usando as tags <p>, <b>, <i>, <ul>, <li>. NÃO use Markdown (como ```html), nem inclua blocos de código. Apenas retorne o HTML puro da cláusula ou contrato. O usuário pedirá uma cláusula ou contrato, e você deverá fornecer o texto profissional e jurídico adequado." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => null);
        logger.error({ status: response.status, errData }, "OpenAI API error");
        throw new Error(`Erro na API da OpenAI: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    // Clean up potential markdown formatting if the model disobeys
    content = content.replace(/^```html/i, "").replace(/```$/i, "").trim();
    return content;
  }
}

export const contractTemplatesService = new ContractTemplatesService();
