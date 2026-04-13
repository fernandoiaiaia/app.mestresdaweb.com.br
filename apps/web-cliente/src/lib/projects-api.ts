// ═══════════════════════════════════════
// ProposalAI — Projects API (Web Cliente)
// ═══════════════════════════════════════

import { api } from "./api";

// ── Types ──

export interface DevProject {
    id: string;
    name: string;
    client: string;
    phase: "requirements" | "discovery" | "development" | "testing" | "documentation" | "delivery";
    health: "on_track" | "at_risk" | "delayed";
    progress: number;
    archived: boolean;
    startDate: string | null;
    deadline: string | null;
    hoursEstimated: number;
    hoursUsed: number;
    proposalId: string | null;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    tasksTotal: number;
    tasksDone: number;
    createdBy?: { id: string; name: string };
}

export interface DevTaskAssignee {
    id: string;
    name: string;
    avatar: string | null;
    position: string | null;
}

export interface DevTask {
    id: string;
    title: string;
    description: string | null;
    status: "todo" | "in_progress" | "review" | "done";
    priority: "low" | "medium" | "high" | "critical";
    epic: string | null;
    story: string | null;
    tags: string[];
    blocked: boolean;
    estimatedHours: number;
    loggedHours: number;
    deadline: string | null;
    projectId: string;
    assigneeId: string | null;
    sprintId: string | null;
    createdAt: string;
    updatedAt: string;
    assignee: DevTaskAssignee | null;
    project?: { id: string; name: string; client: string };
}

export interface DevMember {
    id: string;
    projectId: string;
    userId: string;
    role: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar: string | null;
        role: string;
        position: string | null;
    };
}

export interface DevSprint {
    id: string;
    projectId: string;
    name: string;
    goal: string | null;
    startDate: string | null;
    endDate: string | null;
    status: "planned" | "active" | "completed";
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    tasks?: DevTask[];
}

export interface DevProjectDetail extends Omit<DevProject, "tasksTotal" | "tasksDone"> {
    tasks: DevTask[];
    members: DevMember[];
    contacts: { id: string; name: string; email: string | null; phone: string | null }[];
    signatories: { id: string; role: string; source: string; sourceId: string; name: string }[];
    proposal: { id: string; clientName: string; projectType: string[]; scope: unknown } | null;
    sprints?: DevSprint[];
    documents?: { id: string; docType: string; title: string; status: string; createdAt: string }[];
}

// ── API Functions ──

export async function fetchProjects(query?: {
    search?: string;
    health?: string;
    phase?: string;
    archived?: string;
}) {
    const params = new URLSearchParams();
    if (query?.search) params.set("search", query.search);
    if (query?.health) params.set("health", query.health);
    if (query?.phase) params.set("phase", query.phase);
    if (query?.archived) params.set("archived", query.archived);
    const qs = params.toString();
    return api<DevProject[]>(`/api/dev-projects${qs ? `?${qs}` : ""}`);
}

export async function fetchProject(id: string) {
    return api<DevProjectDetail>(`/api/dev-projects/${id}`);
}

export async function fetchProjectTasks(projectId: string, query?: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    search?: string;
}) {
    const params = new URLSearchParams();
    if (query?.status) params.set("status", query.status);
    if (query?.priority) params.set("priority", query.priority);
    if (query?.assigneeId) params.set("assigneeId", query.assigneeId);
    if (query?.search) params.set("search", query.search);
    const qs = params.toString();
    return api<DevTask[]>(`/api/dev-projects/${projectId}/tasks${qs ? `?${qs}` : ""}`);
}

export async function fetchAllTasks(query?: {
    status?: string;
    priority?: string;
    projectId?: string;
    assigneeId?: string;
    search?: string;
}) {
    const params = new URLSearchParams();
    if (query?.status) params.set("status", query.status);
    if (query?.priority) params.set("priority", query.priority);
    if (query?.projectId) params.set("projectId", query.projectId);
    if (query?.assigneeId) params.set("assigneeId", query.assigneeId);
    if (query?.search) params.set("search", query.search);
    const qs = params.toString();
    return api<DevTask[]>(`/api/dev-projects/tasks/all${qs ? `?${qs}` : ""}`);
}

export async function fetchProjectMembers(projectId: string) {
    return api<DevMember[]>(`/api/dev-projects/${projectId}/members`);
}

export async function fetchProjectSprints(projectId: string) {
    return api<DevSprint[]>(`/api/dev-projects/${projectId}/sprints`);
}

export interface DevSprintFull extends DevSprint {
    project?: { id: string; name: string; client: string };
}

export async function fetchAllSprints() {
    return api<DevSprintFull[]>(`/api/dev-projects/sprints/all`);
}

export async function fetchProjectStats() {
    return api<{
        activeProjects: number;
        totalTasks: number;
        tasksInProgress: number;
        tasksDone: number;
        tasksTodo: number;
        tasksBlocked: number;
        totalDeliveries: number;
        pendingDocuments: number;
    }>(`/api/dev-projects/stats`);
}

// ── Helper: Phase → Status Label ──

export function phaseToStatusLabel(phase: string): string {
    const map: Record<string, string> = {
        requirements: "Planejamento",
        discovery: "Planejamento",
        development: "Em Andamento",
        testing: "Em Andamento",
        documentation: "Em Andamento",
        delivery: "Concluído",
    };
    return map[phase] || "Em Andamento";
}

// ── Helper: Priority label ──
export function priorityLabel(p: string): string {
    const map: Record<string, string> = {
        low: "Baixa",
        medium: "Média",
        high: "Alta",
        critical: "Crítica",
    };
    return map[p] || p;
}

// ── Helper: Status label ──
export function taskStatusLabel(s: string): string {
    const map: Record<string, string> = {
        todo: "A Fazer",
        in_progress: "Em Progresso",
        review: "Em Revisão",
        done: "Concluído",
    };
    return map[s] || s;
}

// ── Helper: Format date ──
export function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
        return "—";
    }
}

// ── Helper: Format short date ──
export function formatShortDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    } catch {
        return "—";
    }
}

// ── Document Types ──

export interface DevProjectDocument {
    id: string;
    projectId: string;
    docType: string;
    title: string;
    fileName: string;
    storedName: string;
    fileSize: number;
    mimeType: string;
    status: "draft" | "sent" | "signed";
    notes: string | null;
    uploadedById: string;
    createdAt: string;
    updatedAt: string;
    uploadedBy?: { id: string; name: string };
    project?: { id: string; name: string; client?: string };
    signatures?: { id: string; name: string; role: string; status: string; signedAt: string | null }[];
}

// ── Document API Functions ──

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";

export async function fetchDocuments(docType?: string) {
    const params = new URLSearchParams();
    if (docType) params.set("docType", docType);
    const qs = params.toString();
    return api<DevProjectDocument[]>(`/api/dev-projects/documents/all${qs ? `?${qs}` : ""}`);
}

export async function fetchDocument(id: string) {
    return api<DevProjectDocument>(`/api/dev-projects/documents/${id}`);
}

export async function deleteDocument(id: string) {
    return api<DevProjectDocument>(`/api/dev-projects/documents/${id}`, { method: "DELETE" });
}

export function downloadDocumentUrl(docId: string): string {
    return `${API_BASE}/api/dev-projects/documents/${docId}/download`;
}

// ── Helper: Document status label ──
export function docStatusLabel(s: string): string {
    const map: Record<string, string> = {
        draft: "Em Análise",
        sent: "Aguardando Assinatura",
        signed: "Assinado",
    };
    return map[s] || s;
}

// ── Helper: File size formatter ──
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

