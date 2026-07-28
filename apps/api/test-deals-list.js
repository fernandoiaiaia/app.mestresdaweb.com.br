import { PrismaClient } from '@prisma/client';
import { dealsService } from './src/modules/deals/deals.service.js';
const prisma = new PrismaClient();
async function main() {
  const maria = await prisma.user.findFirst({
    where: { email: 'maria@gmail.com' }
  });
  
  if (!maria) return;
  const list = await dealsService.list({ userId: maria.id }, {});
  console.log("Deals length:", list.length);
  for (const d of list.slice(0, 5)) {
    console.log(`Deal: ${d.title} | Consultant: ${d.consultant?.name}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
