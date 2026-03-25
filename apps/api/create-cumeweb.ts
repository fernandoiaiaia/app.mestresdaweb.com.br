import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "cumeweb@icloud.com";
  const plainPassword = "admin123";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "OWNER",
      active: true,
      allowedApps: ["growth", "dev"],
      twoFactorEnabled: false,
    },
    create: {
      name: "Fernando Cezani",
      email,
      password: hashedPassword,
      role: "OWNER",
      active: true,
      allowedApps: ["growth", "dev"],
      twoFactorEnabled: false,
    },
  });

  console.log(`✅ Usuário criado com sucesso no banco de produção: ${user.email}`);
  console.log(`   Acesse usando a senha: ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao criar usuário:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
