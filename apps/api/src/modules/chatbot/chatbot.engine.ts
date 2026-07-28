// ═══════════════════════════════════════
// CHATBOT ENGINE — AI Conversational Core
// ═══════════════════════════════════════
// Orchestrates the conversation lifecycle between WhatsApp leads
// and the MiniMax M2.7 AI model. Handles session management,
// qualification extraction, anti-spam protection, and handoff.

import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { WhatsappService } from "../whatsapp/whatsapp.service.js";
import { whatsappEvents } from "../whatsapp/whatsapp.events.js";
import { getOwnerUserId } from "../../lib/get-owner.js";
import { notificationFeedService } from "../notifications/notification-feed.service.js";
import { getSystemEmailConfig } from "../../lib/email-config.js";

// ═══ Types ═══

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface QualificationField {
    id: string;
    label: string;
    type: "string" | "boolean" | "number";
}

// ═══ Mailer Helper ═══
async function sendNotificationEmail(toEmail: string, toName: string, subject: string, bodyText: string) {
    try {
        const { apiKey, fromEmail, fromName } = await getSystemEmailConfig();
        if (!apiKey) {
            logger.warn("No Brevo API key to send notification email");
            return;
        }
        await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                sender: { email: fromEmail, name: fromName },
                to: [{ email: toEmail, name: toName }],
                subject,
                htmlContent: `<div style="font-family:sans-serif;padding:20px;line-height:1.5;">${bodyText.replace(/\n/g, '<br/>')}</div>`
            }),
        });
    } catch (err) {
        logger.error({ err }, "Failed to send notification email");
    }
}

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface QualificationField {
    id: string;
    label: string;
    type: "string" | "boolean" | "number";
}

// ═══ MiniMax AI Client ═══

async function getMiniMaxApiKey(): Promise<string | null> {
    const ownerId = await getOwnerUserId();
    if (!ownerId) return null;

    const setting = await prisma.integrationSetting.findUnique({
        where: { userId_provider: { userId: ownerId, provider: "proposal_minimax" } }
    });

    if (!setting || !setting.isActive || !setting.credentials) return null;
    const creds = setting.credentials as Record<string, any>;
    return creds.apiKey || null;
}

async function callMiniMaxAI(messages: any[], apiKey: string, tools?: any[]): Promise<{ text: string, toolCalls?: any[] }> {
    try {
        const payload: any = {
            model: "MiniMax-M2.7",
            messages,
            temperature: 0.7,
            max_tokens: 500,
            top_p: 0.9
        };
        if (tools && tools.length > 0) {
            payload.tools = tools;
            payload.tool_choice = "auto";
        }

        const response = await fetch("https://api.minimaxi.chat/v1/text/chatcompletion_v2", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json() as any;

        if (!response.ok) {
            logger.error({ data, status: response.status }, "[ChatbotEngine] MiniMax API error");
            throw new Error(`MiniMax API ${response.status}: ${data?.base_resp?.status_msg || "Unknown"}`);
        }

        const message = data?.choices?.[0]?.message;
        if (!message) {
            logger.error({ data }, "[ChatbotEngine] MiniMax returned empty content");
            throw new Error("MiniMax returned empty message");
        }

        // Strip <think>...</think> reasoning tags that some models include
        let text = (message.content || "").trim();
        text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

        return {
            text,
            toolCalls: message.tool_calls
        };
    } catch (err) {
        logger.error({ err }, "[ChatbotEngine] MiniMax call failed");
        throw err;
    }
}

// ═══ Knowledge Base Context Builder ═══

async function buildKnowledgeContext(chatbotId: string): Promise<string> {
    const docs = await prisma.chatbotKnowledge.findMany({
        where: { chatbotId, status: "PROCESSED" },
        select: { name: true, type: true, content: true }
    });

    if (docs.length === 0) return "";

    const blocks = docs
        .filter(d => d.content)
        .map(d => `[${d.type.toUpperCase()}: ${d.name}]\n${d.content}`)
        .join("\n\n---\n\n");

    return `\n\n=== BASE DE CONHECIMENTO DA EMPRESA ===\n${blocks}\n=== FIM DA BASE DE CONHECIMENTO ===`;
}

// ═══ System Prompt Builder ═══

function buildSystemPrompt(
    config: { botName: string; toneOfVoice: string; systemPrompt: string | null },
    flow: { objective: string; inboundPrompt: string | null; outboundPrompt: string | null; qualificationFields: any },
    entryMode: string,
    knowledgeContext: string,
    qualificationData: Record<string, any>
): string {
    const toneMap: Record<string, string> = {
        profissional_amigavel: "Seja profissional mas amigável. Use linguagem acessível, não técnica demais.",
        formal: "Seja formal e respeitoso. Use tratamento adequado.",
        casual: "Seja descontraído e próximo. Use linguagem informal mas profissional.",
        consultivo: "Aja como um consultor especialista. Faça perguntas estratégicas."
    };

    const toneInstruction = toneMap[config.toneOfVoice] || toneMap.profissional_amigavel;

    const fields = (flow.qualificationFields || []) as QualificationField[];
    const fieldsInstruction = fields.length > 0
        ? `\n\nVocê precisa extrair as seguintes informações NATURALMENTE durante a conversa (NÃO faça um questionário):\n${fields.map(f => `- ${f.id} (${f.label}): tipo ${f.type}${qualificationData[f.id] ? ` → JÁ OBTIDO: "${qualificationData[f.id]}"` : " → PENDENTE"}`).join("\n")}`
        : "";

    const specificPrompt = entryMode === "outbound_first"
        ? (flow.outboundPrompt || "")
        : (flow.inboundPrompt || "");

    const objectiveMap: Record<string, string> = {
        qualify: "Seu objetivo é QUALIFICAR o lead, extraindo dados importantes de forma natural e conversacional.",
        followup: "Seu objetivo é fazer FOLLOW-UP, reengajando o lead e entendendo se ainda tem interesse.",
        reactivate: "Seu objetivo é REATIVAR um lead frio, despertando interesse novamente."
    };

    // Get current date in BRT (UTC-3) using proper timezone
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

    // Build explicit calendar for the next 14 days so the AI NEVER has to calculate dates
    const calendarLines: string[] = [];
    for (let i = 1; i <= 14; i++) {
        const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        const dayName = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" });
        const dayNum = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
        const iso = d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // YYYY-MM-DD
        const isWeekend = [0, 6].includes(d.getDay());
        if (!isWeekend) {
            calendarLines.push(`  - ${dayName}, ${dayNum} → ISO: ${iso}`);
        }
    }

    return `Você é ${config.botName}, um assistente virtual de pré-vendas da Mestres da Web.
${toneInstruction}

DATA E HORA ATUAL: ${dateStr}, ${timeStr} (horário de Brasília).

CALENDÁRIO DE DIAS ÚTEIS (USE SOMENTE ESTAS DATAS — NUNCA CALCULE DATAS POR CONTA PRÓPRIA):
${calendarLines.join("\n")}

REGRA ABSOLUTA DE DATAS:
- Ao mencionar um dia da semana, CONSULTE O CALENDÁRIO ACIMA e use EXATAMENTE a data correspondente.
- Ao chamar book_meeting, use a data ISO do calendário acima. Exemplo: se o calendário diz "sexta-feira, 15/05 → ISO: 2026-05-15", use "2026-05-15T10:00:00-03:00".
- NUNCA tente calcular datas mentalmente. NUNCA adivinhe. Use APENAS o calendário fornecido.
- Sábado e domingo NÃO estão no calendário porque NÃO são dias úteis. NUNCA ofereça fins de semana.

${objectiveMap[flow.objective] || objectiveMap.qualify}

REGRAS DE COMUNICAÇÃO (OBRIGATÓRIO):
1. Faça APENAS UMA pergunta por mensagem. NUNCA envie duas ou mais perguntas na mesma mensagem. Espere o lead responder antes de fazer a próxima pergunta.
2. Seja DIRETO e OBJETIVO. Nada de firula, enrolação ou frases genéricas de preenchimento. Vá direto ao ponto.
3. Mensagens CURTAS — no máximo 2 frases por mensagem. Menos é mais.
4. Use emojis com moderação (máximo 1 por mensagem).
5. NUNCA diga que é uma IA ou robô — se perguntado, diga que é um assistente da equipe comercial.
6. Se o lead pedir para falar com um humano, ACEITE IMEDIATAMENTE e diga que vai transferir.
7. NUNCA invente informações que não estão na base de conhecimento.
8. NUNCA responda ou inclua palavras em chinês ou qualquer idioma diferente do Português do Brasil.
9. NUNCA envie links que não estejam na base de conhecimento.
10. Se não souber responder algo, diga que vai verificar com a equipe.
11. Responda em português brasileiro.

FLUXO DE CONVERSA (siga esta ordem):
1. Cumprimente brevemente e pergunte o que o lead precisa (app, site ou sistema).
2. Espere a resposta. Depois pergunte brevemente sobre o projeto (o que ele faz).
3. Espere a resposta. Depois fale sobre investimento de forma DIRETA, usando EXATAMENTE esta frase: "Esse projeto pode custar a partir de R$ 30 mil e pode superar R$ 500 mil, dependendo da quantidade de telas, funcionalidades, plataformas, regra de negócio e integrações. Está dentro das suas expectativas de investimento?"
4. Espere a resposta. Depois sugira agendar uma conversa com um consultor.
5. NÃO PULE ETAPAS. NÃO MISTURE ETAPAS NA MESMA MENSAGEM.

REGRA DE PREÇO (INVIOLÁVEL):
- Quando for falar de preço/investimento, use EXATAMENTE: "Esse projeto pode custar a partir de R$ 30 mil e pode superar R$ 500 mil, dependendo da quantidade de telas, funcionalidades, plataformas, regra de negócio e integrações. Está dentro das suas expectativas de investimento?"
- NUNCA dê faixas de preço diferentes. NUNCA invente valores. NUNCA diga "R$ 150 mil a R$ 500 mil" ou qualquer variação.

REGRAS DE AGENDAMENTO (OBRIGATÓRIO):
- Quando for marcar reunião, VOCÊ DEVE usar a tool "check_calendar_availability" para verificar horários livres. NUNCA invente horários.
- APÓS o lead escolher o horário, VOCÊ DEVE pedir o e-mail dele ANTES de confirmar o agendamento.
- SÓ utilize a tool "book_meeting" e confirme a reunião APÓS receber o e-mail do lead. NUNCA invente o e-mail do lead.
- Ofereça horários no formato: "**Sexta-feira (15/05):** 10h às 11h" (CONSULTE O CALENDÁRIO ACIMA para a data correta).
- Quando o lead disser "sexta às 10", agende das 10h às 11h (1 hora de duração). O horário que o lead fala é o INÍCIO da reunião.
- Não ofereça mais que 4 opções de horário por vez.
- VOCÊ DEVE usar a tool "book_meeting" para agendar de verdade. NUNCA diga que agendou sem usar a tool.
- Ao chamar check_calendar_availability, use startDate=amanhã 00:00 e endDate=2 semanas à frente 23:59.

${config.systemPrompt || ""}

${specificPrompt}

${fieldsInstruction}

${knowledgeContext}

Responda APENAS a mensagem do lead, sem prefixos como "Assistente:" ou "Bot:".`.trim();
}

// ═══ Qualification Extractor ═══

async function extractQualification(
    currentData: Record<string, any>,
    fields: QualificationField[],
    conversationHistory: ChatMessage[],
    apiKey: string
): Promise<{ data: Record<string, any>; score: number }> {
    if (fields.length === 0) return { data: currentData, score: 100 };

    const extractPrompt: ChatMessage[] = [
        {
            role: "system",
            content: `Analise a conversa e extraia APENAS dados que o lead tenha EXPLICITAMENTE mencionado.
Retorne SOMENTE um JSON válido com os campos solicitados, sem texto adicional.
Se não encontrar informação para um campo, use null.

Campos para extrair:
${fields.map(f => `- "${f.id}": ${f.type} (${f.label})`).join("\n")}

Dados já extraídos anteriormente:
${JSON.stringify(currentData)}

RETORNE APENAS O JSON, sem markdown, sem explicações.`
        },
        ...conversationHistory.slice(-10), // últimas 10 mensagens
        {
            role: "user",
            content: "Extraia os dados de qualificação da conversa acima e retorne APENAS o JSON."
        }
    ];

    try {
        const response = await callMiniMaxAI(extractPrompt, apiKey);
        const raw = response.text;
        const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // Merge: keep old data, override with new non-null values
        const merged = { ...currentData };
        for (const field of fields) {
            if (parsed[field.id] !== null && parsed[field.id] !== undefined) {
                merged[field.id] = parsed[field.id];
            }
        }

        // Calculate score
        const filled = fields.filter(f => merged[f.id] !== null && merged[f.id] !== undefined).length;
        const score = Math.round((filled / fields.length) * 100);

        return { data: merged, score };
    } catch (err) {
        logger.warn({ err }, "[ChatbotEngine] Qualification extraction failed, keeping existing data");
        return { data: currentData, score: 0 };
    }
}

// ═══ Anti-Spam Guards ═══

function isWithinBusinessHours(start: string, end: string): boolean {
    const options = { timeZone: "America/Sao_Paulo", hour: 'numeric', minute: 'numeric', hour12: false } as const;
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || "0", 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || "0", 10);

    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    
    const currentMinutes = hour * 60 + minute;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// ═══ DEBOUNCE + MUTEX FOR RAPID MESSAGES ═══
// When a lead sends multiple messages quickly (e.g. "boa tarde" + "preciso de um site"),
// we batch them into a single AI call to avoid duplicate/contradictory responses.

const pendingMessages = new Map<string, { texts: string[]; timer: ReturnType<typeof setTimeout>; contactPhone: string }>();
const processingLock = new Set<string>(); // conversations currently being processed

function debouncedHandleMessage(
    conversationId: string,
    messageText: string,
    contactPhone: string,
    handler: (convId: string, combinedText: string, phone: string) => Promise<boolean>
): Promise<boolean> {
    return new Promise((resolve) => {
        const existing = pendingMessages.get(conversationId);
        
        if (existing) {
            // Another message arrived while debouncing — append and reset timer
            existing.texts.push(messageText);
            clearTimeout(existing.timer);
            existing.timer = setTimeout(async () => {
                pendingMessages.delete(conversationId);
                const combined = existing.texts.join("\n");
                const result = await handler(conversationId, combined, contactPhone);
                resolve(result);
            }, 6000); // Wait 6 seconds for more messages
        } else {
            // First message — start debounce timer
            const entry = {
                texts: [messageText],
                contactPhone,
                timer: setTimeout(async () => {
                    pendingMessages.delete(conversationId);
                    const combined = entry.texts.join("\n");
                    const result = await handler(conversationId, combined, contactPhone);
                    resolve(result);
                }, 6000) // Wait 6 seconds for more messages
            };
            pendingMessages.set(conversationId, entry);
        }
    });
}

// ═══ MAIN ENGINE ═══

export const chatbotEngine = {

    /**
     * Handle an incoming message for a conversation.
     * This is the main entry point called from the webhook.
     * Uses debounce to batch rapid messages (e.g. "boa tarde" + "preciso de um site")
     * into a single AI call, preventing duplicate/contradictory responses.
     */
    async handleIncomingMessage(
        conversationId: string,
        messageText: string,
        contactPhone: string
    ): Promise<boolean> {
        // Quick check: is there an active session? If not, skip debounce entirely.
        const session = await prisma.chatbotSession.findFirst({
            where: {
                conversationId,
                status: { in: ["active", "paused"] }
            },
            select: { id: true }
        });

        if (!session) return false;

        // Delegate to debounce — will batch rapid messages and call _processMessage once
        return debouncedHandleMessage(
            conversationId,
            messageText,
            contactPhone,
            (convId, combinedText, phone) => this._processMessage(convId, combinedText, phone)
        );
    },

    /**
     * Internal: actually process the (possibly batched) message through the AI.
     * Uses a per-conversation lock to prevent parallel processing.
     */
    async _processMessage(
        conversationId: string,
        messageText: string,
        contactPhone: string
    ): Promise<boolean> {
        // Wait for any in-flight processing on this conversation to finish
        while (processingLock.has(conversationId)) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        processingLock.add(conversationId);

        try {
            // 1. Find active session for this conversation
            const session = await prisma.chatbotSession.findFirst({
                where: {
                    conversationId,
                    status: { in: ["active", "paused"] }
                },
                include: {
                    flow: true,
                    chatbot: true
                }
            });

            if (!session) return false; // No active chatbot session

            const { chatbot, flow } = session;
            if (!chatbot.isActive || !flow.isActive) return false;

            // If session was paused (e.g. anti-spam), reactivate it since the lead is responding
            if (session.status === "paused") {
                logger.info({ conversationId }, "[ChatbotEngine] Reactivating paused session — lead sent a message");
                await prisma.chatbotSession.update({
                    where: { id: session.id },
                    data: { status: "active", consecutiveBotMsgs: 0 }
                });
            }

            // 2. Get API key
            const apiKey = await getMiniMaxApiKey();
            if (!apiKey) {
                logger.warn("[ChatbotEngine] No MiniMax API key configured");
                return false;
            }

            // 3. Reset consecutive bot messages counter — the lead just responded
            // Anti-spam only triggers when the bot sends N messages WITHOUT any lead reply
            if (session.consecutiveBotMsgs > 0) {
                await prisma.chatbotSession.update({
                    where: { id: session.id },
                    data: { consecutiveBotMsgs: 0 }
                });
            }

            // 4. Handoff: check if lead asked for human
            if (flow.handoffOnHumanRequest && this._isHumanRequest(messageText)) {
                await this._handoff(session.id, conversationId, "Lead solicitou atendente humano");
                return true; // We'll send a handoff message
            }

            // 5. Build conversation context
            const messageHistory = (session.messageHistory as unknown as ChatMessage[]) || [];
            messageHistory.push({ role: "user", content: messageText });

            // 6. Build system prompt with knowledge base
            const knowledgeContext = await buildKnowledgeContext(chatbot.id);
            const qualificationData = (session.qualificationData || {}) as Record<string, any>;
            const systemPrompt = buildSystemPrompt(
                chatbot, flow, session.entryMode, knowledgeContext, qualificationData
            );

            // 7. Call AI with Tool loop
            let aiMessages: any[] = [
                { role: "system", content: systemPrompt },
                ...messageHistory.slice(-20)
            ];

            const tools = [
                {
                    type: "function",
                    function: {
                        name: "check_calendar_availability",
                        description: "Verifica horários disponíveis na agenda do consultor para marcar reuniões. Use ANTES de sugerir um horário. SEMPRE use esta ferramenta, nunca invente horários.",
                        parameters: {
                            type: "object",
                            properties: {
                                startDate: { type: "string", description: "Data de início formato ISO 8601 em horário de Brasília (ex: 2026-05-12T00:00:00-03:00)" },
                                endDate: { type: "string", description: "Data final formato ISO 8601 em horário de Brasília" }
                            },
                            required: ["startDate", "endDate"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "book_meeting",
                        description: "Agenda a reunião na agenda do consultor. APÓS o lead escolher o horário, você DEVE pedir o e-mail dele. SÓ USE ESTA TOOL QUANDO TIVER O E-MAIL DO LEAD. NUNCA INVENTE UM E-MAIL.",
                        parameters: {
                            type: "object",
                            properties: {
                                summary: { type: "string", description: "Título da reunião (Ex: Reunião com João Silva)" },
                                startTime: { type: "string", description: "Início formato ISO 8601 em horário de Brasília (ex: 2026-05-12T10:00:00-03:00)" },
                                endTime: { type: "string", description: "Fim formato ISO 8601 em horário de Brasília. Duração de 1 hora (ex: 2026-05-12T11:00:00-03:00)" },
                                attendeeEmail: { type: "string", description: "Email do lead fornecido na conversa" }
                            },
                            required: ["summary", "startTime", "endTime", "attendeeEmail"]
                        }
                    }
                }
            ];

            let aiResponseText = "";
            let maxLoops = 3;

            while (maxLoops > 0) {
                maxLoops--;
                const response = await callMiniMaxAI(aiMessages, apiKey, tools);
                
                if (response.toolCalls && response.toolCalls.length > 0) {
                    // Append assistant message with tool calls
                    logger.info({ tools: response.toolCalls.map((t: any) => t.function?.name) }, "[ChatbotEngine] AI called tools");
                    aiMessages.push({ role: "assistant", content: response.text, tool_calls: response.toolCalls });
                    
                    const calendarService = new (await import("../integrations/google-calendar.service.js")).GoogleCalendarService();

                    // Resolve which user's calendar to use: consultant (SDR) first, then owner
                    let calendarUserId = chatbot.userId;
                    if (session.dealId) {
                        const deal = await prisma.deal.findUnique({
                            where: { id: session.dealId },
                            select: { consultantId: true }
                        });
                        if (deal?.consultantId) {
                            // Check if the consultant has Google Calendar connected
                            const consultantCal = await prisma.integrationSetting.findUnique({
                                where: { userId_provider: { userId: deal.consultantId, provider: "google_calendar" } }
                            });
                            if (consultantCal?.isActive && consultantCal?.credentials) {
                                calendarUserId = deal.consultantId;
                            }
                        }
                    }
                    logger.info({ calendarUserId }, "[ChatbotEngine] Using calendar for user");

                    for (const toolCall of response.toolCalls) {
                        try {
                            const args = JSON.parse(toolCall.function.arguments);
                            let resultStr = "";

                            if (toolCall.function.name === "check_calendar_availability") {
                                logger.info({ args }, "[ChatbotEngine] Checking calendar availability");
                                const busy = await calendarService.checkAvailability(calendarUserId, new Date(args.startDate), new Date(args.endDate));
                                resultStr = JSON.stringify({ success: true, busySlots: busy });
                                logger.info({ busySlots: busy.length }, "[ChatbotEngine] Calendar availability result");
                            } else if (toolCall.function.name === "book_meeting") {
                                logger.info({ args }, "[ChatbotEngine] Booking meeting");

                                // Build attendee list: lead email + advisor email (to ensure advisor gets the Google Calendar invite)
                                const attendeeEmails: string[] = [];
                                if (args.attendeeEmail) attendeeEmails.push(args.attendeeEmail);
                                // Also add the advisor's own email if different from lead's
                                const advisorUser = await prisma.user.findUnique({ where: { id: calendarUserId }, select: { email: true } });
                                if (advisorUser?.email && !attendeeEmails.includes(advisorUser.email)) {
                                    attendeeEmails.push(advisorUser.email);
                                }

                                const link = await calendarService.bookMeeting(calendarUserId, {
                                    summary: args.summary,
                                    startTime: new Date(args.startTime),
                                    endTime: new Date(args.endTime),
                                    attendeeEmails
                                });
                                resultStr = JSON.stringify({ success: true, meetingLink: link });
                                logger.info({ link, attendeeEmails }, "[ChatbotEngine] Meeting booked successfully");

                                // Move deal to "Reunião de Ideia" stage
                                if (session.dealId) {
                                    try {
                                        const reuniaoStage = await prisma.funnelStage.findFirst({
                                            where: {
                                                funnel: { userId: chatbot.userId },
                                                name: { contains: "Reuni", mode: "insensitive" }
                                            }
                                        });
                                        if (reuniaoStage) {
                                            await prisma.deal.update({
                                                where: { id: session.dealId },
                                                data: {
                                                    stageId: reuniaoStage.id,
                                                    stageEnteredAt: new Date(),
                                                    lastActivity: `Reunião de Ideia agendada via chatbot`
                                                }
                                            });
                                            logger.info({ dealId: session.dealId, stageId: reuniaoStage.id },
                                                "[ChatbotEngine] Deal moved to Reunião de Ideia");
                                        }
                                    } catch (moveErr: any) {
                                        logger.error({ moveErr: moveErr?.message || moveErr }, "[ChatbotEngine] Failed to move deal stage");
                                    }
                                }

                                // ── NOTIFICATIONS FOR BOOKING ──
                                try {
                                    const convDetails = await prisma.whatsappConversation.findUnique({
                                        where: { id: conversationId },
                                        include: { contact: { include: { client: true } }, assignee: true }
                                    });
                                    if (convDetails) {
                                        const advisor = convDetails.assignee;
                                        const lead = convDetails.contact.client;
                                        
                                        // 1. Notify Advisor (Platform)
                                        if (advisor) {
                                            await notificationFeedService.create({
                                                userId: advisor.id,
                                                type: "meeting",
                                                title: "Nova Reunião Agendada (Chatbot)",
                                                description: `O lead ${lead?.name || "Desconhecido"} agendou uma reunião para ${new Date(args.startTime).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`,
                                                dealId: session.dealId || undefined
                                            });
                                            // 2. Notify Advisor (Email)
                                            if (advisor.email) {
                                                await sendNotificationEmail(
                                                    advisor.email,
                                                    advisor.name,
                                                    "Nova Reunião Agendada pelo Chatbot",
                                                    `Olá ${advisor.name},\n\nO chatbot agendou uma reunião com o lead **${lead?.name || "Desconhecido"}** para o dia ${new Date(args.startTime).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.\n\nConfira os detalhes na plataforma.`
                                                );
                                            }
                                        }
                                        // 3. Notify Client (Email)
                                        if (lead && lead.email && args.attendeeEmail) {
                                            await sendNotificationEmail(
                                                args.attendeeEmail,
                                                lead.name,
                                                "Reunião Confirmada - Mestres da Web",
                                                `Olá ${lead.name},\n\nSua reunião com a Mestres da Web foi agendada para o dia ${new Date(args.startTime).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.\n\nEm breve enviaremos o link de acesso.\n\nAté logo!`
                                            );
                                        }
                                    }
                                } catch (nerr) {
                                    logger.error({ nerr }, "Failed to send booking notifications");
                                }
                            }

                            aiMessages.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                name: toolCall.function.name,
                                content: resultStr
                            });
                        } catch (err: any) {
                            aiMessages.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                name: toolCall.function.name,
                                content: JSON.stringify({ error: err.message })
                            });
                        }
                    }
                } else {
                    aiResponseText = response.text;
                    break;
                }
            }

            if (!aiResponseText) {
                logger.error("[ChatbotEngine] AI generated empty text, triggering handoff");
                await this._handoff(session.id, conversationId, "Erro interno da IA");
                return true;
            }

            // Sanitize AI response: remove NUL bytes and problematic escape sequences
            aiResponseText = aiResponseText.replace(/\x00/g, "").replace(/\\x[0-9a-fA-F]*/g, "");

            // 8. Extract qualification data (run in background, don't block response)
            const fields = (flow.qualificationFields as unknown as QualificationField[]) || [];
            let newQualData = qualificationData;
            let newScore = session.qualificationScore;

            if (fields.length > 0) {
                const extraction = await extractQualification(
                    qualificationData, fields, messageHistory, apiKey
                );
                newQualData = extraction.data;
                newScore = extraction.score;
            }

            // 9. Update message history
            messageHistory.push({ role: "assistant", content: aiResponseText });

            // 10. Send response via WhatsApp
            const credentials = await WhatsappService.getCredentials(chatbot.userId);
            if (!credentials) {
                logger.error("[ChatbotEngine] No WhatsApp credentials for bot user");
                return false;
            }

            const metaResponse = await WhatsappService.sendTextMessage(
                credentials, contactPhone, aiResponseText
            );
            const metaMessageId = metaResponse?.messages?.[0]?.id || null;

            // 11. Persist outbound message
            const botMessage = await prisma.whatsappMessage.create({
                data: {
                    conversationId,
                    metaMessageId,
                    direction: "outbound",
                    type: "text",
                    content: aiResponseText,
                    status: "sent",
                    timestamp: new Date()
                }
            });

            // 12. Update conversation snippet
            await prisma.whatsappConversation.update({
                where: { id: conversationId },
                data: {
                    lastMessageAt: botMessage.timestamp,
                    lastMessageSnippet: aiResponseText.substring(0, 50)
                }
            });

            // 13. Update session state
            await prisma.chatbotSession.update({
                where: { id: session.id },
                data: {
                    messageHistory: messageHistory.slice(-30) as any, // Keep last 30
                    qualificationData: newQualData as any,
                    qualificationScore: newScore,
                    consecutiveBotMsgs: 1, // Reset to 1: lead just spoke, bot replied once
                    lastBotMessageAt: new Date(),
                    lastLeadMessageAt: new Date()
                }
            });

            // 14. Check handoff conditions
            const totalMessages = messageHistory.filter(m => m.role === "user").length;
            const shouldHandoff =
                (flow.handoffOnQualified && newScore >= 100) ||
                (totalMessages >= flow.handoffAfterMessages);

            if (shouldHandoff) {
                await this._handoff(session.id, conversationId,
                    newScore >= 100 ? "Qualificação completa" : "Limite de mensagens atingido"
                );
            }

            // 15. Emit SSE event for the UI
            const conversation = await prisma.whatsappConversation.findUnique({
                where: { id: conversationId },
                include: {
                    contact: { include: { labels: { include: { label: true } } } },
                    assignee: true,
                    messages: { orderBy: { timestamp: "desc" }, take: 1 }
                }
            });

            if (conversation?.assigneeId) {
                whatsappEvents.emit(`user_${conversation.assigneeId}`, {
                    type: "NEW_MESSAGE",
                    data: {
                        message: {
                            id: botMessage.id,
                            text: aiResponseText,
                            time: botMessage.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                            isMe: true,
                            status: "sent"
                        },
                        conversation
                    }
                });
            }

            return true;
        } catch (err) {
            logger.error({ err, conversationId }, "[ChatbotEngine] Error handling incoming message");
            return false;
        } finally {
            processingLock.delete(conversationId);
        }
    },

    /**
     * Initiate an outbound conversation (Mode A).
     * Called when a Deal enters a stage with an active ChatbotFlow.
     */
    async initiateOutbound(
        flowId: string,
        conversationId: string,
        contactPhone: string,
        dealId?: string
    ): Promise<boolean> {
        try {
            const flow = await prisma.chatbotFlow.findUnique({
                where: { id: flowId },
                include: { chatbot: true }
            });

            if (!flow || !flow.isActive || !flow.chatbot.isActive) return false;

            // Check business hours for outbound
            // Removed to prevent dropping hot website leads since there is no queueing system
            // if (!isWithinBusinessHours(flow.chatbot.businessHoursStart, flow.chatbot.businessHoursEnd)) {
            //     logger.info("[ChatbotEngine] Outbound skipped: outside business hours");
            //     return false;
            // }

            // Check daily limit (warm-up)
            if (flow.chatbot.warmupEnabled) {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const sentToday = await prisma.chatbotSession.count({
                    where: {
                        chatbotId: flow.chatbot.id,
                        entryMode: "outbound_first",
                        createdAt: { gte: todayStart }
                    }
                });
                if (sentToday >= flow.chatbot.currentDailyLimit) {
                    logger.info({ sentToday, limit: flow.chatbot.currentDailyLimit },
                        "[ChatbotEngine] Outbound daily limit reached, but allowing to proceed to not drop hot leads");
                    // return false;
                }
            }

            // Avoid duplicate session — only block if session is still active
            const existing = await prisma.chatbotSession.findUnique({
                where: { flowId_conversationId: { flowId, conversationId } }
            });
            if (existing) {
                if (existing.status === "active" || existing.status === "paused") {
                    logger.info({ flowId, conversationId }, "[ChatbotEngine] Active outbound session already exists, skipping");
                    return false;
                }
                // Old completed/handed_off session — remove to allow re-engagement
                await prisma.chatbotSession.delete({ where: { id: existing.id } });
                logger.info({ flowId, conversationId, oldStatus: existing.status }, "[ChatbotEngine] Removed old completed session to allow re-engagement");
            }

            // Get credentials
            const credentials = await WhatsappService.getCredentials(flow.chatbot.userId);
            if (!credentials) return false;

            if (flow.outboundTemplateName) {
                const metaResponse = await WhatsappService.sendTemplateMessage(
                    credentials, contactPhone, flow.outboundTemplateName
                );

                const metaMessageId = metaResponse?.messages?.[0]?.id || null;

                // Resolve the actual template body for display instead of the placeholder
                const template = await prisma.whatsappTemplate.findUnique({
                    where: {
                        userId_name: {
                            userId: flow.chatbot.userId,
                            name: flow.outboundTemplateName
                        }
                    }
                });
                const templateContent = template?.body?.trim() || flow.outboundTemplateName;

                // Persist template message
                await prisma.whatsappMessage.create({
                    data: {
                        conversationId,
                        metaMessageId,
                        direction: "outbound",
                        type: "template",
                        content: templateContent,
                        status: "sent",
                        timestamp: new Date()
                    }
                });

                // Update conversation preview
                await prisma.whatsappConversation.update({
                    where: { id: conversationId },
                    data: { lastMessageSnippet: templateContent.slice(0, 120) }
                });

                // Create session
                await prisma.chatbotSession.create({
                    data: {
                        chatbotId: flow.chatbot.id,
                        flowId: flow.id,
                        conversationId,
                        dealId,
                        entryMode: "outbound_first",
                        status: "active",
                        messageHistory: []
                    }
                });

                logger.info({ flowId, conversationId, template: flow.outboundTemplateName },
                    "[ChatbotEngine] Outbound template sent, session created");
                return true;
            }

            // ── Mode A-Autonomous: No template → AI generates first message ──
            const apiKey = await getMiniMaxApiKey();
            if (!apiKey) {
                logger.warn("[ChatbotEngine] No MiniMax API key for autonomous outbound");
                return false;
            }

            // Fetch deal info for context
            let leadName = "Lead";
            if (dealId) {
                const deal = await prisma.deal.findUnique({
                    where: { id: dealId },
                    include: { client: { select: { name: true } } }
                });
                if (deal?.client?.name) leadName = deal.client.name;
            }

            // Build knowledge context
            const knowledgeContext = await buildKnowledgeContext(flow.chatbot.userId);

            // Build system prompt
            const qualificationData: Record<string, any> = {};
            const systemPrompt = buildSystemPrompt(
                flow.chatbot, flow, "outbound_first", knowledgeContext, qualificationData
            );

            // Ask AI to generate the opening message
            const openingMessages: ChatMessage[] = [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `O lead "${leadName}" acabou de preencher um formulário de interesse no nosso site. Gere uma PRIMEIRA mensagem de abordagem para enviar via WhatsApp. Seja cordial, apresente-se brevemente e pergunte como pode ajudar. NÃO use prefixos como "Assistente:" — envie APENAS o texto da mensagem.`
                }
            ];

            const aiResponse = await callMiniMaxAI(openingMessages, apiKey);
            const openingText = aiResponse.text;

            if (!openingText) {
                logger.error("[ChatbotEngine] AI returned empty opening message");
                return false;
            }

            // Send as regular text message
            const metaResponse = await WhatsappService.sendTextMessage(
                credentials, contactPhone, openingText
            );
            const metaMessageId = metaResponse?.messages?.[0]?.id || null;

            // Persist AI message
            await prisma.whatsappMessage.create({
                data: {
                    conversationId,
                    metaMessageId,
                    direction: "outbound",
                    type: "text",
                    content: openingText,
                    status: "sent",
                    timestamp: new Date()
                }
            });

            // Update conversation snippet
            await prisma.whatsappConversation.update({
                where: { id: conversationId },
                data: {
                    lastMessageAt: new Date(),
                    lastMessageSnippet: openingText.substring(0, 50)
                }
            });

            // Create session with the AI's opening in message history
            await prisma.chatbotSession.create({
                data: {
                    chatbotId: flow.chatbot.id,
                    flowId: flow.id,
                    conversationId,
                    dealId,
                    entryMode: "outbound_first",
                    status: "active",
                    messageHistory: [
                        { role: "assistant", content: openingText }
                    ]
                }
            });

            logger.info({ flowId, conversationId, mode: "autonomous" },
                "[ChatbotEngine] Autonomous outbound sent (AI-generated), session created");

            return true;
        } catch (err) {
            logger.error({ err, flowId, conversationId }, "[ChatbotEngine] Error initiating outbound");
            return false;
        }
    },

    /**
     * Initiate an inbound session (Mode B).
     * Called from the webhook when a new message arrives and there's a matching flow.
     */
    async initiateInbound(
        flowId: string,
        conversationId: string,
        contactPhone: string,
        messageText: string,
        dealId?: string
    ): Promise<boolean> {
        try {
            const flow = await prisma.chatbotFlow.findUnique({
                where: { id: flowId },
                include: { chatbot: true }
            });

            if (!flow || !flow.isActive || !flow.chatbot.isActive) return false;

            // Avoid duplicate session — do not restart AI if it already engaged in this flow (e.g. handed_off or completed)
            const existing = await prisma.chatbotSession.findUnique({
                where: { flowId_conversationId: { flowId, conversationId } }
            });
            if (existing) {
                return false; // Bot already acted on this stage, don't interrupt human
            }

            // Create session
            await prisma.chatbotSession.create({
                data: {
                    chatbotId: flow.chatbot.id,
                    flowId: flow.id,
                    conversationId,
                    dealId,
                    entryMode: "inbound_first",
                    status: "active",
                    messageHistory: [{ role: "user", content: messageText }],
                    lastLeadMessageAt: new Date()
                }
            });

            // Now handle the message (will generate AI response)
            return await this.handleIncomingMessage(conversationId, messageText, contactPhone);
        } catch (err) {
            logger.error({ err, flowId }, "[ChatbotEngine] Error initiating inbound");
            return false;
        }
    },

    /**
     * Check if a deal change should trigger a chatbot flow.
     * Called from deals.service when a deal moves to a new stage.
     */
    async onDealStageChange(dealId: string, stageId: string, funnelId: string): Promise<void> {
        logger.info({ dealId, stageId, funnelId }, "[ChatbotEngine] onDealStageChange called");
        try {
            // Find an active flow for this funnel + stage
            const flow = await prisma.chatbotFlow.findFirst({
                where: {
                    stageId,
                    funnelId,
                    isActive: true,
                    chatbot: { isActive: true }
                },
                include: { chatbot: true }
            });

            if (!flow) {
                logger.info({ dealId, stageId, funnelId }, "[ChatbotEngine] No active flow found for this stage/funnel, skipping");
                return;
            }

            logger.info({ dealId, flowId: flow.id, flowName: flow.name }, "[ChatbotEngine] Found matching flow");

            // Get the deal with client phone
            const deal = await prisma.deal.findUnique({
                where: { id: dealId },
                include: {
                    client: {
                        select: { id: true, phone: true, name: true }
                    }
                }
            });

            if (!deal?.client?.phone) {
                logger.info({ dealId, clientId: deal?.clientId }, "[ChatbotEngine] Deal client has no phone, skipping");
                return;
            }

            let rawPhone = deal.client.phone.trim();
            const hasExplicitPlus = rawPhone.startsWith('+');
            let phone = rawPhone.replace(/\D/g, "");
            
            if (phone.startsWith("0")) {
                phone = phone.replace(/^0+/, "");
            }
            
            // Se o telefone veio sem '+' (legado BR) e tem 10 ou 11 dígitos, adicionamos 55
            if (!hasExplicitPlus && (phone.length === 10 || phone.length === 11)) {
                phone = "55" + phone;
            }

            logger.info({ dealId, rawPhone, cleanedPhone: phone, clientName: deal.client.name }, "[ChatbotEngine] Phone resolved for outbound");

            // Find or create WhatsApp contact and conversation
            const phoneSuffix = phone.slice(-10);
            const phonePattern = `%${phoneSuffix}%`;

            const matchingContacts = await prisma.$queryRaw<Array<{ id: string }>>`
                SELECT id FROM whatsapp_contacts 
                WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${phonePattern}
                LIMIT 1
            `;

            let contact = matchingContacts[0]
                ? await prisma.whatsappContact.findUnique({ where: { id: matchingContacts[0].id } })
                : null;

            if (!contact) {
                contact = await prisma.whatsappContact.create({
                    data: {
                        phone,
                        profileName: deal.client.name,
                        clientId: deal.client.id
                    }
                });
            }

            // Find or create conversation
            let conversation = await prisma.whatsappConversation.findFirst({
                where: { contactId: contact.id }
            });

            if (!conversation) {
                conversation = await prisma.whatsappConversation.create({
                    data: {
                        contactId: contact.id,
                        assigneeId: deal.consultantId || deal.userId,
                        status: "open",
                        unreadCount: 0
                    }
                });
            }

            // Check if there's already an active session for this conversation
            const existingSession = await prisma.chatbotSession.findFirst({
                where: {
                    conversationId: conversation.id,
                    status: { in: ["active", "paused"] }
                }
            });
            if (existingSession) {
                if (existingSession.dealId === dealId) {
                    logger.info({ dealId, sessionId: existingSession.id }, "[ChatbotEngine] Active session already exists for this deal, skipping");
                    return;
                }
                // Close the old session from a different deal so the new deal can start fresh
                logger.info({ dealId, oldDealId: existingSession.dealId, sessionId: existingSession.id },
                    "[ChatbotEngine] Closing stale session from old deal to allow new deal engagement");
                await prisma.chatbotSession.update({
                    where: { id: existingSession.id },
                    data: { status: "completed" }
                });
            }

            // Check if lead has a recent inbound message (Mode B vs Mode A)
            const recentInbound = await prisma.whatsappMessage.findFirst({
                where: {
                    conversationId: conversation.id,
                    direction: "inbound",
                    timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                },
                orderBy: { timestamp: "desc" }
            });

            if (recentInbound) {
                // Mode B: Lead already initiated contact — start inbound session
                await this.initiateInbound(
                    flow.id, conversation.id, phone,
                    recentInbound.content || "", dealId
                );
            } else {
                // Mode A: Bot initiates — send outbound template
                await this.initiateOutbound(flow.id, conversation.id, phone, dealId);
            }
        } catch (err) {
            logger.error({ err, dealId, stageId }, "[ChatbotEngine] Error on deal stage change");
        }
    },

    // ═══ Private Helpers ═══

    _isHumanRequest(text: string): boolean {
        const keywords = [
            "falar com humano", "atendente", "pessoa real", "falar com alguém",
            "falar com alguem", "quero um humano", "operador", "transferir",
            "falar com pessoa", "atendimento humano", "suporte humano"
        ];
        const lower = text.toLowerCase();
        return keywords.some(kw => lower.includes(kw));
    },

    async _handoff(sessionId: string, conversationId: string, reason: string): Promise<void> {
        // Mark session as handed off
        await prisma.chatbotSession.update({
            where: { id: sessionId },
            data: { status: "handed_off" }
        });

        // Send transition message
        const credentials = await WhatsappService.getCredentials(
            (await prisma.chatbotSession.findUnique({
                where: { id: sessionId },
                select: { chatbot: { select: { userId: true } } }
            }))?.chatbot?.userId || ""
        );

        if (credentials) {
            const conversation = await prisma.whatsappConversation.findUnique({
                where: { id: conversationId },
                include: { contact: { include: { client: true } }, assignee: true }
            });

            if (conversation) {
                const handoffMsg = reason === "Erro interno da IA" 
                    ? "Tive um pequeno problema técnico aqui, mas não se preocupe! Vou transferir você para um de nossos especialistas que dará continuidade ao atendimento. 😊"
                    : "Perfeito! Vou transferir você para um de nossos especialistas que poderá te ajudar ainda melhor. 😊 Ele(a) já vai entrar em contato!";
                await WhatsappService.sendTextMessage(credentials, conversation.contact.phone, handoffMsg);

                await prisma.whatsappMessage.create({
                    data: {
                        conversationId,
                        direction: "outbound",
                        type: "text",
                        content: handoffMsg,
                        status: "sent",
                        timestamp: new Date()
                    }
                });

                // ── NOTIFY ADVISOR OF HANDOFF ──
                if (conversation.assignee) {
                    const advisor = conversation.assignee;
                    const leadName = conversation.contact.client?.name || conversation.contact.profileName || "Desconhecido";
                    
                    try {
                        await notificationFeedService.create({
                            userId: advisor.id,
                            type: "handoff",
                            title: "Lead Transferido do Chatbot",
                            description: `O lead ${leadName} foi transferido para você. Motivo: ${reason}.`,
                        });
                        
                        if (advisor.email) {
                            await sendNotificationEmail(
                                advisor.email,
                                advisor.name,
                                "Lead Transferido do Chatbot",
                                `Olá ${advisor.name},\n\nO lead **${leadName}** foi transferido do atendimento automático (Chatbot) para você.\nMotivo da transferência: ${reason}\n\nAcesse o CRM para continuar o atendimento.`
                            );
                        }
                    } catch (nerr) {
                        logger.error({ nerr }, "Failed to notify advisor on handoff");
                    }
                }
            }
        }

        logger.info({ sessionId, conversationId, reason }, "[ChatbotEngine] Session handed off");
    }
};
