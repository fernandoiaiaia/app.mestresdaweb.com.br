// ═══════════════════════════════════════
// ProposalAI — Proposal Types
// ═══════════════════════════════════════

export type ProposalStatus =
    | "DRAFT"
    | "SENT"
    | "APPROVED"
    | "REJECTED"
    | "EXPIRED";

export interface ProposalItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface ProposalClient {
    id: string;
    name: string;
    email?: string;
    company?: string;
}

export interface ProposalTimeline {
    id: string;
    status: ProposalStatus;
    note?: string;
    createdAt: string;
    createdBy?: string;
}

export interface EstimateLine {
    role: string;
    hours: number;
    rate: number;
}

export interface EstimateResult {
    lines: EstimateLine[];
    totalHours: number;
    totalCost: number;
}

export interface GapItem {
    category: string;
    title: string;
    description: string;
    priority: "alta" | "média" | "baixa";
}

export interface GapAnalysisResult {
    gaps: GapItem[];
    summary: string;
    completenessScore: number;
}

export interface Proposal {
    id: string;
    title: string;
    status: ProposalStatus;
    client?: ProposalClient;
    clientId?: string;
    scopeRaw: string;
    estimate?: EstimateResult;
    gapAnalysis?: GapAnalysisResult;
    discount?: number;
    terms?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt?: string;
    userId: string;
    viewerId?: string | null;
    viewer?: { email: string } | null;
    timeline?: ProposalTimeline[];
}

export interface CreateProposalPayload {
    title: string;
    clientId?: string;
    opportunityId?: string;
    items: Omit<ProposalItem, "id" | "total">[];
    discount?: number;
    terms?: string;
    expiresAt?: string;
    status?: "DRAFT" | "SENT";
}

export interface UpdateProposalPayload {
    title?: string;
    clientId?: string;
    opportunityId?: string;
    items?: Omit<ProposalItem, "id" | "total">[];
    discount?: number;
    terms?: string;
    expiresAt?: string;
    status?: ProposalStatus;
}

// ─── Status display helpers ───────────────────

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
    DRAFT: "Rascunho",
    SENT: "Enviada",
    APPROVED: "Aprovada",
    REJECTED: "Rejeitada",
    EXPIRED: "Expirada",
};

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
    DRAFT: "bg-slate-700/60 text-slate-300 border-slate-600/40",
    SENT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    EXPIRED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};
