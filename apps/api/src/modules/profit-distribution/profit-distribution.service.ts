import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; role: string; }

export const profitDistributionService = {
    async list(user: JwtUser) {
        return prisma.profitDistribution.findMany({
            where: { userId: user.userId },
            orderBy: { date: "desc" }
        });
    },

    async simulate(month: string, year: string, user: JwtUser, companyId: string = 'matriz') {
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: user.userId,
                status: "Pago",
                date: { gte: startDate, lte: endDate }
            }
        });

        let incomes = 0;
        let expenses = 0;

        transactions.forEach(t => {
            if (t.typeGroup === "Recebimentos") {
                incomes += t.value;
            } else if (t.typeGroup !== "Transferência") {
                // assumimos que todas as outras categorizações (Despesas fixas, variáveis, Impostos, Pessoas) que não sejam transferência são saídas
                // value is already negative for expenses usually, but let's check
                if (t.value < 0) {
                    expenses += Math.abs(t.value);
                } else if (t.typeGroup.includes("Despesa") || t.typeGroup === "Impostos" || t.typeGroup === "Pessoas") {
                    expenses += t.value; // just in case it was saved as positive
                }
            }
        });

        const totalProfit = incomes - expenses;

        const profile = await prisma.institutionalProfile.findUnique({
            where: { userId: user.userId }
        });

        let partners: any[] = [];
        if (profile && profile.partners) {
            const allPartners = typeof profile.partners === "string" ? JSON.parse(profile.partners) : profile.partners;
            partners = allPartners.filter((p: any) => p.companyId === companyId || (companyId === 'matriz' && !p.companyId));
        }

        return { incomes, expenses, totalProfit, partners };
    },

    async execute(data: any, user: JwtUser) {
        return prisma.$transaction(async (tx) => {
            const bankAccount = await tx.bankAccount.findUnique({ where: { id: data.accountId } });
            if (!bankAccount) throw new Error("Conta bancária não encontrada");

            const enrichedItems = [];

            for (const item of data.items) {
                // Gera a transação para o sócio
                const transaction = await tx.transaction.create({
                    data: {
                        userId: user.userId,
                        description: `Distribuição de Lucros - ${item.name} (${item.share}%)`,
                        client: item.name,
                        value: -Math.abs(item.value), // saída de caixa
                        typeGroup: "Pessoas",
                        category: "Distribuição de Lucros",
                        date: new Date(),
                        dueDate: new Date(),
                        status: "Pago",
                        account: bankAccount.name,
                        paymentMethod: "Transferência",
                        costCenter: "Geral",
                        notes: `Referência: ${data.referencePeriod}`
                    }
                });

                enrichedItems.push({
                    ...item,
                    transactionId: transaction.id
                });
            }

            const distribution = await tx.profitDistribution.create({
                data: {
                    userId: user.userId,
                    referencePeriod: data.referencePeriod,
                    totalProfit: data.totalProfit,
                    distributedAmount: data.distributedAmount,
                    accountId: data.accountId,
                    items: enrichedItems,
                    date: new Date()
                }
            });

            return distribution;
        });
    }
};
