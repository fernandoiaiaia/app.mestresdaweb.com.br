import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    where: { phone: { not: null, not: "" } }
  });

  let updated = 0;
  for (const c of clients) {
    if (!c.phone) continue;
    
    const originalPhone = c.phone.trim();
    if (originalPhone.startsWith("+")) continue; // Already has international code

    const digits = originalPhone.replace(/\D/g, "");
    
    // If it starts with 55 and has 12 or 13 digits, it's likely already 55 without the +
    if (digits.startsWith("55") && digits.length >= 12 && digits.length <= 13) {
      const newPhone = "+" + originalPhone;
      await prisma.client.update({
        where: { id: c.id },
        data: { phone: newPhone }
      });
      console.log(`Updated ${originalPhone} -> ${newPhone}`);
      updated++;
      continue;
    }

    // If it's a standard Brazilian number (10 or 11 digits)
    if (digits.length === 10 || digits.length === 11) {
      const newPhone = "+55 " + originalPhone;
      await prisma.client.update({
        where: { id: c.id },
        data: { phone: newPhone }
      });
      console.log(`Updated ${originalPhone} -> ${newPhone}`);
      updated++;
      continue;
    }
  }

  console.log(`Finished updating ${updated} clients.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
