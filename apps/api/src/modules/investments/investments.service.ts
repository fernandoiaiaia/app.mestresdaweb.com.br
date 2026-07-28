import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; role: string; }

export const investmentsService = {
    async list(user: JwtUser) {
        return prisma.investment.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: "desc" },
            include: { account: true }
        });
    },

    async getById(id: string, user: JwtUser) {
        const investment = await prisma.investment.findFirst({
            where: { id, userId: user.userId },
            include: { 
                history: { orderBy: { date: 'desc' } },
                account: true
            }
        });
        if (!investment) throw new Error("Investimento não encontrado");
        return investment;
    },

    async create(data: any, user: JwtUser) {
        return prisma.$transaction(async (tx) => {
            const investment = await tx.investment.create({
                data: {
                    userId: user.userId,
                    name: data.name,
                    institution: data.institution,
                    type: data.type,
                    initialAmount: data.initialAmount,
                    currentBalance: data.initialAmount,
                    startDate: new Date(data.startDate),
                    accountId: data.accountId || null,
                    status: "active"
                }
            });

            await tx.investmentHistory.create({
                data: {
                    investmentId: investment.id,
                    previousBalance: 0,
                    newBalance: data.initialAmount,
                    yield: 0,
                    notes: "Aplicação Inicial"
                }
            });

            // Se o investimento foi atrelado a uma conta, gera a transação de Transferência para retirar o saldo do fluxo de caixa
            if (data.accountId) {
                const bankAccount = await tx.bankAccount.findUnique({ where: { id: data.accountId } });
                
                if (bankAccount) {
                    await tx.transaction.create({
                        data: {
                            userId: user.userId,
                            description: `Aplicação - ${data.institution} - ${data.name}`,
                            client: data.institution,
                            value: -Math.abs(data.initialAmount),
                            typeGroup: "Transferência",
                            category: "Aplicação Financeira",
                            date: new Date(data.startDate),
                            dueDate: new Date(data.startDate),
                            status: "Pago",
                            account: bankAccount.name,
                            paymentMethod: "Transferência",
                            costCenter: "Geral",
                            notes: `Transferência automática gerada a partir da aplicação de investimento na instituição ${data.institution}.`
                        }
                    });
                }
            }

            return investment;
        });
    },

    async updateBalance(id: string, newBalance: number, notes: string | undefined, user: JwtUser) {
        return prisma.$transaction(async (tx) => {
            const investment = await tx.investment.findFirst({
                where: { id, userId: user.userId }
            });
            if (!investment) throw new Error("Investimento não encontrado");

            const previousBalance = investment.currentBalance;
            const yieldAmount = newBalance - previousBalance;

            await tx.investmentHistory.create({
                data: {
                    investmentId: investment.id,
                    previousBalance,
                    newBalance,
                    yield: yieldAmount,
                    notes
                }
            });

            const updatedInvestment = await tx.investment.update({
                where: { id },
                data: { currentBalance: newBalance }
            });

            return updatedInvestment;
        });
    }
};
