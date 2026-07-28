const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash1 = await bcrypt.hash('FernandinhoCunha@3041***', 12);
  const hash2 = await bcrypt.hash('FernandinhoCunha@3041***', 12);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'fernando@mestresdaweb.com.br' },
    update: {
      password: hash1,
      role: 'OWNER',
      allowedApps: ['growth', 'dev', 'comercial', 'cliente'],
      active: true,
      twoFactorEnabled: false
    },
    create: {
      email: 'fernando@mestresdaweb.com.br',
      name: 'Fernando',
      password: hash1,
      role: 'OWNER',
      allowedApps: ['growth', 'dev', 'comercial', 'cliente'],
      active: true,
      twoFactorEnabled: false
    }
  });
  
  const user2 = await prisma.user.upsert({
    where: { email: 'contato@mestresdaweb.com.br' },
    update: {
      password: hash2,
      role: 'OWNER',
      allowedApps: ['growth', 'dev', 'comercial', 'cliente'],
      active: true,
      twoFactorEnabled: false
    },
    create: {
      email: 'contato@mestresdaweb.com.br',
      name: 'Contato',
      password: hash2,
      role: 'OWNER',
      allowedApps: ['growth', 'dev', 'comercial', 'cliente'],
      active: true,
      twoFactorEnabled: false
    }
  });

  console.log('Usuarios criados com sucesso:', user1.email, user2.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
