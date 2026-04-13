import { api } from "./api";

export interface ClientProposal {
    id: string;
    clientName?: string;
    contactName?: string | null;
    projectType?: string[];
    title?: string; // For Assembler proposals
    status: string;
    totalValue?: number | null;
    totalHours?: number | null;
    sentAt: string | null;
    validUntil?: string | null;
    createdAt: string;
    scope?: any;
    scopeData?: any; // For Assembler proposals
    isAssembler?: boolean;
    user?: {
        name: string;
        avatar: string | null;
        professionals: { role: string; seniority: string; hourlyRate: number }[];
        paymentConditions: { id: string; name: string; installments: number; discount: number; active: boolean }[];
    };
}

// Mocks removed deliberately

export async function fetchMyProposals() {
    const res = await api<ClientProposal[]>("/api/proposals/client/mine");
    return res;
}

export async function fetchProposal(id: string) {
    return api<ClientProposal>(`/api/proposals/client/${id}`);
}

export async function fetchAssembledProposal(id: string) {
    return api<ClientProposal>(`/api/proposals/client/a/${id}`);
}

// ── Screen Feedback ──

export interface ScreenFeedback {
    id: string;
    screenId: string;
    screenTitle: string;
    moduleName: string;
    text: string;
    author: string;
    date: string;
    read: boolean;
}

export async function fetchScreenFeedback(proposalId: string) {
    return api<ScreenFeedback[]>(`/api/proposals/client/a/${proposalId}/feedback`);
}

export async function postScreenFeedback(proposalId: string, data: {
    screenId: string;
    screenTitle: string;
    moduleName: string;
    text: string;
}) {
    return api<ScreenFeedback>(`/api/proposals/client/a/${proposalId}/feedback`, {
        method: "POST",
        body: data,
    });
}
