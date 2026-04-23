import { prisma } from './src/config/database.js';

async function run() {
    const email = 'julio@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { console.log('Usuário não encontrado'); await prisma.$disconnect(); return; }
    console.log(`Antes: twoFactorEnabled = ${user.twoFactorEnabled}`);
    await prisma.user.update({ where: { email }, data: { twoFactorEnabled: false } });
    console.log('2FA desabilitado com sucesso para', email);
    await prisma.$disconnect();
}
run();
