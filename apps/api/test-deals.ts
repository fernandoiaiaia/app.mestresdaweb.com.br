import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching deals...");
    const deals = await prisma.deal.findMany({
        take: 3,
        select: { id: true, title: true, userId: true }
    });
    console.log(JSON.stringify(deals, null, 2));
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
