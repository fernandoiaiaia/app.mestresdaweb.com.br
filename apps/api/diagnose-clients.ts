import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
    // List all clients grouped by source to understand what's left
    const clients = await prisma.client.findMany({
        select: { id: true, name: true, source: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" }
    });

    // Group by source
    const bySource: Record<string, number> = {};
    for (const c of clients) {
        const src = c.source || "null";
        bySource[src] = (bySource[src] || 0) + 1;
    }
    console.log("=== Clientes por fonte ===");
    for (const [src, count] of Object.entries(bySource).sort((a,b) => b[1] - a[1])) {
        console.log("  " + src + ": " + count);
    }

    // Show the most recent 20 clients
    console.log("\n=== 20 clientes mais recentes ===");
    for (const c of clients.slice(0, 20)) {
        const deals = await prisma.deal.count({ where: { clientId: c.id } });
        console.log("  [" + c.createdAt.toISOString().slice(0,10) + "] " + c.name + " | " + (c.email || "sem email") + " | fonte: " + (c.source || "null") + " | deals: " + deals);
    }
}
run().then(() => process.exit(0));
