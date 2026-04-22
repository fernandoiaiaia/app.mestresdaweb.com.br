import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { getOwnerUserId } from "../../lib/get-owner.js";
import { leadAssignmentService } from "../../lib/lead-assignment.service.js";
import { WhatsappService } from "../whatsapp/whatsapp.service.js";
import { chatbotKnowledgeService } from "./chatbot-knowledge.service.js";
import { whatsappEvents } from "../whatsapp/whatsapp.events.js";

// ────────────────────────────────────────────────────────────
// Whatsbot AI Engine — Processes incoming WhatsApp messages
// through MiniMax M2.7 with Anthropic-compatible API
// ────────────────────────────────────────────────────────────

const DATA_TAG_REGEX = /<!--DATA:(.*?)-->/s;

interface QualificationField {
    key: string;
    label: string;
    required: boolean;
}

export const chatbotService = {

    /**
     * Main entry point — called by WhatsApp webhook after every inbound message.
     * Checks if there's an active session or applicable flow, and if so, processes the message through AI.
     */
    async processIncomingMessage(conversationId: string, message: any): Promise<void> {
        try {
            // 1. Check for an active session
            let session = await prisma.chatbotSession.findFirst({
                where: { conversationId, status: "active" },
                include: { flow: true },
            });

            if (session) {
                // Active session exists — process through AI
                await this.handleMessage(session, message);
                return;
            }

            // 2. No active session — check if there's an applicable inbound flow
            // Get the conversation's contact and figure out which funnel stage to check
            const conversation = await prisma.whatsappConversation.findUnique({
                where: { id: conversationId },
                include: { contact: true },
            });
            if (!conversation) return;

            const ownerId = await getOwnerUserId();
            if (!ownerId) return;

            // Find the default funnel's first stage (for new leads with no existing deal)
            const funnel = await prisma.funnel.findFirst({
                where: { userId: ownerId, active: true },
                orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
                include: { stages: { orderBy: { orderIndex: "asc" }, take: 1 } },
            });
            if (!funnel || funnel.stages.length === 0) return;

            const firstStageId = funnel.stages[0].id;

            // Check if contact already has a deal (use that deal's stage instead)
            let targetStageId = firstStageId;
            if (conversation.contact.clientId) {
                const existingDeal = await prisma.deal.findFirst({
                    where: { clientId: conversation.contact.clientId, status: "open" },
                    orderBy: { updatedAt: "desc" },
                    select: { stageId: true },
                });
                if (existingDeal) targetStageId = existingDeal.stageId;
            }

            // Find active inbound flows for this stage
            const flows = await prisma.chatbotFlow.findMany({
                where: { stageId: targetStageId, isActive: true, mode: { in: ["inbound", "both"] } },
                orderBy: { priority: "desc" },
            });
            if (flows.length === 0) return;

            const flow = flows[0]; // Highest priority

            // 3. Create new session
            session = await prisma.chatbotSession.create({
                data: {
                    flowId: flow.id,
                    conversationId,
                    status: "active",
                    collectedData: {},
                    messageCount: 0,
                },
                include: { flow: true },
            });

            logger.info({ sessionId: session.id, flowId: flow.id, conversationId }, "[Whatsbot] New session created");

            // Send welcome message if configured
            const settings = await prisma.chatbotSettings.findFirst({ where: { userId: ownerId } });
            if (settings?.welcomeMessage) {
                await this.sendReply(conversationId, settings.welcomeMessage);
            }

            // Process the initial message
            await this.handleMessage(session, message);

        } catch (err: any) {
            logger.error({ err: err.message, conversationId }, "[Whatsbot] Error processing message");
        }
    },

    /**
     * Core AI message handler — sends message through MiniMax and processes response
     */
    async handleMessage(session: any, message: any): Promise<void> {
        const flow = session.flow;
        const ownerId = await getOwnerUserId();
        if (!ownerId) return;

        // Check business hours
        const settings = await prisma.chatbotSettings.findFirst({ where: { userId: ownerId } });
        if (settings?.businessHoursEnabled) {
            const isOpen = this.checkBusinessHours(settings.businessHours as any);
            if (!isOpen) {
                await this.sendReply(session.conversationId, settings.offHoursMessage);
                return;
            }
        }

        // Check message limit
        const maxMessages = settings?.maxMessagesPerSession ?? 30;
        if (session.messageCount >= maxMessages) {
            const transferMsg = settings?.transferMessage || "Vou transferir você para um de nossos especialistas. Aguarde um momento!";
            await this.sendReply(session.conversationId, transferMsg);
            await prisma.chatbotSession.update({
                where: { id: session.id },
                data: { status: "transferred", transferredAt: new Date() },
            });
            logger.info({ sessionId: session.id }, "[Whatsbot] Session transferred — message limit reached");
            return;
        }

        // Get AI credentials (MiniMax via proposal_minimax integration)
        const miniMaxSetting = await prisma.integrationSetting.findFirst({
            where: { userId: ownerId, provider: "proposal_minimax", isActive: true },
        });
        if (!miniMaxSetting) {
            logger.warn("[Whatsbot] MiniMax integration not configured — skipping AI");
            return;
        }
        const creds = miniMaxSetting.credentials as any;
        if (!creds?.apiKey) return;

        // Build conversation history (last 20 messages)
        const conversation = await prisma.whatsappConversation.findUnique({
            where: { id: session.conversationId },
            include: {
                messages: { orderBy: { timestamp: "asc" }, take: 20 },
                contact: true,
            },
        });
        if (!conversation) return;

        // Build AI messages array
        const aiMessages: { role: string; content: string }[] = [];
        for (const msg of conversation.messages) {
            aiMessages.push({
                role: msg.direction === "inbound" ? "user" : "assistant",
                content: msg.content || "[mídia]",
            });
        }

        // Build system prompt
        const knowledgeContext = await chatbotKnowledgeService.getActiveContext();
        const collectedData = session.collectedData as Record<string, any> || {};
        const qualFields = (flow.qualificationFields as QualificationField[]) || [];

        const systemPrompt = this.buildSystemPrompt(
            settings?.persona || "",
            knowledgeContext,
            flow.systemPrompt || "",
            qualFields,
            collectedData,
            conversation.contact.profileName || "Lead",
        );

        // Call MiniMax M2.7 (non-streaming for chatbot)
        try {
            const resp = await fetch("https://api.minimax.io/anthropic/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": creds.apiKey,
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: creds.model ?? "MiniMax-M2.7",
                    max_tokens: 1024,
                    system: systemPrompt,
                    messages: aiMessages,
                }),
            });

            if (!resp.ok) {
                const errBody = await resp.text();
                logger.error({ status: resp.status, body: errBody }, "[Whatsbot] MiniMax API error");
                return;
            }

            const result = await resp.json() as any;
            let aiText = "";
            if (result.content && result.content.length > 0) {
                aiText = result.content.map((c: any) => c.text || "").join("");
            }

            if (!aiText) return;

            // Extract collected data from AI response
            const dataMatch = aiText.match(DATA_TAG_REGEX);
            let newCollected = { ...collectedData };
            if (dataMatch) {
                try {
                    const extracted = JSON.parse(dataMatch[1]);
                    newCollected = { ...newCollected, ...extracted };
                } catch { /* ignore parse errors */ }
            }

            // Remove the data tag from the visible response
            const cleanResponse = aiText.replace(DATA_TAG_REGEX, "").trim();

            // Send reply via WhatsApp
            if (cleanResponse) {
                await this.sendReply(session.conversationId, cleanResponse);
            }

            // Update session
            await prisma.chatbotSession.update({
                where: { id: session.id },
                data: {
                    collectedData: newCollected,
                    messageCount: { increment: 1 },
                },
            });

            // Check if all required fields are collected
            const requiredFields = qualFields.filter(f => f.required);
            const allCollected = requiredFields.length > 0 && requiredFields.every(f => {
                const val = newCollected[f.key];
                return val !== undefined && val !== null && val !== "";
            });

            if (allCollected && flow.autoCreateDeal) {
                await this.completeQualification(session, newCollected, flow, conversation);
            }

        } catch (err: any) {
            logger.error({ err: err.message }, "[Whatsbot] Error calling MiniMax");
        }
    },

    /**
     * Build the system prompt for the AI
     */
    buildSystemPrompt(
        persona: string,
        knowledge: string,
        flowPrompt: string,
        qualFields: QualificationField[],
        collectedData: Record<string, any>,
        contactName: string,
    ): string {
        const parts: string[] = [];

        parts.push(`[PERSONA]\n${persona || "Você é um assistente comercial profissional e amigável."}`);

        if (knowledge) {
            parts.push(`[CONTEXTO DA EMPRESA]\n${knowledge}`);
        }

        if (flowPrompt) {
            parts.push(`[INSTRUÇÕES DO FLUXO]\n${flowPrompt}`);
        }

        if (qualFields.length > 0) {
            const fieldList = qualFields.map(f =>
                `- ${f.label} (key: "${f.key}") ${f.required ? "[OBRIGATÓRIO]" : "[opcional]"}`
            ).join("\n");
            parts.push(`[CAMPOS A COLETAR]\nVocê precisa extrair as seguintes informações durante a conversa:\n${fieldList}`);
        }

        if (Object.keys(collectedData).length > 0) {
            parts.push(`[DADOS JÁ COLETADOS]\n${JSON.stringify(collectedData, null, 2)}`);
        }

        parts.push(`[NOME DO CONTATO]\n${contactName}`);

        parts.push(`[REGRAS IMPORTANTES]
1. Seja natural e conversacional. NÃO faça perguntas em formato de formulário.
2. Colete informações gradualmente durante a conversa, como um SDR humano faria.
3. Use o contexto da empresa para responder perguntas sobre serviços, preços e processos.
4. Ao final de CADA resposta, inclua um bloco invisível com os dados extraídos no formato:
   <!--DATA:{"key":"valor","outraKey":"valor"}-->
   Inclua TODOS os dados coletados até agora (antigos + novos).
5. Se o lead fizer perguntas sobre a empresa, responda com base no contexto fornecido.
6. Quando todos os campos obrigatórios estiverem preenchidos, agradeça e informe que um especialista entrará em contato.
7. Responda sempre em português do Brasil.
8. Mantenha as respostas concisas (máximo 3 parágrafos).`);

        return parts.join("\n\n");
    },

    /**
     * Send a reply message via WhatsApp
     */
    async sendReply(conversationId: string, text: string): Promise<void> {
        const conversation = await prisma.whatsappConversation.findUnique({
            where: { id: conversationId },
            include: { contact: true },
        });
        if (!conversation) return;

        const ownerId = await getOwnerUserId();
        if (!ownerId) return;

        const creds = await WhatsappService.getCredentials(ownerId);
        if (!creds) return;

        await WhatsappService.sendTextMessage(creds, conversation.contact.phone, text);

        // Save the outbound message
        const savedMsg = await prisma.whatsappMessage.create({
            data: {
                conversationId,
                direction: "outbound",
                type: "text",
                content: text,
                status: "sent",
                timestamp: new Date(),
            },
        });

        // Update conversation snippet
        await prisma.whatsappConversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: savedMsg.timestamp,
                lastMessageSnippet: text.substring(0, 50),
            },
        });

        // Emit SSE event
        const assigneeId = conversation.assigneeId;
        if (assigneeId) {
            const updatedConv = await prisma.whatsappConversation.findUnique({
                where: { id: conversationId },
                include: {
                    contact: { include: { labels: { include: { label: true } } } },
                    assignee: true,
                    messages: { orderBy: { timestamp: "desc" }, take: 20 },
                },
            });
            whatsappEvents.emit(`user_${assigneeId}`, {
                type: "NEW_MESSAGE",
                data: { message: savedMsg, conversation: updatedConv },
            });
        }
    },

    /**
     * Complete qualification — create Client + Deal in CRM
     */
    async completeQualification(session: any, data: Record<string, any>, flow: any, conversation: any): Promise<void> {
        const ownerId = await getOwnerUserId();
        if (!ownerId) return;

        const phone = conversation.contact.phone;
        const assignedUserId = await leadAssignmentService.resolveAssignee(phone, data.email || null);

        // Create or find Client
        let clientId: string | null = null;
        if (conversation.contact.clientId) {
            clientId = conversation.contact.clientId;
            // Update existing client with new data
            await prisma.client.update({
                where: { id: clientId },
                data: {
                    name: data.name || undefined,
                    email: data.email || undefined,
                    phone: phone,
                    company: data.company || data.empresa || undefined,
                },
            });
        } else {
            const client = await prisma.client.create({
                data: {
                    userId: ownerId,
                    name: data.name || data.nome || conversation.contact.profileName || "Lead WhatsApp",
                    email: data.email || null,
                    phone: phone,
                    company: data.company || data.empresa || null,
                    source: "Chatbot WhatsApp",
                    status: "new_lead",
                },
            });
            clientId = client.id;

            // Link WhatsApp contact to client
            await prisma.whatsappContact.update({
                where: { id: conversation.contact.id },
                data: { clientId },
            });
        }

        // Create Deal
        const deal = await prisma.deal.create({
            data: {
                userId: ownerId,
                consultantId: assignedUserId,
                clientId: clientId!,
                funnelId: flow.funnelId,
                stageId: flow.moveToStageId || flow.stageId,
                title: data.project || data.projeto || `Negócio - ${data.name || data.nome || "Lead WA"}`,
                value: data.budget ? parseFloat(data.budget) || 0 : 0,
                source: "Chatbot WhatsApp",
                priority: "medium",
                temperature: "warm",
                status: "open",
            },
        });

        // Add note with collected data
        await prisma.dealNote.create({
            data: {
                dealId: deal.id,
                userId: ownerId,
                content: `🤖 **Lead qualificado pelo Whatsbot**\n\n${Object.entries(data).map(([k, v]) => `- **${k}**: ${v}`).join("\n")}`,
                type: "note",
            },
        });

        // Update session
        await prisma.chatbotSession.update({
            where: { id: session.id },
            data: { status: "completed", dealId: deal.id },
        });

        // Send completion message
        const settings = await prisma.chatbotSettings.findFirst({ where: { userId: ownerId } });
        const completionMsg = `Obrigado por todas as informações! Um de nossos especialistas vai entrar em contato com você em breve. 🚀`;
        await this.sendReply(session.conversationId, completionMsg);

        logger.info({ sessionId: session.id, dealId: deal.id, assignedUserId }, "[Whatsbot] Qualification completed — Deal created");
    },

    /**
     * Check if current time is within business hours
     */
    checkBusinessHours(hours: Record<string, { start: string; end: string }> | null): boolean {
        if (!hours) return true;

        const now = new Date();
        const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const today = dayNames[now.getDay()];
        const schedule = hours[today];
        if (!schedule) return false;

        const [startH, startM] = schedule.start.split(":").map(Number);
        const [endH, endM] = schedule.end.split(":").map(Number);

        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    },

    /**
     * Trigger outbound flow for a deal
     */
    async triggerOutbound(dealId: string): Promise<{ success: boolean; message: string }> {
        const deal = await prisma.deal.findUnique({
            where: { id: dealId },
            include: { client: true },
        });
        if (!deal) return { success: false, message: "Deal não encontrado." };
        if (!deal.client.phone) return { success: false, message: "Cliente não tem telefone cadastrado." };

        // Find outbound flow for this stage
        const flows = await prisma.chatbotFlow.findMany({
            where: { stageId: deal.stageId, isActive: true, mode: { in: ["outbound", "both"] } },
            orderBy: { priority: "desc" },
        });
        if (flows.length === 0) return { success: false, message: "Nenhum fluxo outbound configurado para esta etapa." };

        const flow = flows[0];
        const ownerId = await getOwnerUserId();
        if (!ownerId) return { success: false, message: "OWNER não encontrado." };

        const creds = await WhatsappService.getCredentials(ownerId);
        if (!creds) return { success: false, message: "Credenciais WhatsApp não configuradas." };

        // Send template or text message
        if (flow.outboundTemplateId) {
            const template = await prisma.chatbotTemplate.findUnique({ where: { id: flow.outboundTemplateId } });
            if (template && template.status === "APPROVED") {
                await WhatsappService.sendTemplateMessage(creds, deal.client.phone, template.name);
            } else {
                return { success: false, message: "Template não aprovado pela Meta." };
            }
        } else {
            // Can only send free-form in response to user message within 24h window
            return { success: false, message: "Nenhum template configurado. Para envio outbound, é necessário um template aprovado pela Meta." };
        }

        // Create/find conversation and session
        let contact = await prisma.whatsappContact.findUnique({ where: { phone: deal.client.phone } });
        if (!contact) {
            contact = await prisma.whatsappContact.create({
                data: { phone: deal.client.phone, profileName: deal.client.name, clientId: deal.clientId },
            });
        }

        let conversation = await prisma.whatsappConversation.findFirst({ where: { contactId: contact.id } });
        if (!conversation) {
            conversation = await prisma.whatsappConversation.create({
                data: { contactId: contact.id, assigneeId: deal.consultantId, status: "open", unreadCount: 0 },
            });
        }

        await prisma.chatbotSession.create({
            data: { flowId: flow.id, conversationId: conversation.id, status: "active", collectedData: {}, messageCount: 0 },
        });

        logger.info({ dealId, flowId: flow.id }, "[Whatsbot] Outbound flow triggered");
        return { success: true, message: "Fluxo outbound disparado com sucesso." };
    },
};
