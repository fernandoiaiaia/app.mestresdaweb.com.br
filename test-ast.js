const { PrismaClient } = require('./apps/api/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const projectId = '5306d687-4ba3-4b5c-a611-30b3a8ca2c05';
    // Actually, let's just get any proposal with scopeRaw to see its structure
    const p = await prisma.proposal.findFirst({
        where: { scopeRaw: { not: '' } },
        orderBy: { createdAt: 'desc' }
    });
    
    if (p) {
        console.log("Proposal ID:", p.id);
        console.log("ScopeRaw snippet:", p.scopeRaw.substring(0, 500));
        let obj;
        try { obj = JSON.parse(p.scopeRaw); } catch(e) { console.log("JSON Parse failed"); }
        if (obj) {
            console.log("Is Array?", Array.isArray(obj));
            if (!Array.isArray(obj)) {
                console.log("Keys:", Object.keys(obj));
                if (obj.platforms) console.log("Platforms length:", obj.platforms.length);
            }
        }
    } else {
        console.log("No proposals found with scopeRaw");
    }
}
run().catch(console.error).finally(() => prisma.$disconnect());
