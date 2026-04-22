import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { WhatsappService } from "./whatsapp.service.js";
import { whatsappEvents } from "./whatsapp.events.js";
import { leadAssignmentService } from "../../lib/lead-assignment.service.js";

const router = Router();

// GET /api/webhooks/whatsapp - Meta Verification Challenge
router.get("/", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // In a prod environment, check this against a secured VERIFY_TOKEN env var
    // For now, allow acceptance as long as mode and token are present safely
    if (mode === "subscribe" && token) {
        logger.info({ token }, "WhatsApp Webhook Verified!");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Exported so the SDR webhooks route (which registers first) can also invoke Inbox processing
export async function processWhatsappWebhookForInbox(body: any): Promise<void> {
    if (body.object !== "whatsapp_business_account") return;

    try {
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.field !== "messages") continue;

                const value = change.value;
                const metadata = value.metadata;
                const phoneNumberId = metadata?.phone_number_id;

                if (!phoneNumberId) continue;

                logger.info({ phoneNumberId, field: change.field, hasMessages: !!value.messages, hasStatuses: !!value.statuses }, "WA webhook processing entry");

                // Find which of our multi-tenant users owns this phone number
                const targetAccount = await WhatsappService.getCredentialsByPhoneId(phoneNumberId);
                if (!targetAccount) {
                    logger.warn({ phoneNumberId }, "Received WhatsApp webhook for unregistered Phone ID — check if this Phone ID matches what is saved in Integration Settings");
                    continue;
                }

                logger.info({ phoneNumberId, userId: targetAccount.userId }, "WA webhook matched to user");

                const userId = targetAccount.userId;

                // 1. Process Messages (Incoming from leads)
                if (value.messages && value.messages.length > 0) {
                    for (const wpMessage of value.messages) {
                        const fromPhone = wpMessage.from;
                        const wamid = wpMessage.id;
                        const timestamp = wpMessage.timestamp; // unix timestamp

                        // Extract Contact Name explicitly sent by Meta
                        const contactProfile = value.contacts?.find((c: any) => c.wa_id === fromPhone);
                        const profileName = contactProfile?.profile?.name || "Novo Contato";

                        // Idempotency: skip if we already stored this message id
                        const existingMsg = await prisma.whatsappMessage.findUnique({ where: { metaMessageId: wamid } });
                        if (existingMsg) continue;

                        let textContent = "";
                        let type = wpMessage.type; // "text", "image", "audio", "document", etc

                        if (type === "text") {
                            textContent = wpMessage.text?.body || "";
                        } else if (type === "button") {
                            textContent = wpMessage.button?.text || "";
                        } else if (type === "interactive") {
                            const interactive = wpMessage.interactive;
                            if (interactive.type === "button_reply") {
                                textContent = interactive.button_reply.title || "";
                            } else if (interactive.type === "list_reply") {
                                textContent = interactive.list_reply.title || "";
                            }
                        } else {
                            textContent = `[Mensagem de tipo: ${type}]`;
                            // Here you would implement media downloading using Graph API media endpoints
                        }

                        // Auto-link: find matching Lead and Client by phone number
                        // Strip non-digit characters for flexible matching regardless of formatting
                        const phoneDigits = fromPhone.replace(/\D/g, '');
                        const phoneSuffix = phoneDigits.slice(-10); // last 10 digits (DDD + number)
                        const phonePattern = `%${phoneSuffix}%`;

                        // Use raw SQL with regexp_replace to strip formatting from stored phones
                        const [matchingLeads, matchingClients] = await Promise.all([
                            prisma.$queryRaw<Array<{ id: string }>>`
                                SELECT id FROM leads 
                                WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${phonePattern}
                                LIMIT 1
                            `,
                            prisma.$queryRaw<Array<{ id: string }>>`
                                SELECT id FROM clients 
                                WHERE phone IS NOT NULL AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${phonePattern}
                                LIMIT 1
                            `
                        ]);

                        const matchingLead = matchingLeads[0] || null;
                        const matchingClient = matchingClients[0] || null;

                        // upsert Contact with auto-linked Lead/Client
                        const contact = await prisma.whatsappContact.upsert({
                            where: { phone: fromPhone },
                            update: {
                                profileName: profileName,
                                ...(matchingLead ? { leadId: matchingLead.id } : {}),
                                ...(matchingClient ? { clientId: matchingClient.id } : {})
                            },
                            create: {
                                phone: fromPhone,
                                profileName: profileName,
                                ...(matchingLead ? { leadId: matchingLead.id } : {}),
                                ...(matchingClient ? { clientId: matchingClient.id } : {})
                            }
                        });

                        // get or create Conversation for this contact
                        // First check if ANY conversation exists for this contact (regardless of assignee)
                        let conversation = await prisma.whatsappConversation.findFirst({
                            where: { contactId: contact.id }
                        });

                        if (!conversation) {
                            // NEW contact — use Lead Assignment (Affinity + Round-Robin)
                            const resolvedAssignee = await leadAssignmentService.resolveAssignee(fromPhone, null);
                            conversation = await prisma.whatsappConversation.create({
                                data: {
                                    contactId: contact.id,
                                    assigneeId: resolvedAssignee,
                                    status: "open",
                                    unreadCount: 0
                                }
                            });
                            logger.info({ resolvedAssignee, contactPhone: fromPhone }, "[WA Webhook] New conversation assigned via LeadAssignment");
                        }

                        // Use the conversation's assignee as the userId for events
                        const conversationUserId = conversation.assigneeId || userId;

                        // Store Message
                        const savedMessage = await prisma.whatsappMessage.create({
                            data: {
                                conversationId: conversation.id,
                                metaMessageId: wamid,
                                direction: "inbound",
                                type: type,
                                content: textContent,
                                status: "delivered", // incoming messages are delivered
                                timestamp: new Date(timestamp * 1000)
                            }
                        });

                        // Update Conversation
                        const updatedConversation = await prisma.whatsappConversation.update({
                            where: { id: conversation.id },
                            data: {
                                lastMessageAt: savedMessage.timestamp,
                                lastMessageSnippet: textContent.substring(0, 50),
                                unreadCount: { increment: 1 }
                            },
                            include: { 
                                contact: {
                                    include: {
                                        labels: {
                                            include: { label: true }
                                        }
                                    }
                                }, 
                                assignee: true, 
                                messages: { orderBy: { timestamp: "desc" }, take: 20 } 
                            }
                        });

                        // Emit SSE Real-Time Event for the assigned salesperson
                        whatsappEvents.emit(`user_${conversationUserId}`, {
                            type: "NEW_MESSAGE",
                            data: {
                                message: savedMessage,
                                conversation: updatedConversation
                            }
                        });
                    }
                }

                // 2. Process Status Updates (Read Receipts / Delivered)
                if (value.statuses && value.statuses.length > 0) {
                    for (const statusObj of value.statuses) {
                        const wamid = statusObj.id;
                        const statusStr = statusObj.status; // "sent", "delivered", "read", "failed"

                        // Update status
                        const updatedMsg = await prisma.whatsappMessage.updateMany({
                            where: { metaMessageId: wamid },
                            data: { status: statusStr }
                        });

                        if (updatedMsg.count > 0) {
                            // Find the message exactly to get its conversation
                            const realMsg = await prisma.whatsappMessage.findUnique({
                                where: { metaMessageId: wamid },
                                select: { conversationId: true, id: true }
                            });
                            
                            if (realMsg) {
                                whatsappEvents.emit(`user_${userId}`, {
                                    type: "STATUS_UPDATE",
                                    data: {
                                        messageId: realMsg.id,
                                        conversationId: realMsg.conversationId,
                                        status: statusStr
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        logger.error({ err }, "Error processing WhatsApp Webhook Payload");
    }
}

// POST /api/webhooks/whatsapp - Receiving Messages and Status Receipts
router.post("/", async (req: Request, res: Response) => {
    res.sendStatus(200);
    await processWhatsappWebhookForInbox(req.body);
});

export function whatsappWebhookRoutes(app: Router) {
    app.use("/api/webhooks/whatsapp", router);
}
