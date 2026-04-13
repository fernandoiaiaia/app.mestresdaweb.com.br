import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function disable2FA(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { securitySettings: true }
    });

    if (!user) {
      console.log(`User not found: ${email}`);
      return;
    }

    // Update User model
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false }
    });

    // Update SecuritySetting model if it exists
    if (user.securitySettings && user.securitySettings.length > 0) {
      await prisma.securitySetting.updateMany({
        where: { userId: user.id },
        data: { twoFactorEnabled: false }
      });
    }

    console.log(`✅ 2FA disabled for: ${email}`);
  } catch (error) {
    console.error(`❌ Error disabling 2FA for ${email}:`, error);
  }
}

async function main() {
  const emails = ['tratotada@gmail.com', 'fcesarf@hotmail.com'];
  for (const email of emails) {
    await disable2FA(email);
  }
  await prisma.$disconnect();
}

main();
