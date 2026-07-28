const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function disable2FA(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { securitySettings: true },
  });

  if (!user) {
    console.log(`Usuário não encontrado: ${email}`);
    return;
  }

  // User.twoFactorEnabled is what auth.service.ts actually checks at login.
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false },
  });

  // Keep the user's own Security Settings screen consistent, if a row exists.
  if (user.securitySettings) {
    await prisma.securitySettings.update({
      where: { userId: user.id },
      data: { twoFactorEnabled: false },
    });
  }

  console.log(`✅ 2FA desabilitado para: ${email} (${user.name})`);
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: node scripts/disable-2fa.cjs <email>');
    process.exit(1);
  }
  await disable2FA(email);
}

main()
  .catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
