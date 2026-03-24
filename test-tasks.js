const { PrismaClient } = require('./apps/api/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const p = await prisma.devProject.findUnique({
        where: { id: '5306d687-4ba3-4b5c-a611-30b3a8ca2c05' },
        include: { tasks: true }
    });
    
    if (p) {
        console.log("Found project:", p.name, p.id);
        console.log("Number of tasks:", p.tasks.length);
        console.log("Hours estimated:", p.hoursEstimated);
        // Find latest project
        const latest = await prisma.devProject.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { tasks: true }
        });
        console.log("LATEST Project ID:", latest.id);
        console.log("LATEST Project Tasks:", latest.tasks.length);
    } else {
        console.log("Project 5306... not found.");
    }
}
run().catch(console.error).finally(() => prisma.$disconnect());
