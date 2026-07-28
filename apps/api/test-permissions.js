import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { name: { contains: 'Maria', mode: 'insensitive' } },
    include: { permissions: true }
  });
  console.log(users.map(u => ({ email: u.email, role: u.role, name: u.name, pipelinePerm: u.permissions.find(p => p.module === 'crm.pipeline')?.dataScope, oppsPerm: u.permissions.find(p => p.module === 'crm.opportunities')?.dataScope })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
