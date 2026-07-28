import { api } from "@/lib/api";

export type Contract = {
    id: string;
    number: string;
    contractorName: string;
    contractorDocument: string;
    contractedName: string | null;
    contractedDocument: string | null;
    objectDescription: string;
    value: number;
    paymentMethod: string;
    status: 'draft' | 'review' | 'sent' | 'signing' | 'signed' | 'cancelled' | 'archived';
    signingDeadline: string;
    firstDueDate: string;
    templateId: string | null;
    emailTemplate: string | null;
    dealId: string | null;
};

export type ContractsResponse = {
    success: boolean;
    data: Contract[];
    pagination?: {
        total: number;
        pages: number;
        current: number;
    };
};

export type ContractStats = {
    total: number;
    signing: number;
    signedThisMonth: number;
    totalValue: number;
};

export const contractsService = {
    async list(params: { page?: number; limit?: number; search?: string }) {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        
        return api<ContractsResponse>(`/api/contracts?${queryParams.toString()}`);
    },

    async stats() {
        return api<ContractStats>("/api/contracts/stats");
    }
};
