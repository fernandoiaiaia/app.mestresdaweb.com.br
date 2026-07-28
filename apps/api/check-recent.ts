import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const expenses = await prisma.creditCardExpense.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    include: { invoice: true }
  });
  console.log("Recent Expenses:", JSON.stringify(expenses, null, 2));

  if (expenses.length > 0 && expenses[0].invoiceId) {
    const invoice = expenses[0].invoice;
    console.log("Invoice:", JSON.stringify(invoice, null, 2));
    
    if (invoice && invoice.transactionId) {
      const tx = await prisma.transaction.findUnique({ where: { id: invoice.transactionId } });
      console.log("Linked Transaction:", JSON.stringify(tx, null, 2));
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
