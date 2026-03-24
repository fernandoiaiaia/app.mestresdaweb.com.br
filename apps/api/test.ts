import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
    console.log("Starting debug...");
    
    // Simulate API POST /api/proposals logic with clientId from the new proposal
    const clientId = "b15d1a72-3b52-458f-8479-641f914c641a";
    let finalViewerId: string | undefined = undefined;

    console.log(`[DEBUG] Received clientId: ${clientId}`);
    
    if (clientId) {
        console.log(`[DEBUG] Looking up clientEntity...`);
        const clientEntity = await prisma.client.findUnique({ where: { id: clientId } });
        console.log(`[DEBUG] clientEntity found it? ${!!clientEntity}, email=${clientEntity?.email}`);
        
        if (clientEntity?.email) {
            console.log(`[DEBUG] Looking up viewerExists... email=${clientEntity.email}`);
            const viewerExists = await prisma.user.findUnique({ where: { email: clientEntity.email } });
            console.log(`[DEBUG] viewerExists found it? ${!!viewerExists}, role=${viewerExists?.role}`);
            
            if (viewerExists && viewerExists.role === "VIEWER") {
                finalViewerId = viewerExists.id;
                console.log(`[DEBUG] Success! finalViewerId=${finalViewerId}`);
            } else {
                console.log(`[DEBUG] Failed: viewerExists=${!!viewerExists}, role=${viewerExists?.role}`);
            }
        }
    }
    
    console.log(`\nFINAL OUTCOME: finalViewerId = ${finalViewerId}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
