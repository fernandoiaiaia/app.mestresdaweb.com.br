import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { email: 'fernando@mestresdaweb.com.br' },
    data: { role: 'ADMIN', allowedApps: ['WEB_ADMIN', 'WEB_COMERCIAL'] },
  });
  console.log('User role updated to ADMIN');
}
main().catch(console.error).finally(() => prisma.$disconnect());
