import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoriesByType: Record<string, string[]> = {
    "Recebimentos": ["Contrato Comercial"],
    "MRR": ["Hospedagem", "Suporte"],
    "Entregas": ["Aditivo Contratual"],
};

const paymentMethodsToAdd = ["Boleto", "TED"];

async function main() {
    const users = await prisma.user.findMany();

    for (const user of users) {
        console.log(`Backfilling defaults for user: ${user.email}`);

        for (const [typeGroup, categories] of Object.entries(categoriesByType)) {
            for (const categoryName of categories) {
                const existing = await prisma.transactionCategory.findFirst({
                    where: { userId: user.id, name: categoryName, typeGroup },
                });

                if (!existing) {
                    await prisma.transactionCategory.create({
                        data: {
                            userId: user.id,
                            name: categoryName,
                            typeGroup,
                        },
                    });
                    console.log(`  + Category: ${categoryName} (${typeGroup})`);
                }
            }
        }

        for (const methodName of paymentMethodsToAdd) {
            const existing = await prisma.paymentMethod.findFirst({
                where: { userId: user.id, name: methodName },
            });

            if (!existing) {
                await prisma.paymentMethod.create({
                    data: {
                        userId: user.id,
                        name: methodName,
                    },
                });
                console.log(`  + Payment method: ${methodName}`);
            }
        }
    }

    console.log("Backfill completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
