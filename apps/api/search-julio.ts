import { prisma } from './src/config/database.js';

async function main() {
    try {
        const users = await prisma.user.findMany({
            where: { email: { contains: "julio", mode: "insensitive" } },
            select: { email: true, twoFactorEnabled: true }
        });
        console.log("Users with julio:", users);
    } catch (e) {
        console.error("Erro:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
