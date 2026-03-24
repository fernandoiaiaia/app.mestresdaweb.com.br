import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const funnels = await prisma.funnel.findMany({ include: { stages: true } });
  console.dir(funnels, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
