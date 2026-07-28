import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dealIds = [
    "b5d76589-6a6a-47a3-93b8-34b12e488a2e",
    "acecc4ec-b8c1-4f0d-a13c-ac8e15ae89be"
  ];
  
  for (const dealId of dealIds) {
    console.log("Processing dealId:", dealId);
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { client: true }
    });

    if (!deal || !deal.clientId) {
      console.log("Deal not found or has no client:", dealId);
      continue;
    }

    const cId = deal.clientId;
    const clientName = deal.client?.name;
    console.log("Found client:", clientName, "id:", cId);

    // 1. Delete Deals
    const deals = await prisma.deal.findMany({ where: { clientId: cId } });
    for (const d of deals) {
      await prisma.deal.delete({ where: { id: d.id } });
      console.log("- Deleted deal:", d.title);
    }
    
    // 2. Delete Client Contacts
    await prisma.clientContact.deleteMany({ where: { clientId: cId } });
    console.log("- Deleted client contacts");

    // 3. Delete WhatsApp Contacts and related data
    const wContacts = await prisma.whatsappContact.findMany({ where: { clientId: cId } });
    for (const wc of wContacts) {
      const convos = await prisma.whatsappConversation.findMany({ where: { contactId: wc.id } });
      for (const convo of convos) {
        await prisma.chatbotSession.deleteMany({ where: { conversationId: convo.id } });
        await prisma.whatsappMessage.deleteMany({ where: { conversationId: convo.id } });
        await prisma.whatsappConversation.delete({ where: { id: convo.id } });
        console.log("- Deleted whatsapp conversation:", convo.id);
      }
      await prisma.whatsappContactLabel.deleteMany({ where: { contactId: wc.id } });
      await prisma.whatsappContact.delete({ where: { id: wc.id } });
      console.log("- Deleted whatsapp contact:", wc.phone);
    }
    
    // 4. Finally delete the client
    await prisma.client.delete({ where: { id: cId } });
    console.log("- Deleted client:", clientName);
    console.log("-----------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
