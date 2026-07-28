import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
    // 1. Find ALL deals with source "Importação"
    const importDeals = await prisma.deal.findMany({
        where: {
            OR: [
                { source: "Importação" },
                { title: "Contato Importado" },
                { title: "Oportunidade Importada" }
            ]
        },
        select: { id: true, title: true, clientId: true }
    });
    console.log("Total deals de importação: " + importDeals.length);

    if (importDeals.length > 0) {
        const notesDel = await prisma.dealNote.deleteMany({
            where: { dealId: { in: importDeals.map(d => d.id) } }
        });
        console.log("Notas deletadas: " + notesDel.count);

        const dealsDel = await prisma.deal.deleteMany({
            where: { id: { in: importDeals.map(d => d.id) } }
        });
        console.log("Deals deletados: " + dealsDel.count);
    }

    // 2. Find ALL clients with source "Importação" that have NO remaining deals
    const importClients = await prisma.client.findMany({
        where: {
            OR: [
                { source: "Importação" },
                { name: "Contato Importado" }
            ]
        },
        select: { id: true, name: true }
    });
    console.log("Total clientes de importação: " + importClients.length);

    let clientsDel = 0;
    for (const cl of importClients) {
        const remainingDeals = await prisma.deal.count({ where: { clientId: cl.id } });
        if (remainingDeals === 0) {
            await prisma.client.delete({ where: { id: cl.id } });
            clientsDel++;
        } else {
            console.log("  Mantido (tem " + remainingDeals + " deals): " + cl.name);
        }
    }
    console.log("Clientes deletados: " + clientsDel);

    // 3. Final count
    const totalClients = await prisma.client.count();
    const totalDeals = await prisma.deal.count();
    console.log("\n=== Estado final ===");
    console.log("Clientes restantes: " + totalClients);
    console.log("Deals restantes: " + totalDeals);
}
run().then(() => process.exit(0));
