import { api } from "@/lib/api";

export type PaymentMethod = {
    id: string;
    name: string;
    active: boolean;
};

export const paymentMethodsService = {
    async list() {
        return api<PaymentMethod[]>("/api/payment-methods");
    },
    async getById(id: string) {
        return api<PaymentMethod>(`/api/payment-methods/${id}`);
    },
    async create(data: Partial<PaymentMethod>) {
        return api<PaymentMethod>("/api/payment-methods", {
            method: "POST",
            body: data,
        });
    },
    async update(id: string, data: Partial<PaymentMethod>) {
        return api<PaymentMethod>(`/api/payment-methods/${id}`, {
            method: "PUT",
            body: data,
        });
    },
    async delete(id: string) {
        return api<void>(`/api/payment-methods/${id}`, {
            method: "DELETE",
        });
    }
};
