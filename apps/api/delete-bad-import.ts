import { prisma } from "./src/config/database.js";

async function run() {
    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
    const clients = await prisma.client.findMany({
        where: { createdAt: { gte: twentyMinsAgo }, source: "Importação" }
    });
    console.log(`Encontrados ${clients.length} clientes para deletar.`);
    if (clients.length > 0) {
        await prisma.client.deleteMany({
            where: { id: { in: clients.map(c => c.id) } }
        });
        console.log("Deletados.");
    }
}
run();
