import { prisma } from './src/config/database.js';

async function main() {
    try {
        const email = "fernando@mestresdaweb.com.br";
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error(`Usuário não encontrado: ${email}`);
            return;
        }

        await prisma.user.update({
            where: { email },
            data: { twoFactorEnabled: false }
        });

        console.log(`Sucesso: 2FA desabilitado para ${email}.`);
    } catch (e) {
        console.error("Erro ao desabilitar 2FA:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
