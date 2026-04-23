import { prisma } from './src/config/database.js';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function run() {
    const email = 'duda@gmail.com';
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (user) {
        console.log("Usuário já existe:", user);
        const hashedPassword = await bcrypt.hash("123456", 12);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword, role: Role.CLIENT, allowedApps: ["hub"] }
        });
        console.log("Senha atualizada para 123456 e Role alterado para CLIENT e allowedApps para hub");
    } else {
        console.log("Usuário NÃO existe. Criando...");
        const hashedPassword = await bcrypt.hash("123456", 12);
        user = await prisma.user.create({
            data: {
                name: "Duda Cliente",
                email: email,
                password: hashedPassword,
                role: Role.CLIENT,
                active: true,
                allowedApps: ["hub"]
            }
        });
        console.log("Usuário criado com sucesso com a senha 123456");
    }
    await prisma.$disconnect();
}
run();
