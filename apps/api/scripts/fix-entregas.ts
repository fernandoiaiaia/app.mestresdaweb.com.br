import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Corrigindo transações de Entregas para pagamentos únicos...");

    // 1. Deletar todas as parcelas futuras (Recorrente 2 em diante)
    const deleted = await prisma.transaction.deleteMany({
        where: {
            typeGroup: "Entregas",
            installment: {
                startsWith: "Recorrente ",
                not: "Recorrente 1"
            }
        }
    });
    console.log(`Deletadas ${deleted.count} transações recorrentes (meses futuros).`);

    // 2. Limpar os dados de recorrência das transações originais (Recorrente 1)
    const updated = await prisma.transaction.updateMany({
        where: {
            typeGroup: "Entregas",
            installment: "Recorrente 1"
        },
        data: {
            installment: null,
            parentId: null
        }
    });
    console.log(`Corrigidas ${updated.count} transações originais para torná-las Pagamento Único.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
