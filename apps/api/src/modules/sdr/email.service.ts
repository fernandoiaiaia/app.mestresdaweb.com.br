import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { aiService } from "./ai.service.js";

// ═══════════════════════════════════════
// Email Service — Brevo
// ═══════════════════════════════════════

interface BrevoEvent {
    event: string;
    email: string;
    "message-id"?: string;
    ts_event?: number;
}

interface InboundEmail {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
}

async function sendViaBrevo(to: string, subject: string, html: string): Promise<string | null> {
    const apiKey = env.BREVO_API_KEY;
    if (!apiKey) {
        logger.warn("BREVO_API_KEY não configurada — email não enviado");
        return null;
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
            "Accept": "application/json",
        },
        body: JSON.stringify({
            sender: {
                email: env.BREVO_FROM_EMAIL || "noreply@sdr.com",
                name: env.BREVO_FROM_NAME || "SDR Automático",
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        logger.error({ status: response.status, err }, "Brevo API error");
        throw new Error(`Brevo error: ${response.status}`);
    }

    // Extract message ID from Brevo response
    const data = await response.json() as any;
    return data.messageId || null;
}

export const emailService = {
    /**
     * Send personalized email via AI + Brevo
     */
    async sendPersonalized(lead: any, step: any, tone: string = "formal"): Promise<void> {
        const template = step.templateContent || step.subject || "Olá {nome}, gostaria de conversar sobre como podemos ajudar a {empresa}.";
        const { subject, body } = await aiService.personalizeEmail(lead, template, tone);

        const messageId = await sendViaBrevo(lead.email, subject, body);

        // Log action
        const enrollment = await prisma.leadCadenceEnrollment.findFirst({
            where: { leadId: lead.id, status: "ativo" },
        });

        await prisma.cadenceAction.create({
            data: {
                enrollmentId: enrollment?.id,
                leadId: lead.id,
                channel: "email",
                actionType: "sent",
                content: `Assunto: ${subject}\n\n${body}`,
                metadata: messageId ? { brevoMessageId: messageId } : undefined,
            },
        });

        logger.info({ leadId: lead.id, subject }, "Email enviado via Brevo");
    },

    /**
     * Handle Brevo webhook event (open, click, delivered, etc.)
     */
    async handleWebhook(events: BrevoEvent[]): Promise<void> {
        for (const event of events) {
            const actionType = event.event === "opened" ? "opened"
                : event.event === "click" ? "clicked"
                    : event.event === "delivered" ? "delivered"
                        : null;
            if (!actionType) continue;

            // Find lead by email
            const lead = await prisma.sdrLead.findFirst({ where: { email: event.email } });
            if (!lead) continue;

            await prisma.cadenceAction.create({
                data: {
                    leadId: lead.id,
                    channel: "email",
                    actionType,
                    metadata: { brevoMessageId: event["message-id"], timestamp: event.ts_event },
                },
            });

            logger.info({ leadId: lead.id, event: event.event }, "Brevo event tracked");
        }
    },

    /**
     * Handle inbound email (reply from lead)
     */
    async handleInboundEmail(parsed: InboundEmail): Promise<void> {
        const lead = await prisma.sdrLead.findFirst({ where: { email: parsed.from } });
        if (!lead) {
            logger.warn({ from: parsed.from }, "Inbound email from unknown lead");
            return;
        }

        // Log received message
        await prisma.cadenceAction.create({
            data: {
                leadId: lead.id,
                channel: "email",
                actionType: "received",
                content: parsed.text,
            },
        });

        // Interpret via AI
        const interpretation = await aiService.interpretResponse(lead, parsed.text, "email");

        // Update enrollment
        const enrollment = await prisma.leadCadenceEnrollment.findFirst({
            where: { leadId: lead.id, status: "ativo" },
        });

        if (interpretation.interest === "opt_out") {
            await prisma.sdrLead.update({
                where: { id: lead.id },
                data: { status: "opt_out", optedOutAt: new Date() },
            });
            if (enrollment) {
                await prisma.leadCadenceEnrollment.update({
                    where: { id: enrollment.id },
                    data: { status: "opt_out", completedAt: new Date() },
                });
            }
            logger.info({ leadId: lead.id }, "Lead opted out via email");
            return;
        }

        // Update qualification data
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

        if (enrollment) {
            await prisma.leadCadenceEnrollment.update({
                where: { id: enrollment.id },
                data: { status: "respondeu" },
            });
        }

        // Log AI reasoning
        await prisma.cadenceAction.create({
            data: {
                leadId: lead.id,
                enrollmentId: enrollment?.id,
                channel: "email",
                actionType: "qualified",
                aiReasoning: interpretation.reasoning,
                metadata: interpretation as any,
            },
        });

        logger.info({ leadId: lead.id, interest: interpretation.interest }, "Email response interpreted");
    },
};
