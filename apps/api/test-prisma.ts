import { prisma } from './src/config/database.js';

async function main() {
    try {
        const user = await prisma.user.findUnique({
            where: { id: "e29fb425-e7d7-4fc9-be14-352510e286a9" }
        });
        console.log("SUCCESS:", user);
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
