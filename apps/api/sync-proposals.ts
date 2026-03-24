import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
    console.log("Starting historical proposal synchronization...");

    const proposals = await prisma.proposal.findMany({
        where: { viewerId: null, clientId: { not: null } }
    });

    console.log(`Found ${proposals.length} proposals missing viewerId but having a clientId.`);

    let updatedCount = 0;

    for (const proposal of proposals) {
        const client = await prisma.client.findUnique({ where: { id: proposal.clientId! } });
        if (client && client.email) {
            const viewer = await prisma.user.findUnique({ where: { email: client.email } });
            if (viewer && viewer.role === "VIEWER") {
                await prisma.proposal.update({
                    where: { id: proposal.id },
                    data: { viewerId: viewer.id }
                });
                console.log(`[SYNC] Proposal ${proposal.id} linked to viewer ${viewer.id} (${viewer.email})`);
                updatedCount++;
            }
        }
    }

    console.log(`\nDONE. Successfully synced ${updatedCount} proposals.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
