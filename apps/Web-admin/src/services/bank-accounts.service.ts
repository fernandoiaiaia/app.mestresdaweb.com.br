import { api } from "@/lib/api";

export type AccountType = "Corrente" | "Poupança" | "Investimento" | "Caixa";

export type BankAccount = {
    id: string;
    name: string;
    bank: string;
    agency: string;
    accountNumber: string;
    type: AccountType;
    initialBalance: number;
    color: string;
    isActive: boolean;
};

export const bankAccountsService = {
    async list() {
        return api<BankAccount[]>("/api/bank-accounts");
    },
    async getById(id: string) {
        return api<BankAccount>(`/api/bank-accounts/${id}`);
    },
    async create(data: Partial<BankAccount>) {
        return api<BankAccount>("/api/bank-accounts", {
            method: "POST",
            body: data,
        });
    },
    async update(id: string, data: Partial<BankAccount>) {
        return api<BankAccount>(`/api/bank-accounts/${id}`, {
            method: "PUT",
            body: data,
        });
    },
    async delete(id: string) {
        return api<void>(`/api/bank-accounts/${id}`, {
            method: "DELETE",
        });
    }
};
