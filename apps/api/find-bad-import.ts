import { prisma } from "./src/config/database.js";

async function run() {
    const clients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, email: true, source: true, createdAt: true }
    });
    console.log(clients);
}
run();
