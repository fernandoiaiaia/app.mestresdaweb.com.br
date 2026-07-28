import { api } from "@/lib/api";

export type TransactionCategory = {
    id: string;
    name: string;
    typeGroup: string;
    active: boolean;
};

export const categoriesService = {
    async list() {
        return api<TransactionCategory[]>("/api/categories");
    },
    async getById(id: string) {
        return api<TransactionCategory>(`/api/categories/${id}`);
    },
    async create(data: Partial<TransactionCategory>) {
        return api<TransactionCategory>("/api/categories", {
            method: "POST",
            body: data,
        });
    },
    async update(id: string, data: Partial<TransactionCategory>) {
        return api<TransactionCategory>(`/api/categories/${id}`, {
            method: "PUT",
            body: data,
        });
    },
    async delete(id: string) {
        return api<void>(`/api/categories/${id}`, {
            method: "DELETE",
        });
    }
};
