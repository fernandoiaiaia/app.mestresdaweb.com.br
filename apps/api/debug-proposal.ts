import { prisma } from './src/config/database.js';

async function run() {
    const proposal = await prisma.assembledProposal.findUnique({
        where: { id: '6d873927-cb33-46d2-9843-e9d3686bef1e' },
        select: {
            clientId: true,
            client: {
                select: {
                    name: true,
                    company: true,
                    companyId: true,
                    companyRef: { select: { id: true, name: true } }
                }
            }
        }
    });
    console.log(JSON.stringify(proposal, null, 2));
    await prisma.$disconnect();
}
run();
