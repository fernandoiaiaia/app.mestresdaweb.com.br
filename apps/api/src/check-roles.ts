import { prisma } from "./config/database.js";

async function main() {
    const integrations = await prisma.integrationSetting.findMany({
        include: { user: { select: { email: true, role: true } } }
    });
    console.log("Integrações configuradas:", integrations.map(i => ({
        provider: i.provider,
        userEmail: i.user.email,
        userRole: i.user.role,
        isActive: i.isActive
    })));

    const owner = await prisma.user.findFirst({ where: { role: "OWNER" }});
    console.log("Existe algum OWNER?", owner ? owner.email : "Não");
}

main().catch(console.error).finally(() => prisma.$disconnect());
