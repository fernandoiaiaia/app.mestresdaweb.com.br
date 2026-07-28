import { PrismaClient } from "@prisma/client";
import { WhatsappService } from "./src/modules/whatsapp/whatsapp.service.js";

const prisma = new PrismaClient();

async function main() {
    const dealId = process.argv[2] || "135bc26f-fb8d-4806-bb8d-7905c243a0c2";
    
    const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: {
            client: { select: { id: true, name: true, phone: true } },
            stage: { select: { id: true, name: true } },
            funnel: { select: { id: true, name: true } }
        }
    });
    
    if (!deal) { console.error("Deal not found"); return; }
    console.log("Deal:", deal.title, "Phone:", deal.client?.phone, "Stage:", deal.stage?.name);
    
    // Find the active flow matching this funnel+stage
    const flow = await prisma.chatbotFlow.findFirst({
        where: {
            stageId: deal.stageId,
            funnelId: deal.funnelId,
            isActive: true,
            chatbot: { isActive: true }
        },
        include: { chatbot: true }
    });
    
    if (!flow) { console.error("No matching active flow"); return; }
    console.log("Flow found:", flow.name, "Template:", flow.outboundTemplateName);
    
    if (!deal.client?.phone) { console.error("No phone"); return; }
    
    // Normalize phone
    let rawPhone = deal.client.phone.trim();
    const hasPlus = rawPhone.startsWith('+');
    let phone = rawPhone.replace(/\D/g, "");
    if (!hasPlus && phone.length <= 11) {
        phone = "55" + phone;
    }
    console.log("Normalized phone:", phone);
    
    // Get credentials
    const credentials = await WhatsappService.getCredentials(flow.chatbot.userId);
    if (!credentials) { console.error("No WhatsApp credentials"); return; }
    console.log("Credentials OK, wabaId:", credentials.wabaId);
    
    // Send template
    if (flow.outboundTemplateName) {
        console.log("Sending template:", flow.outboundTemplateName, "to:", phone);
        try {
            const result = await WhatsappService.sendTemplateMessage(credentials, phone, flow.outboundTemplateName);
            console.log("Template sent! Result:", JSON.stringify(result));
        } catch(e: any) {
            console.error("Send failed:", e.message);
        }
    }
    
    // Create WhatsApp contact + conversation + session
    const phoneSuffix = phone.slice(-10);
    let contact = await prisma.whatsappContact.findFirst({
        where: { phone: { contains: phoneSuffix } }
    });
    
    if (!contact) {
        contact = await prisma.whatsappContact.create({
            data: {
                phone,
                profileName: deal.client.name,
                clientId: deal.client.id
            }
        });
        console.log("Created WhatsApp contact:", contact.id);
    }
    
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
        console.log("Created conversation:", conversation.id);
    }
    
    // Create session
    const existing = await prisma.chatbotSession.findFirst({
        where: { conversationId: conversation.id, status: { in: ["active", "paused"] } }
    });
    
    if (!existing) {
        await prisma.chatbotSession.create({
            data: {
                chatbotId: flow.chatbot.id,
                flowId: flow.id,
                conversationId: conversation.id,
                dealId,
                entryMode: "outbound_first",
                status: "active",
                messageHistory: []
            }
        });

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
                conversationId: conversation.id,
                direction: "outbound",
                type: "template",
                content: templateContent,
                status: "sent",
                timestamp: new Date()
            }
        });

        // Update conversation preview
        await prisma.whatsappConversation.update({
            where: { id: conversation.id },
            data: { lastMessageSnippet: templateContent.slice(0, 120) }
        });

        console.log("Session + message created successfully!");
    } else {
        console.log("Session already exists:", existing.id);
    }
}

main().finally(() => prisma.$disconnect());
