import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultTransactionTypes = [
    { name: "Recebimentos", nature: "income" },
    { name: "MRR", nature: "income" },
    { name: "Entregas", nature: "income" },
    { name: "Despesas fixas", nature: "expense" },
    { name: "Despesas variáveis", nature: "expense" },
    { name: "Pessoas", nature: "expense" },
    { name: "Impostos", nature: "expense" },
];

const defaultPaymentMethods = [
    "PIX",
    "Boleto",
    "Boleto Bancário",
    "TED",
    "TED / DOC",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Dinheiro",
];

async function main() {
    const users = await prisma.user.findMany();

    for (const user of users) {
        console.log(`Seeding for user: ${user.email}`);

        // Seed Transaction Types
        for (const type of defaultTransactionTypes) {
            const existing = await prisma.transactionType.findFirst({
                where: { userId: user.id, name: type.name }
            });

            if (!existing) {
                await prisma.transactionType.create({
                    data: {
                        userId: user.id,
                        name: type.name,
                        nature: type.nature,
                    }
                });
            }
        }

        // Seed Payment Methods
        for (const method of defaultPaymentMethods) {
            const existing = await prisma.paymentMethod.findFirst({
                where: { userId: user.id, name: method }
            });

            if (!existing) {
                await prisma.paymentMethod.create({
                    data: {
                        userId: user.id,
                        name: method,
                    }
                });
            }
        }
    }

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
