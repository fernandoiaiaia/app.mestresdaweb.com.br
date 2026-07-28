import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const number = "5511940339752";
  const wContacts = await prisma.whatsappContact.findMany({ where: { phone: number } });
  
  console.log("Found whatsapp contacts:", wContacts.length);
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
}

main().catch(console.error).finally(() => prisma.$disconnect());
