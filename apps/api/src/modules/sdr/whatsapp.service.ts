import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { aiService } from "./ai.service.js";

// ═══════════════════════════════════════
// WhatsApp Service — Meta Cloud API
// ═══════════════════════════════════════

const META_API_BASE = "https://graph.facebook.com/v21.0";

async function metaApiCall(endpoint: string, body: any): Promise<any> {
    const token = env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneId) {
        logger.warn("WhatsApp API não configurada");
        return null;
    }

    const response = await fetch(`${META_API_BASE}/${phoneId}/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.text();
        logger.error({ status: response.status, err }, "WhatsApp API error");
        throw new Error(`WhatsApp API error: ${response.status}`);
    }

    return response.json();
}

export const whatsappService = {
    /**
     * Send WhatsApp template message (first contact — requires approved template)
     */
    async sendTemplate(lead: any, step: any): Promise<void> {
        const result = await metaApiCall("messages", {
            messaging_product: "whatsapp",
            to: lead.phone,
            type: "template",
            template: {
                name: "sdr_first_contact",
                language: { code: "pt_BR" },
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: lead.name },
                            { type: "text", text: lead.segment || "sua área" },
                            { type: "text", text: lead.company || "sua empresa" },
                        ],
                    },
                ],
            },
        });

        // Log action
        const enrollment = await prisma.leadCadenceEnrollment.findFirst({
            where: { leadId: lead.id, status: "ativo" },
        });

        await prisma.cadenceAction.create({
            data: {
                enrollmentId: enrollment?.id,
                leadId: lead.id,
                channel: "whatsapp",
                actionType: "sent",
                content: `[Template: sdr_first_contact] Para: ${lead.name}`,
                metadata: result ? { whatsappMessageId: result.messages?.[0]?.id } : undefined,
            },
        });

        logger.info({ leadId: lead.id }, "WhatsApp template enviado");
    },

    /**
     * Send free-form WhatsApp message (within 24h window)
     */
    async sendFreeMessage(lead: any, message: string): Promise<void> {
        const result = await metaApiCall("messages", {
            messaging_product: "whatsapp",
            to: lead.phone,
            type: "text",
            text: { body: message },
        });

        const enrollment = await prisma.leadCadenceEnrollment.findFirst({
            where: { leadId: lead.id, status: { in: ["ativo", "respondeu"] } },
        });

        await prisma.cadenceAction.create({
            data: {
                enrollmentId: enrollment?.id,
                leadId: lead.id,
                channel: "whatsapp",
                actionType: "sent",
                content: message,
                metadata: result ? { whatsappMessageId: result.messages?.[0]?.id } : undefined,
            },
        });
    },

    /**
     * Handle incoming WhatsApp webhook from Meta
     */
    async handleWebhook(payload: any): Promise<void> {
        const entries = payload?.entry || [];
        for (const entry of entries) {
            const changes = entry?.changes || [];
            for (const change of changes) {
                const messages = change?.value?.messages || [];
                for (const msg of messages) {
                    await this.processIncoming(msg, change.value);
                }
            }
        }
    },

    async processIncoming(msg: any, value: any): Promise<void> {
        const phone = msg.from;
        const text = msg.text?.body || msg.button?.text || "";
        if (!text) return;

        // Find lead by phone
        const lead = await prisma.sdrLead.findFirst({ where: { phone: { contains: phone.slice(-10) } } });
        if (!lead) {
            logger.warn({ phone }, "WhatsApp message from unknown lead");
            return;
        }

        // Log received
        await prisma.cadenceAction.create({
            data: {
                leadId: lead.id,
                channel: "whatsapp",
                actionType: "received",
                content: text,
                metadata: { whatsappMessageId: msg.id, timestamp: msg.timestamp },
            },
        });

        // Interpret via AI
        const interpretation = await aiService.interpretResponse(lead, text, "whatsapp");

        // Handle opt-out
        if (interpretation.interest === "opt_out") {
            await prisma.sdrLead.update({
                where: { id: lead.id },
                data: { status: "opt_out", optedOutAt: new Date() },
            });
            await prisma.leadCadenceEnrollment.updateMany({
                where: { leadId: lead.id, status: { in: ["ativo", "respondeu"] } },
                data: { status: "opt_out", completedAt: new Date() },
            });
            await this.sendFreeMessage(lead, "Entendido! Você não receberá mais mensagens. Obrigado pelo seu tempo.");
            return;
        }

        // Update qualification
        if (Object.keys(interpretation.qualificationData).length > 0) {
            const existingData = (lead.qualificationData as Record<string, any>) || {};
            await prisma.sdrLead.update({
                where: { id: lead.id },
                data: {
                    qualificationData: { ...existingData, ...interpretation.qualificationData },
                    status: "respondeu",
                },
            });
        }

        // Update enrollment
        await prisma.leadCadenceEnrollment.updateMany({
            where: { leadId: lead.id, status: "ativo" },
            data: { status: "respondeu" },
        });

        // Log AI reasoning
        await prisma.cadenceAction.create({
            data: {
                leadId: lead.id,
                channel: "whatsapp",
                actionType: "qualified",
                aiReasoning: interpretation.reasoning,
                metadata: interpretation as any,
            },
        });

        // Generate AI reply
        const history = await prisma.cadenceAction.findMany({
            where: { leadId: lead.id, channel: "whatsapp" },
            orderBy: { createdAt: "asc" },
            take: 10,
        });

        const reply = await aiService.generateWhatsAppReply(lead, history, text);
        await this.sendFreeMessage(lead, reply);

        logger.info({ leadId: lead.id, interest: interpretation.interest }, "WhatsApp conversation processed");
    },
};
