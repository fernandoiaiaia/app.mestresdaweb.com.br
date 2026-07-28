const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'contato@mestresdaweb.com.br' }
  });
  if (!user) {
    console.log('User not found');
    return;
  }
  const logs = await prisma.loginLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify({ user: { id: user.id, email: user.email, active: user.active, twoFactorEnabled: user.twoFactorEnabled }, logs }, null, 2));
}
main().finally(() => prisma.$disconnect());
