import { prisma } from './src/config/database.js';

async function main() {
    try {
        const deal = await prisma.deal.create({
            data: {
                title: "Teste Lead da Duda",
                value: 500000, // 5k
                probability: 50,
                userId: "e29fb425-e7d7-4fc9-be14-352510e286a9", // owner
                funnelId: "5a3ec88f-197a-46f4-9de7-49a9c7f82ce5",
                stageId: "b2498e01-c4aa-451f-a9aa-3b35d532745a", // Novo Lead
            }
        });
        console.log("SUCCESS:", deal.id);
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
