import { prisma } from "../../config/database.js";

export interface FinancialSetupResult {
    bankAccounts: number;
    costCenters: number;
    paymentMethods: number;
    transactionTypes: number;
    categories: number;
}

const DEFAULT_BANK_ACCOUNTS = [
    { name: "Conta Principal", bank: "Banco Principal", type: "Corrente", color: "bg-blue-500" },
    { name: "Conta Investimentos", bank: "Banco Investimentos", type: "Investimento", color: "bg-emerald-500" },
    { name: "Caixa", bank: "Caixa Interno", type: "Caixa", color: "bg-orange-500" },
];

const DEFAULT_COST_CENTERS = [
    { name: "Comercial", code: "COM" },
    { name: "Desenvolvimento / Code", code: "DEV" },
    { name: "Marketing", code: "MKT" },
    { name: "Administrativo", code: "ADM" },
    { name: "RH", code: "RH" },
    { name: "Infraestrutura / TI", code: "INFRA" },
];

const DEFAULT_PAYMENT_METHODS = [
    { name: "PIX" },
    { name: "Boleto" },
    { name: "TED" },
    { name: "Cartão de Crédito" },
    { name: "Cartão de Débito" },
    { name: "Dinheiro" },
    { name: "Transferência Internacional" },
];

const DEFAULT_TRANSACTION_TYPES = [
    { name: "Recebimentos", nature: "income" },
    { name: "MRR", nature: "income" },
    { name: "Entregas", nature: "income" },
    { name: "Despesas fixas", nature: "expense" },
    { name: "Despesas variáveis", nature: "expense" },
    { name: "Pessoas", nature: "expense" },
    { name: "Impostos", nature: "expense" },
];

const DEFAULT_CATEGORIES: { name: string; typeGroup: string }[] = [
    // Recebimentos
    { name: "Venda de Projeto", typeGroup: "Recebimentos" },
    { name: "Venda de App", typeGroup: "Recebimentos" },
    { name: "Venda de Site", typeGroup: "Recebimentos" },
    { name: "Manutenção", typeGroup: "Recebimentos" },
    { name: "Hospedagem", typeGroup: "Recebimentos" },
    { name: "Consultoria", typeGroup: "Recebimentos" },
    { name: "Licenciamento de Software", typeGroup: "Recebimentos" },
    // MRR
    { name: "Assinatura Mensal", typeGroup: "MRR" },
    { name: "Suporte Mensal", typeGroup: "MRR" },
    { name: "Hospedagem Recorrente", typeGroup: "MRR" },
    { name: "SaaS White-label", typeGroup: "MRR" },
    // Entregas
    { name: "Entrega de Milestone", typeGroup: "Entregas" },
    { name: "Entrega de Sprint", typeGroup: "Entregas" },
    { name: "Entrega Final", typeGroup: "Entregas" },
    // Despesas fixas
    { name: "Aluguel", typeGroup: "Despesas fixas" },
    { name: "Salários", typeGroup: "Despesas fixas" },
    { name: "Internet", typeGroup: "Despesas fixas" },
    { name: "Energia", typeGroup: "Despesas fixas" },
    { name: "Softwares e Licenças", typeGroup: "Despesas fixas" },
    { name: "Contabilidade", typeGroup: "Despesas fixas" },
    // Despesas variáveis
    { name: "Marketing", typeGroup: "Despesas variáveis" },
    { name: "Viagens", typeGroup: "Despesas variáveis" },
    { name: "Treinamentos", typeGroup: "Despesas variáveis" },
    { name: "Eventos", typeGroup: "Despesas variáveis" },
    { name: "Comissões", typeGroup: "Despesas variáveis" },
    // Pessoas
    { name: "Salário", typeGroup: "Pessoas" },
    { name: "Benefícios", typeGroup: "Pessoas" },
    { name: "Recrutamento", typeGroup: "Pessoas" },
    { name: "Freelancers", typeGroup: "Pessoas" },
    // Impostos
    { name: "ISS", typeGroup: "Impostos" },
    { name: "INSS", typeGroup: "Impostos" },
    { name: "IRPJ", typeGroup: "Impostos" },
    { name: "CSLL", typeGroup: "Impostos" },
    { name: "PIS/COFINS", typeGroup: "Impostos" },
    { name: "Simples Nacional", typeGroup: "Impostos" },
];

export async function setupFinancialDefaults(userId: string): Promise<FinancialSetupResult> {
    const result: FinancialSetupResult = {
        bankAccounts: 0,
        costCenters: 0,
        paymentMethods: 0,
        transactionTypes: 0,
        categories: 0,
    };

    for (const item of DEFAULT_BANK_ACCOUNTS) {
        const existing = await prisma.bankAccount.findFirst({
            where: { userId, name: item.name },
        });
        if (!existing) {
            await prisma.bankAccount.create({ data: { ...item, userId } });
            result.bankAccounts++;
        }
    }

    for (const item of DEFAULT_COST_CENTERS) {
        const existing = await prisma.costCenter.findFirst({
            where: { userId, name: item.name },
        });
        if (!existing) {
            await prisma.costCenter.create({ data: { ...item, userId } });
            result.costCenters++;
        }
    }

    for (const item of DEFAULT_PAYMENT_METHODS) {
        const existing = await prisma.paymentMethod.findFirst({
            where: { userId, name: item.name },
        });
        if (!existing) {
            await prisma.paymentMethod.create({ data: { ...item, userId } });
            result.paymentMethods++;
        }
    }

    for (const item of DEFAULT_TRANSACTION_TYPES) {
        const existing = await prisma.transactionType.findFirst({
            where: { userId, name: item.name },
        });
        if (!existing) {
            await prisma.transactionType.create({ data: { ...item, userId } });
            result.transactionTypes++;
        }
    }

    for (const item of DEFAULT_CATEGORIES) {
        const existing = await prisma.transactionCategory.findFirst({
            where: { userId, name: item.name, typeGroup: item.typeGroup },
        });
        if (!existing) {
            await prisma.transactionCategory.create({ data: { ...item, userId } });
            result.categories++;
        }
    }

    return result;
}
