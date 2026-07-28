import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

// ═══════════════════════════════════════
// AI Service — Anthropic Claude
// ═══════════════════════════════════════

interface Lead {
    id: string;
    name: string;
    email?: string | null;
    company?: string | null;
    segment?: string | null;
    role?: string | null;
    notes?: string | null;
    tags?: string[];
}

interface QualificationCriteria {
    id: string;
    name: string;
    description?: string | null;
    fieldType: string;
    weight: number;
    aiPrompt?: string | null;
}

interface InterpretResult {
    interest: "interested" | "not_interested" | "needs_info" | "opt_out" | "unclear";
    qualificationData: Record<string, any>;
    suggestedAction: "continue" | "schedule" | "escalate" | "stop";
    reasoning: string;
}

function buildSystemPrompt(tone: string, companyName = "Nossa Empresa"): string {
    return `Você é um SDR (Sales Development Representative) profissional da empresa ${companyName}.
Seu objetivo é fazer o primeiro contato com leads, entender suas necessidades, qualificar e agendar uma reunião com o consultor.

Tom de comunicação: ${tone}

Regras:
- Seja natural e humano, nunca pareça um robô
- Personalize cada mensagem com os dados do lead (nome, empresa, segmento)
- Não seja insistente nem agressivo
- Se o lead demonstrar interesse, tente agendar uma reunião
- Se o lead pedir para parar, respeite imediatamente
- Extraia informações de qualificação naturalmente durante a conversa (Budget, Authority, Need, Timeline)
- Nunca invente informações que o lead não disse
- Se não souber a resposta de algo, diga que vai pedir para o consultor entrar em contato`;
}

function buildLeadContext(lead: Lead): string {
    return `Dados do lead:
Nome: ${lead.name}
Empresa: ${lead.company || "Não informada"}
Segmento: ${lead.segment || "Não informado"}
Cargo: ${lead.role || "Não informado"}
Notas: ${lead.notes || "Sem notas"}
Tags: ${lead.tags?.join(", ") || "Nenhuma"}`;
}

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        logger.warn("ANTHROPIC_API_KEY não configurada — retornando mock");
        return "[IA não configurada — configure ANTHROPIC_API_KEY]";
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        logger.error({ status: response.status, err }, "Anthropic API error");
        throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.content?.[0]?.text || "";
}

export const aiService = {
    /**
     * Personaliza email baseado nos dados do lead e template base
     */
    async personalizeEmail(lead: Lead, template: string, tone: string): Promise<{ subject: string; body: string }> {
        const system = buildSystemPrompt(tone);
        const prompt = `${buildLeadContext(lead)}

Template base do email:
${template}

Personalize este email completamente para o lead acima. Retorne APENAS um JSON válido com:
{"subject": "assunto personalizado", "body": "corpo do email personalizado"}

NÃO inclua nada além do JSON.`;

        const result = await callClaude(system, prompt);
        try {
            return JSON.parse(result);
        } catch {
            return { subject: template.substring(0, 60), body: result };
        }
    },

    /**
     * Personaliza mensagem de WhatsApp
     */
    async personalizeWhatsApp(lead: Lead, template: string, tone: string): Promise<string> {
        const system = buildSystemPrompt(tone);
        const prompt = `${buildLeadContext(lead)}

Template base do WhatsApp:
${template}

Personalize esta mensagem para o lead. Mantenha curta (máx 300 caracteres). Retorne apenas o texto da mensagem.`;

        return callClaude(system, prompt);
    },

    /**
     * Interpreta resposta do lead e classifica
     */
    async interpretResponse(lead: Lead, message: string, channel: string): Promise<InterpretResult> {
        const system = buildSystemPrompt("formal");
        const prompt = `${buildLeadContext(lead)}

O lead respondeu pelo canal ${channel}:
"${message}"

Analise a resposta e retorne APENAS um JSON válido:
{
  "interest": "interested" | "not_interested" | "needs_info" | "opt_out" | "unclear",
  "qualificationData": { dados BANT extraídos, ex: {"budget": true, "need": "sistema web"} },
  "suggestedAction": "continue" | "schedule" | "escalate" | "stop",
  "reasoning": "explicação da sua decisão"
}`;

        const result = await callClaude(system, prompt);
        try {
            return JSON.parse(result);
        } catch {
            return {
                interest: "unclear",
                qualificationData: {},
                suggestedAction: "continue",
                reasoning: `Não foi possível interpretar automaticamente: ${result.substring(0, 200)}`,
            };
        }
    },

    /**
     * Gera resposta conversacional no WhatsApp
     */
    async generateWhatsAppReply(lead: Lead, conversationHistory: any[], lastMessage: string): Promise<string> {
        const system = buildSystemPrompt("casual");
        const historyText = conversationHistory
            .map(a => `[${a.actionType}] ${a.content || ""}`)
            .join("\n");

        const prompt = `${buildLeadContext(lead)}

Histórico da conversa:
${historyText}

Última mensagem do lead:
"${lastMessage}"

Gere uma resposta natural, curta (máx 280 caracteres) para dar continuidade à conversa e avançar na qualificação. Retorne apenas o texto da resposta.`;

        return callClaude(system, prompt);
    },

    /**
     * Gera script para voice agent do Retell AI
     */
    async generateVoiceScript(lead: Lead, criteria: QualificationCriteria[]): Promise<string> {
        const system = buildSystemPrompt("formal");
        const criteriaText = criteria
            .map(c => `- ${c.name}: ${c.aiPrompt || c.description || "Investigar"}`)
            .join("\n");

        const prompt = `${buildLeadContext(lead)}

Critérios de qualificação para investigar:
${criteriaText}

Gere um script de ligação completo incluindo:
1. Abertura com apresentação
2. Perguntas de qualificação naturais
3. Tratamento de objeções
4. Tentativa de agendamento
5. Encerramento

Retorne apenas o script.`;

        return callClaude(system, prompt);
    },

    /**
     * Calcula score baseado nos dados de qualificação extraídos
     */
    async calculateScore(
        lead: Lead,
        criteria: QualificationCriteria[],
        extractedData: Record<string, any>
    ): Promise<{ score: number; temperature: string; details: Record<string, number> }> {
        const details: Record<string, number> = {};
        let totalScore = 0;

        for (const criterion of criteria) {
            const key = criterion.name.toLowerCase();
            const value = extractedData[key] ?? extractedData[criterion.name];

            let points = 0;
            if (value !== undefined && value !== null && value !== false && value !== "") {
                if (criterion.fieldType === "boolean") {
                    points = value ? criterion.weight : 0;
                } else {
                    // Text/number — has data = full weight
                    points = criterion.weight;
                }
            }
            details[criterion.name] = points;
            totalScore += points;
        }

        const score = Math.min(100, Math.max(0, totalScore));
        const temperature = score >= 80 ? "quente" : score >= 50 ? "morno" : "frio";

        return { score, temperature, details };
    },
};
