import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { WhatsappService } from "./whatsapp.service.js";
import { whatsappEvents } from "./whatsapp.events.js";

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/whatsapp/sse
 * EventStream to sync real-time Whatsapp events to the logged-in client
 */
router.get("/sse", (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    if (!userId) {
        res.status(401).end();
        return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const listener = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const eventName = `user_${userId}`;
    whatsappEvents.on(eventName, listener);

    // Keep connection alive with pings
    const interval = setInterval(() => {
        res.write(`:\n\n`);
    }, 30000);

    req.on("close", () => {
        clearInterval(interval);
        whatsappEvents.removeListener(eventName, listener);
    });
});

/**
 * GET /api/whatsapp/conversations
 * Get all inbox conversations assigned to or relevant to this user's account
 */
router.get("/conversations", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        // In a strict mode we could check if the user has access.
        // For multi-tenant, we find all conversations linked to contacts under this user's config context
        const conversations = await prisma.whatsappConversation.findMany({
            where: {
                assigneeId: userId
            },
            include: {
                contact: {
                    include: {
                        labels: {
                            include: { label: true }
                        },
                        lead: { select: { id: true, name: true } },
                        client: { 
                            select: { 
                                id: true, 
                                name: true,
                                deals: {
                                    select: {
                                        id: true,
                                        title: true,
                                        value: true,
                                        status: true,
                                        temperature: true,
                                        stage: { select: { name: true } },
                                        funnel: { select: { name: true } }
                                    },
                                    orderBy: { updatedAt: "desc" }
                                }
                            } 
                        }
                    }
                }
            },
            orderBy: { lastMessageAt: "desc" }
        });

        // Format to match UI expectation — prioritize CRM names over WhatsApp profile name
        const formatted = conversations.map(c => ({
            id: c.id,
            contactId: c.contact.id,
            name: c.contact.client?.name || c.contact.lead?.name || c.contact.profileName || c.contact.phone,
            phone: c.contact.phone,
            lastMessage: c.lastMessageSnippet || "",
            time: c.lastMessageAt.toISOString(),
            unread: c.unreadCount,
            tags: c.contact.labels.map(l => l.label),
            linkedEntity: c.contact.client 
                ? { type: "client", id: c.contact.client.id, name: c.contact.client.name }
                : c.contact.lead 
                    ? { type: "lead", id: c.contact.lead.id, name: c.contact.lead.name }
                    : null,
            deals: c.contact.client?.deals?.map(d => ({
                id: d.id,
                title: d.title,
                value: d.value,
                status: d.status,
                temperature: d.temperature,
                stage: d.stage.name,
                funnel: d.funnel.name
            })) || []
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        logger.error({ err }, "Error listing whatsapp conversations");
        res.status(500).json({ success: false, error: { message: "Erro ao carregar conversas" } });
    }
});

/**
 * GET /api/whatsapp/conversations/:id/messages
 * Get the history of messages for a chat
 */
router.get("/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        const messages = await prisma.whatsappMessage.findMany({
            where: { conversationId: id },
            orderBy: { timestamp: "asc" } // Oldest to newest for chat
        });

        // Mark as read naturally because we opened it
        await prisma.whatsappConversation.update({
            where: { id },
            data: { unreadCount: 0 }
        });

        const formatted = messages.map(m => ({
            id: m.id,
            text: m.content || "",
            time: m.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            isMe: m.direction === "outbound",
            status: m.status
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        logger.error({ err }, "Error getting whatsapp messages");
        res.status(500).json({ success: false, error: { message: "Erro ao buscar histórico" } });
    }
});

/**
 * POST /api/whatsapp/conversations/:id/send
 * Sends a message from the panel to the WhatsApp Graph API
 */
router.post("/conversations/:id/send", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { text, type, mediaUrl } = req.body;
        const userId = (req as any).user?.userId;

        const conversation = await prisma.whatsappConversation.findUnique({
            where: { id },
            include: { contact: true }
        });

        if (!conversation) {
            return res.status(404).json({ success: false, error: { message: "Conversa não encontrada" } });
        }

        const credentials = await WhatsappService.getCredentials(userId);
        if (!credentials) {
            return res.status(400).json({ success: false, error: { message: "Integração WhatsApp SDR não está configurada" } });
        }

        // Send via Whatsapp Service API
        let metaResponse;
        if (type === "text" || !type) {
            metaResponse = await WhatsappService.sendTextMessage(credentials, conversation.contact.phone, text);
        } else {
            // Further expansion for media
            return res.status(400).json({ success: false, error: { message: "Tipo de envio não suportado" } });
        }

        const metaMessageId = metaResponse?.messages?.[0]?.id || null;

        // Persist locally
        const message = await prisma.whatsappMessage.create({
            data: {
                conversationId: id,
                metaMessageId,
                direction: "outbound",
                type: type || "text",
                content: text,
                status: "sent",
                timestamp: new Date()
            }
        });

        await prisma.whatsappConversation.update({
            where: { id },
            data: {
                lastMessageAt: message.timestamp,
                lastMessageSnippet: (text || "Mídia envida").substring(0, 50)
            }
        });

        res.json({ success: true, data: {
            id: message.id,
            text: message.content,
            time: message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            isMe: true,
            status: message.status
        }});
    } catch (err) {
        logger.error({ err }, "Error sending whatsapp message");
        res.status(500).json({ success: false, error: { message: "Erro ao enviar mensagem" } });
    }
});

/**
 * PUT /api/whatsapp/conversations/:id/labels
 * Updates the labels attached to a conversation's contact
 */
router.put("/conversations/:id/labels", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { labels } = req.body as { labels: string[] }; // array of Label IDs
        
        const conversation = await prisma.whatsappConversation.findUnique({
            where: { id },
            select: { contactId: true }
        });

        if (!conversation) return res.status(404).json({ success: false });

        // Wipe old
        await prisma.whatsappContactLabel.deleteMany({
            where: { contactId: conversation.contactId }
        });

        // Insert new
        if (labels && labels.length > 0) {
            await prisma.whatsappContactLabel.createMany({
                data: labels.map(labelId => ({
                    contactId: conversation.contactId,
                    labelId
                }))
            });
        }

        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, "Error updating whatsapp conversation labels");
        res.status(500).json({ success: false, error: { message: "Erro ao salvar etiquetas" } });
    }
});

/**
 * POST /api/whatsapp/conversations/init
 * Finds or creates a conversation/contact by phone
 */
router.post("/conversations/init", async (req: Request, res: Response) => {
    try {
        const { phone, name } = req.body;
        const userId = (req as any).user?.userId;

        if (!phone) {
            return res.status(400).json({ success: false, error: { message: "Telefone é obrigatório" } });
        }

        // Clean phone
        const cleanPhone = phone.replace(/\D/g, "");

        // 1. Find or create Contact
        let contact = await prisma.whatsappContact.findFirst({
            where: { phone: { contains: cleanPhone } }
        });

        if (!contact) {
            contact = await prisma.whatsappContact.create({
                data: {
                    phone: cleanPhone,
                    profileName: name || "Novo Contato",
                }
            });
        }

        // 2. Find or create Conversation
        let conversation = await prisma.whatsappConversation.findFirst({
            where: { contactId: contact.id, assigneeId: userId }
        });

        if (!conversation) {
            conversation = await prisma.whatsappConversation.create({
                data: {
                    contactId: contact.id,
                    assigneeId: userId,
                    status: "open",
                    unreadCount: 0
                }
            });
        }

        res.json({ success: true, data: { id: conversation.id } });
    } catch (err) {
        logger.error({ err }, "Error initializing whatsapp conversation");
        res.status(500).json({ success: false, error: { message: "Erro ao iniciar conversa" } });
    }
});

export function whatsappRoutes(app: Router) {
    app.use("/api/whatsapp", router);
}
