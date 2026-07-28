import { api } from "@/lib/api";

export type CompanyBranch = {
    id: string;
    name: string;
    companyName?: string;
    cnpj?: string;
    stateRegistration?: string;
    municipalRegistration?: string;
    email?: string;
    phone?: string;
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
};

export const companyBranchesService = {
    async list() {
        return api<CompanyBranch[]>("/api/company-branches");
    },
    
    async getById(id: string) {
        return api<CompanyBranch>(`/api/company-branches/${id}`);
    },

    async create(data: Partial<CompanyBranch>) {
        return api<CompanyBranch>("/api/company-branches", {
            method: "POST",
            body: data
        });
    },

    async update(id: string, data: Partial<CompanyBranch>) {
        return api<CompanyBranch>(`/api/company-branches/${id}`, {
            method: "PUT",
            body: data
        });
    },

    async delete(id: string) {
        return api<{ success: boolean }>(`/api/company-branches/${id}`, {
            method: "DELETE"
        });
    }
};
