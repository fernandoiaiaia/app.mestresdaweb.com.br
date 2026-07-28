import { CreditCardsService } from './src/modules/financial/credit-cards.service.ts';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const service = new CreditCardsService();

async function main() {
  const card = await prisma.creditCard.findFirst();
  if (!card) return console.log("No card found");
  console.log("Card found:", card.id, card.userId);

  try {
    const res = await service.addExpense(card.userId, card.id, {
      date: new Date().toISOString(),
      description: "Test error",
      category: "Outros",
      value: 10
    });
    console.log("Success:", res);
  } catch (err: any) {
    console.error("Error adding expense:", err.message);
    console.error(err.stack);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
