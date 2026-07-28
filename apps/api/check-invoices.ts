import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const invoices = await prisma.creditCardInvoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { expenses: true }
  });
  console.log("Recent Invoices:", JSON.stringify(invoices, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
