import { api } from "./api";

export interface ClientProposal {
    id: string;
    clientName: string;
    contactName: string | null;
    projectType: string[];
    status: string;
    totalValue: number | null;
    totalHours: number | null;
    hiringModel: string | null;
    paymentMethod: string | null;
    installments: number | null;
    discount: number | null;
    sentAt: string | null;
    validUntil: string | null;
    createdAt: string;
    scope: any;
    estimates: any;
    commercial: any;
    inputText: string | null;
}

// Mocks removed deliberately

export async function fetchMyProposals() {
    const res = await api<ClientProposal[]>("/api/proposals/client/mine");
    return res;
}

export async function fetchProposal(id: string) {
    return api<ClientProposal>(`/api/proposals/client/${id}`);
}
