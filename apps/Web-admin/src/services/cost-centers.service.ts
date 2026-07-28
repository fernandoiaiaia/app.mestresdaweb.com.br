import { api } from "@/lib/api";

export type CostCenter = {
    id: string;
    name: string;
    code: string | null;
    active: boolean;
    budget: number;
    notes: string | null;
};

export const costCentersService = {
    async list() {
        return api<CostCenter[]>("/api/cost-centers");
    },
    async getById(id: string) {
        return api<CostCenter>(`/api/cost-centers/${id}`);
    },
    async create(data: Partial<CostCenter>) {
        return api<CostCenter>("/api/cost-centers", {
            method: "POST",
            body: data,
        });
    },
    async update(id: string, data: Partial<CostCenter>) {
        return api<CostCenter>(`/api/cost-centers/${id}`, {
            method: "PUT",
            body: data,
        });
    },
    async delete(id: string) {
        return api<void>(`/api/cost-centers/${id}`, {
            method: "DELETE",
        });
    }
};
