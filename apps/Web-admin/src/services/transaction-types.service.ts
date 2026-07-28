import { api } from "@/lib/api";

export type TransactionType = {
    id: string;
    name: string;
    nature: string;
    active: boolean;
};

export const transactionTypesService = {
    async list() {
        return api<TransactionType[]>("/api/transaction-types");
    },
    async getById(id: string) {
        return api<TransactionType>(`/api/transaction-types/${id}`);
    },
    async create(data: Partial<TransactionType>) {
        return api<TransactionType>("/api/transaction-types", {
            method: "POST",
            body: data,
        });
    },
    async update(id: string, data: Partial<TransactionType>) {
        return api<TransactionType>(`/api/transaction-types/${id}`, {
            method: "PUT",
            body: data,
        });
    },
    async delete(id: string) {
        return api<void>(`/api/transaction-types/${id}`, {
            method: "DELETE",
        });
    }
};
