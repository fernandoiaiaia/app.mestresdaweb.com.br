const { PrismaClient } = require('./apps/api/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const p = await prisma.proposal.findFirst({
        orderBy: { createdAt: 'desc' },
        where: { estimate: { not: null } }
    });
    
    if (p) {
        console.log("Proposal ID:", p.id);
        const est = p.estimate;
        console.log("Estimate keys:", Object.keys(est));
        if (est.lines) {
            console.log("Has lines!", typeof est.lines, Array.isArray(est.lines));
            console.log("First line:", JSON.stringify(est.lines[0]).substring(0, 150));
        }
        if (est.platforms) {
            console.log("Has platforms!");
        }
    }
}
run().catch(console.error).finally(() => prisma.$disconnect());
