import { prisma } from "../../config/database.js";
import { v4 as uuidv4 } from "uuid";

export class CreditCardsService {
    // 1. Obter todos os cartões do usuário
    async getCards(userId: string) {
        return prisma.creditCard.findMany({
            where: { userId },
            include: {
                invoices: {
                    orderBy: [{ year: 'desc' }, { month: 'desc' }],
                    take: 3, // Retorna apenas as últimas faturas (incluindo a aberta)
                    include: {
                        expenses: {
                            orderBy: { date: 'desc' }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // 2. Criar um novo cartão
    async createCard(userId: string, data: { name: string; brand?: string; limit?: number; closingDay: number; dueDay: number; color?: string }) {
        return prisma.creditCard.create({
            data: {
                userId,
                name: data.name,
                brand: data.brand || null,
                limit: data.limit || null,
                closingDay: data.closingDay,
                dueDay: data.dueDay,
                color: data.color || "blue",
            }
        });
    }

    // 2.5 Atualizar um cartão
    async updateCard(userId: string, cardId: string, data: { name?: string; brand?: string; limit?: number; closingDay?: number; dueDay?: number; color?: string }) {
        return prisma.creditCard.updateMany({
            where: { id: cardId, userId },
            data: {
                name: data.name,
                brand: data.brand,
                limit: data.limit,
                closingDay: data.closingDay,
                dueDay: data.dueDay,
                color: data.color,
            }
        });
    }

    // 3. Obter detalhes de um cartão (todas as faturas e gastos)
    async getCard(userId: string, cardId: string) {
        return prisma.creditCard.findFirst({
            where: { id: cardId, userId },
            include: {
                invoices: {
                    orderBy: [{ year: 'desc' }, { month: 'desc' }],
                    include: {
                        expenses: {
                            orderBy: { date: 'desc' }
                        }
                    }
                }
            }
        });
    }

    // Lógica interna para descobrir/criar a fatura correta baseada no dia da compra e fechamento
    private async getOrCreateInvoice(userId: string, cardId: string, expenseDate: Date, closingDay: number, dueDay: number, cardName: string) {
        const expenseDay = expenseDate.getUTCDate();
        let invoiceMonth = expenseDate.getUTCMonth(); // 0 a 11
        let invoiceYear = expenseDate.getUTCFullYear();

        // Se a despesa for feita APÓS o dia de fechamento, cai na próxima fatura
        if (expenseDay > closingDay) {
            invoiceMonth += 1;
            if (invoiceMonth > 11) {
                invoiceMonth = 0;
                invoiceYear += 1;
            }
        }

        let invoice = await prisma.creditCardInvoice.findFirst({
            where: { creditCardId: cardId, month: invoiceMonth, year: invoiceYear }
        });

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const dueDate = new Date(Date.UTC(invoiceYear, invoiceMonth, dueDay, 12, 0, 0));

        if (!invoice) {
            // Cria a transação imediatamente
            const transaction = await prisma.transaction.create({
                data: {
                    userId,
                    description: `Fatura ${cardName} - ${monthNames[invoiceMonth]}/${invoiceYear}`,
                    client: cardName,
                    value: 0,
                    typeGroup: "Despesas variáveis",
                    category: "Cartão de Crédito",
                    date: dueDate,
                    dueDate: dueDate,
                    status: "Previsto",
                    account: "Conta Principal",
                    paymentMethod: "Boleto Bancário",
                    costCenter: "Administrativo"
                }
            });

            invoice = await prisma.creditCardInvoice.create({
                data: {
                    creditCardId: cardId,
                    transactionId: transaction.id,
                    month: invoiceMonth,
                    year: invoiceYear,
                    totalValue: 0,
                    status: 'open',
                    dueDate
                }
            });
        } else if (!invoice.transactionId) {
            // Fallback para faturas antigas que não têm transação vinculada
            const transaction = await prisma.transaction.create({
                data: {
                    userId,
                    description: `Fatura ${cardName} - ${monthNames[invoiceMonth]}/${invoiceYear}`,
                    client: cardName,
                    value: invoice.totalValue,
                    typeGroup: "Despesas variáveis",
                    category: "Cartão de Crédito",
                    date: dueDate,
                    dueDate: dueDate,
                    status: "Previsto",
                    account: "Conta Principal",
                    paymentMethod: "Boleto Bancário",
                    costCenter: "Administrativo"
                }
            });

            invoice = await prisma.creditCardInvoice.update({
                where: { id: invoice.id },
                data: { transactionId: transaction.id }
            });
        }

        return invoice;
    }

    // 4. Lançar uma nova despesa no cartão
    async addExpense(userId: string, cardId: string, data: { date: Date | string; description: string; category: string; value: number; installments?: number }) {
        const card = await prisma.creditCard.findFirst({ where: { id: cardId, userId } });
        if (!card) throw new Error('Card not found');

        const installmentsCount = data.installments && data.installments > 0 ? data.installments : 1;
        const valuePerInstallment = data.value / installmentsCount;
        const startDate = new Date(data.date);

        const createdExpenses = [];

        for (let i = 0; i < installmentsCount; i++) {
            // Adiciona meses para as próximas parcelas
            const expenseDate = new Date(startDate);
            expenseDate.setMonth(expenseDate.getMonth() + i);

            const invoice = await this.getOrCreateInvoice(userId, card.id, expenseDate, card.closingDay, card.dueDay, card.name);

            const expense = await prisma.creditCardExpense.create({
                data: {
                    creditCardId: card.id,
                    invoiceId: invoice.id,
                    date: expenseDate,
                    description: data.description,
                    category: data.category,
                    value: valuePerInstallment,
                    installment: installmentsCount > 1 ? `${i + 1}/${installmentsCount}` : null,
                }
            });

            // Atualiza o total da fatura
            const updatedInvoice = await prisma.creditCardInvoice.update({
                where: { id: invoice.id },
                data: { totalValue: { increment: valuePerInstallment } }
            });

            // Sincroniza a transação
            if (updatedInvoice.transactionId) {
                await prisma.transaction.update({
                    where: { id: updatedInvoice.transactionId },
                    data: { value: updatedInvoice.totalValue }
                });
            }

            createdExpenses.push(expense);
        }

        return createdExpenses;
    }

    // 5. Deletar Cartão
    async deleteCard(userId: string, cardId: string) {
        return prisma.creditCard.deleteMany({
            where: { id: cardId, userId }
        });
    }

    // 6. Deletar Despesa (reduz o total da fatura)
    async deleteExpense(userId: string, cardId: string, expenseId: string) {
        const expense = await prisma.creditCardExpense.findFirst({
            where: { id: expenseId, creditCardId: cardId, creditCard: { userId } },
            include: { invoice: true, creditCard: true }
        });
        
        if (!expense) throw new Error('Expense not found');

        await prisma.creditCardExpense.delete({ where: { id: expense.id } });

        if (expense.invoiceId && expense.invoice) {
            let invoice = expense.invoice;

            // Gera transação fallback se for antiga
            if (!invoice.transactionId) {
                invoice = await this.getOrCreateInvoice(userId, cardId, invoice.dueDate, expense.creditCard.closingDay, expense.creditCard.dueDay, expense.creditCard.name);
            }

            const updatedInvoice = await prisma.creditCardInvoice.update({
                where: { id: expense.invoiceId },
                data: { totalValue: { decrement: expense.value } }
            });

            if (updatedInvoice.transactionId) {
                await prisma.transaction.update({
                    where: { id: updatedInvoice.transactionId },
                    data: { value: updatedInvoice.totalValue }
                });
            }
        }

        return true;
    }

    // 6.5 Atualizar Despesa (apenas descrição, categoria e valor)
    async updateExpense(userId: string, cardId: string, expenseId: string, data: { description: string; category: string; value: number }) {
        const expense = await prisma.creditCardExpense.findFirst({
            where: { id: expenseId, creditCardId: cardId, creditCard: { userId } },
            include: { invoice: true, creditCard: true }
        });
        
        if (!expense) throw new Error('Expense not found');

        // Calcular a diferença de valor para atualizar o total da fatura
        const valueDifference = data.value - expense.value;

        // Atualizar a despesa
        const updatedExpense = await prisma.creditCardExpense.update({
            where: { id: expense.id },
            data: {
                description: data.description,
                category: data.category,
                value: data.value
            }
        });

        // Atualizar o total da fatura se houver diferença de valor
        if (valueDifference !== 0 && expense.invoiceId && expense.invoice) {
            let invoice = expense.invoice;

            // Gera transação fallback se for antiga
            if (!invoice.transactionId) {
                invoice = await this.getOrCreateInvoice(userId, cardId, invoice.dueDate, expense.creditCard.closingDay, expense.creditCard.dueDay, expense.creditCard.name);
            }

            const updatedInvoice = await prisma.creditCardInvoice.update({
                where: { id: expense.invoiceId },
                data: { totalValue: { increment: valueDifference } }
            });

            if (updatedInvoice.transactionId) {
                await prisma.transaction.update({
                    where: { id: updatedInvoice.transactionId },
                    data: { value: updatedInvoice.totalValue }
                });
            }
        }

        return updatedExpense;
    }

    // 7. FECHAR A FATURA: Apenas muda o status, não cria mais a transação do zero
    async closeInvoice(userId: string, cardId: string, invoiceId: string, account: string) {
        const card = await prisma.creditCard.findFirst({ where: { id: cardId, userId } });
        if (!card) throw new Error('Card not found');

        const invoice = await prisma.creditCardInvoice.findFirst({ where: { id: invoiceId, creditCardId: cardId } });
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.status === 'closed') throw new Error('Invoice already closed');
        if (invoice.totalValue <= 0) throw new Error('Invoice has zero value');

        // Se por um acaso absurdo ainda não tem transação, criamos agora
        if (!invoice.transactionId) {
            const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            const transaction = await prisma.transaction.create({
                data: {
                    userId,
                    description: `Fatura ${card.name} - ${monthNames[invoice.month]}/${invoice.year}`,
                    client: card.name,
                    value: invoice.totalValue,
                    typeGroup: "Despesas variáveis",
                    category: "Cartão de Crédito",
                    date: invoice.dueDate,
                    dueDate: invoice.dueDate,
                    status: "Previsto",
                    account: account || "Conta Principal",
                    paymentMethod: "Boleto Bancário",
                    costCenter: "Administrativo"
                }
            });

            return prisma.creditCardInvoice.update({
                where: { id: invoice.id },
                data: { status: 'closed', transactionId: transaction.id }
            });
        }

        // Se a transação já existe e o usuário escolheu uma conta no fechamento, atualizamos a conta
        if (account) {
            await prisma.transaction.update({
                where: { id: invoice.transactionId },
                data: { account }
            });
        }

        // Marca a Fatura como FECHADA
        return prisma.creditCardInvoice.update({
            where: { id: invoice.id },
            data: { status: 'closed' }
        });
    }

    // 8. Criar Fatura Manualmente (Nova Fatura)
    async createInvoice(userId: string, cardId: string, month: number, year: number) {
        const card = await prisma.creditCard.findFirst({ where: { id: cardId, userId } });
        if (!card) throw new Error('Card not found');

        const existing = await prisma.creditCardInvoice.findFirst({
            where: { creditCardId: cardId, month, year }
        });
        if (existing) throw new Error('Invoice already exists for this month and year');

        const dueDate = new Date(Date.UTC(year, month, card.dueDay, 12, 0, 0));

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                description: `Fatura ${card.name} - ${monthNames[month]}/${year}`,
                client: card.name,
                value: 0,
                typeGroup: "Despesas variáveis",
                category: "Cartão de Crédito",
                date: dueDate,
                dueDate: dueDate,
                status: "Previsto",
                account: "Conta Principal",
                paymentMethod: "Boleto Bancário",
                costCenter: "Administrativo"
            }
        });

        return prisma.creditCardInvoice.create({
            data: {
                creditCardId: cardId,
                transactionId: transaction.id,
                month,
                year,
                totalValue: 0,
                status: 'open',
                dueDate
            }
        });
    }

    // 9. Atualizar Fatura (Data de vencimento ou status)
    async updateInvoice(userId: string, cardId: string, invoiceId: string, data: { dueDate?: string | Date; status?: string }) {
        const invoice = await prisma.creditCardInvoice.findFirst({
            where: { id: invoiceId, creditCardId: cardId, creditCard: { userId } }
        });
        if (!invoice) throw new Error('Invoice not found');

        const updateData: any = {};
        if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
        if (data.status) updateData.status = data.status;

        const updated = await prisma.creditCardInvoice.update({
            where: { id: invoiceId },
            data: updateData
        });

        if (updateData.dueDate && updated.transactionId) {
            await prisma.transaction.update({
                where: { id: updated.transactionId },
                data: { dueDate: updateData.dueDate, date: updateData.dueDate }
            });
        }

        return updated;
    }

    // 10. Deletar Fatura (E seus gastos associados)
    async deleteInvoice(userId: string, cardId: string, invoiceId: string) {
        const invoice = await prisma.creditCardInvoice.findFirst({
            where: { id: invoiceId, creditCardId: cardId, creditCard: { userId } }
        });
        if (!invoice) throw new Error('Invoice not found');

        // Exclui todos os gastos da fatura
        await prisma.creditCardExpense.deleteMany({
            where: { invoiceId }
        });

        // Exclui a fatura
        await prisma.creditCardInvoice.delete({
            where: { id: invoiceId }
        });

        // Exclui a transação vinculada se existir e estiver zerada
        if (invoice.transactionId) {
            await prisma.transaction.deleteMany({
                where: { id: invoice.transactionId }
            });
        }

        return true;
    }
}
