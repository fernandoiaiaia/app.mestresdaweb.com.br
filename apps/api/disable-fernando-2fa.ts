import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { email: 'fernando@mestresdaweb.com.br' },
    data: { twoFactorEnabled: false },
  });
  console.log('2FA disabled for fernando');
}
main().catch(console.error).finally(() => prisma.$disconnect());
