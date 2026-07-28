import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { WhatsappService } from "./whatsapp.service.js";
import { whatsappEvents } from "./whatsapp.events.js";
import { leadAssignmentService } from "../../lib/lead-assignment.service.js";
import { chatbotEngine } from "../chatbot/chatbot.engine.js";
import { upsertDealByContact } from "../deals/deals.service.js";
import { getOwnerUserId } from "../../lib/get-owner.js";


const router = Router();

// GET /api/webhooks/whatsapp - Meta Verification Challenge
router.get("/", async (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode !== "subscribe" || !token) {
        return res.sendStatus(403);
    }

    // Validate against stored verify tokens from all WhatsApp integrations
    try {
        const whatsappSettings = await prisma.integrationSetting.findMany({
            where: { provider: "whatsapp" },
            select: { credentials: true }
        });

        const storedTokens = whatsappSettings
            .map(s => (s.credentials as Record<string, any>)?.verifyToken)
            .filter(Boolean);

        if (storedTokens.length > 0 && !storedTokens.includes(token)) {
            logger.warn({ token }, "WhatsApp Webhook verification failed — token mismatch");
            return res.sendStatus(403);
        }

        logger.info({ token }, "WhatsApp Webhook Verified!");
        res.status(200).send(challenge);
    } catch (err) {
        // Fallback: accept if DB query fails (avoid locking out webhooks)
        logger.warn({ err, token }, "WhatsApp Webhook verification — DB check failed, accepting");
        res.status(200).send(challenge);
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

                        // ═══ CHATBOT ENGINE INTERCEPT ═══
                        // Check if there's an active chatbot session for this conversation.
                        // If the chatbot handles the message, it sends the AI response automatically.
                        // The human agent still sees the conversation in their inbox.
                        try {
                            const wasHandledByBot = await chatbotEngine.handleIncomingMessage(
                                conversation.id, textContent, fromPhone
                            );
                            if (wasHandledByBot) {
                                logger.info({ conversationId: conversation.id, fromPhone },
                                    "[WA Webhook] Message handled by ChatbotEngine");
                            } else {
                                let initiated = false;

                                // Path A: Contact has a linked client — check for deals with matching flows
                                let hasOpenDeals = false;
                                if (contact.clientId) {
                                    const activeDeals = await prisma.deal.findMany({
                                        where: { clientId: contact.clientId, status: "open" },
                                        select: { id: true, stageId: true, funnelId: true }
                                    });

                                    if (activeDeals.length > 0) {
                                        hasOpenDeals = true;
                                    }

                                    for (const deal of activeDeals) {
                                        const matchingFlow = await prisma.chatbotFlow.findFirst({
                                            where: {
                                                stageId: deal.stageId,
                                                funnelId: deal.funnelId,
                                                isActive: true,
                                                chatbot: { isActive: true }
                                            }
                                        });

                                        if (matchingFlow) {
                                            await chatbotEngine.initiateInbound(
                                                matchingFlow.id, conversation.id, fromPhone,
                                                textContent, deal.id
                                            );
                                            initiated = true;
                                            break;
                                        }
                                    }
                                }

                                // Path B: No client/deal — direct WhatsApp lead. Upsert client + deal.
                                if (!initiated && !hasOpenDeals) {
                                    logger.info({ fromPhone, profileName }, "[WA Webhook] Direct WhatsApp lead — upserting client & deal");

                                    // Resolved via the same getOwnerUserId() helper used by every other
                                    // lead-intake channel, so a contact that also reaches out via the
                                    // site/WhatsApp form lands under the same account for dedup purposes.
                                    const ownerId = await getOwnerUserId();

                                    if (ownerId) {
                                        const assignedUserId = conversation.assigneeId || ownerId;

                                        const result = await upsertDealByContact({
                                            userId: ownerId,
                                            assignedUserId,
                                            name: profileName || `Lead WhatsApp ${fromPhone.slice(-4)}`,
                                            email: null,
                                            phone: fromPhone,
                                            source: "whatsapp_direct",
                                            title: profileName || `Lead WhatsApp ${fromPhone.slice(-4)}`,
                                            tags: ["whatsapp"],
                                            message: textContent?.substring(0, 500) || null,
                                        });

                                        // Link contact to client
                                        await prisma.whatsappContact.update({
                                            where: { id: contact.id },
                                            data: { clientId: result.clientId }
                                        });

                                        logger.info(
                                            { dealId: result.dealId, clientId: result.clientId, isNewDeal: result.isNewDeal, wasReactivated: result.wasReactivated },
                                            "[WA Webhook] Upserted deal for direct WhatsApp lead"
                                        );

                                        // Trigger chatbot for inbound
                                        if (result.isNewDeal || result.wasReactivated) {
                                            const deal = await prisma.deal.findUnique({
                                                where: { id: result.dealId },
                                                select: { stageId: true, funnelId: true }
                                            });

                                            if (deal) {
                                                const matchingFlow = await prisma.chatbotFlow.findFirst({
                                                    where: {
                                                        stageId: deal.stageId,
                                                        funnelId: deal.funnelId,
                                                        isActive: true,
                                                        chatbot: { isActive: true }
                                                    }
                                                });

                                                if (matchingFlow) {
                                                    await chatbotEngine.initiateInbound(
                                                        matchingFlow.id, conversation.id, fromPhone,
                                                        textContent, result.dealId
                                                    ).catch(err => {
                                                        logger.error({ err, dealId: result.dealId },
                                                            "[WA Webhook] Error triggering inbound chatbot for direct WhatsApp lead");
                                                    });
                                                    initiated = true;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (botErr) {
                            logger.error({ botErr }, "[WA Webhook] ChatbotEngine error (non-blocking)");
                        }

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
