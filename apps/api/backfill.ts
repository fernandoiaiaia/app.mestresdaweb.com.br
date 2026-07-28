import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.creditCardInvoice.findMany({
    where: { transactionId: null, status: 'open' },
    include: { creditCard: true }
  });

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  for (const invoice of invoices) {
    const transaction = await prisma.transaction.create({
      data: {
        userId: invoice.creditCard.userId,
        description: `Fatura ${invoice.creditCard.name} - ${monthNames[invoice.month]}/${invoice.year}`,
        client: invoice.creditCard.name,
        value: invoice.totalValue,
        typeGroup: "Despesas variáveis",
        category: "Cartão de Crédito",
        date: invoice.dueDate,
        dueDate: invoice.dueDate,
        status: "Previsto",
        account: "Conta Principal",
        paymentMethod: "Boleto Bancário",
        costCenter: "Administrativo"
      }
    });

    await prisma.creditCardInvoice.update({
      where: { id: invoice.id },
      data: { transactionId: transaction.id }
    });
    console.log(`Created transaction ${transaction.id} for invoice ${invoice.id}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
