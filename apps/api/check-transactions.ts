import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const transactions = await prisma.transaction.findMany({
    where: { category: 'Cartão de Crédito' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Recent Transactions for Cartão de Crédito:", JSON.stringify(transactions, null, 2));

  const invoices = await prisma.creditCardInvoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { expenses: true }
  });
  console.log("Recent Invoices:", JSON.stringify(invoices, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
