import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    where: { name: { contains: "teste nandola comedor", mode: "insensitive" } }
  });
  console.log("Found clients:", clients.length);
  for (const c of clients) {
    // 1. Delete Deals
    const deals = await prisma.deal.findMany({ where: { clientId: c.id } });
    for (const d of deals) {
      await prisma.deal.delete({ where: { id: d.id } });
      console.log("- Deleted deal:", d.title);
    }
    
    // 2. Delete Client Contacts
    await prisma.clientContact.deleteMany({ where: { clientId: c.id } });
    console.log("- Deleted client contacts");

    // 3. Delete WhatsApp Contacts and related data
    const wContacts = await prisma.whatsappContact.findMany({ where: { clientId: c.id } });
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
    await prisma.client.delete({ where: { id: c.id } });
    console.log("- Deleted client:", c.name);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
