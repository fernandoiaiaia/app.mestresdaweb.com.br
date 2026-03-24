const { PrismaClient } = require('./apps/api/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const props = await prisma.proposal.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    console.log("Latest Proposals:");
    props.forEach(p => console.log(p.id, p.title, p.createdAt));

    const projects = await prisma.devProject.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    console.log("\nLatest DevProjects:");
    projects.forEach(p => console.log(p.id, p.name, p.createdAt, "Hours:", p.hoursEstimated));
}
run().catch(console.error).finally(() => prisma.$disconnect());
