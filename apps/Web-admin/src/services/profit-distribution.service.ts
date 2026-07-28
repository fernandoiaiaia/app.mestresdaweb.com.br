import { api } from "@/lib/api";

export type ProfitDistributionItem = {
    name: string;
    share: number;
    value: number;
    transactionId?: string;
};

export type ProfitDistribution = {
    id: string;
    referencePeriod: string;
    totalProfit: number;
    distributedAmount: number;
    accountId: string;
    items: ProfitDistributionItem[];
    date: string;
    createdAt: string;
};

export type ProfitSimulation = {
    incomes: number;
    expenses: number;
    totalProfit: number;
    partners: { name: string; share: string; cpf?: string; role?: string }[];
};

export const profitDistributionService = {
    async list() {
        return api<ProfitDistribution[]>("/api/profit-distribution");
    },

    async simulate(month: string, year: string, companyId?: string) {
        let url = `/api/profit-distribution/simulate?month=${month}&year=${year}`;
        if (companyId) {
            url += `&companyId=${companyId}`;
        }
        return api<ProfitSimulation>(url);
    },

    async execute(data: {
        referencePeriod: string;
        totalProfit: number;
        distributedAmount: number;
        accountId: string;
        items: ProfitDistributionItem[];
    }) {
        return api<ProfitDistribution>("/api/profit-distribution", {
            method: "POST",
            body: data
        });
    }
};
