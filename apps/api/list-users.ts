import { prisma } from "./src/config/database.js";

async function run() {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
    });
    console.log(users.map(u => u.name));
}
run();
