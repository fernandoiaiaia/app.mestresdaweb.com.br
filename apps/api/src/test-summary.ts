import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        const now = new Date();
        const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        console.log("1. Transactions...");
        const transactions = await prisma.transaction.findMany({
            where: {
                date: { gte: startOfMonthDate, lte: endOfMonthDate }
            },
        });

        console.log("2. Deals...");
        const dealsWon = await prisma.deal.findMany({
            where: {
                status: 'won',
                updatedAt: { gte: startOfMonthDate, lte: endOfMonthDate }
            }
        });

        console.log("3. Projects...");
        const activeProjects = await prisma.devProject.findMany({
            include: { tasks: { select: { estimatedHours: true, loggedHours: true } } }
        });

        console.log("4. Contracts...");
        const MS_IN_15_DAYS = 15 * 24 * 60 * 60 * 1000;
        const bottleneckDate = new Date(now.getTime() - MS_IN_15_DAYS);
        const stuckContracts = await prisma.contract.count({
            where: {
                status: { in: ['draft', 'review', 'sent'] },
                createdAt: { lt: bottleneckDate }
            }
        });

        console.log("5. Support...");
        const openTickets = await prisma.whatsappConversation.count({
            where: { status: 'open' }
        });

        console.log("All success!");
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
