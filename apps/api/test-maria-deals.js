import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { 
       OR: [
          { email: { contains: 'maria', mode: 'insensitive' } },
          { email: { contains: 'edson', mode: 'insensitive' } }
       ]
    },
    include: { permissions: true }
  });
  console.log(users.map(u => ({ email: u.email, role: u.role, name: u.name, id: u.id, pipelinePerm: u.permissions.find(p => p.module === 'crm.pipeline')?.dataScope })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
