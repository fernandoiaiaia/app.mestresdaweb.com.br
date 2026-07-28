import { api } from "@/lib/api";

export type InvestmentHistory = {
    id: string;
    investmentId: string;
    date: string;
    previousBalance: number;
    newBalance: number;
    yield: number;
    notes?: string;
    createdAt: string;
};

export type Investment = {
    id: string;
    name: string;
    institution: string;
    type: string;
    initialAmount: number;
    currentBalance: number;
    startDate: string;
    status: string;
    accountId?: string;
    createdAt: string;
    updatedAt: string;
    history?: InvestmentHistory[];
    account?: {
        id: string;
        name: string;
        bank: string;
    };
};

export const investmentsService = {
    async list() {
        return api<Investment[]>("/api/investments");
    },

    async getById(id: string) {
        return api<Investment>(`/api/investments/${id}`);
    },

    async create(data: { name: string; institution: string; type: string; initialAmount: number; startDate: string; accountId?: string | null }) {
        return api<Investment>("/api/investments", {
            method: "POST",
            body: data
        });
    },

    async updateBalance(id: string, newBalance: number, notes?: string) {
        return api<Investment>(`/api/investments/${id}/balance`, {
            method: "POST",
            body: { newBalance, notes }
        });
    }
};
