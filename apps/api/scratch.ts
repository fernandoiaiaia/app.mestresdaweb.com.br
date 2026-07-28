import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const proposals = await prisma.assembledProposal.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    for (const p of proposals) {
        console.log(`Proposal: ${p.title} (${p.id})`);
        const scopeData = p.scopeData as any;
        if (scopeData && scopeData.clientFeedback) {
            console.log(JSON.stringify(scopeData.clientFeedback, null, 2));
        } else {
            console.log("No feedback");
        }
        console.log("----------------------");
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
