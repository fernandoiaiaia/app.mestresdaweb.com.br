// ═══════════════════════════════════════
// CHATBOT — Frontend API Service
// ═══════════════════════════════════════

import { api } from "@/lib/api";

// ═══ Types ═══

export interface ChatbotConfig {
    id: string;
    userId: string;
    aiProvider: string;
    aiModel: string;
    botName: string;
    toneOfVoice: string;
    systemPrompt: string | null;
    maxConsecutiveBotMsgs: number;
    maxFollowupsPerDay: number;
    businessHoursStart: string;
    businessHoursEnd: string;
    warmupEnabled: boolean;
    currentDailyLimit: number;
    isActive: boolean;
}

export interface ChatbotFlow {
    id: string;
    chatbotId: string;
    name: string;
    description: string | null;
    isActive: boolean;
    funnelId: string;
    stageId: string;
    funnel: string;
    stage: string;
    objective: string;
    outboundTemplateName: string | null;
    outboundPrompt: string | null;
    inboundPrompt: string | null;
    qualificationFields: QualificationField[];
    handoffOnQualified: boolean;
    handoffOnHumanRequest: boolean;
    handoffAfterMessages: number;
    sessions: number;
    conversions: number;
}

export interface QualificationField {
    id: string;
    label: string;
    type: "string" | "boolean" | "number";
}

export interface ChatbotKnowledgeDoc {
    id: string;
    chatbotId: string;
    name: string;
    type: "text" | "file" | "url";
    content: string | null;
    fileUrl: string | null;
    status: string;
    info: string | null;
    createdAt: string;
}

export interface WhatsappTemplate {
    id: string;
    userId: string;
    name: string;
    category: string;
    body: string;
    language: string;
    status: string;
    metaId: string | null;
    createdAt: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface DashboardStats {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    handedOffSessions: number;
    todaySessions: number;
    avgQualificationScore: number;
    conversionRate: number;
}

// ═══ Config API ═══

export async function getChatbotConfig() {
    return api<ChatbotConfig>("/api/chatbot/config");
}

export async function updateChatbotConfig(data: Partial<ChatbotConfig>) {
    return api<ChatbotConfig>("/api/chatbot/config", {
        method: "PUT",
        body: data,
    });
}

// ═══ Flows API ═══

export async function listChatbotFlows(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    return api<ChatbotFlow[]>(`/api/chatbot/flows?${params}`);
}

export async function getChatbotFlow(id: string) {
    return api<ChatbotFlow>(`/api/chatbot/flows/${id}`);
}

export async function createChatbotFlow(data: {
    name: string;
    funnelId: string;
    stageId: string;
    objective?: string;
    outboundTemplateName?: string;
    outboundPrompt?: string;
    inboundPrompt?: string;
    qualificationFields?: QualificationField[];
    handoffOnQualified?: boolean;
    handoffOnHumanRequest?: boolean;
    handoffAfterMessages?: number;
}) {
    return api<ChatbotFlow>("/api/chatbot/flows", { method: "POST", body: data });
}

export async function updateChatbotFlow(id: string, data: Partial<ChatbotFlow>) {
    return api<ChatbotFlow>(`/api/chatbot/flows/${id}`, { method: "PUT", body: data });
}

export async function deleteChatbotFlow(id: string) {
    return api(`/api/chatbot/flows/${id}`, { method: "DELETE" });
}

export async function toggleChatbotFlow(id: string) {
    return api<ChatbotFlow>(`/api/chatbot/flows/${id}/toggle`, { method: "PATCH" });
}

// ═══ Knowledge API ═══

export async function listChatbotKnowledge(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    return api<ChatbotKnowledgeDoc[]>(`/api/chatbot/knowledge?${params}`);
}

export async function addChatbotKnowledge(data: {
    name: string;
    type: "text" | "file" | "url";
    content?: string;
    fileUrl?: string;
}) {
    return api<ChatbotKnowledgeDoc>("/api/chatbot/knowledge", { method: "POST", body: data });
}

export async function deleteChatbotKnowledge(id: string) {
    return api(`/api/chatbot/knowledge/${id}`, { method: "DELETE" });
}

// ═══ Templates API ═══

export async function listWhatsappTemplates(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    return api<WhatsappTemplate[]>(`/api/chatbot/templates?${params}`);
}

export async function createWhatsappTemplate(data: {
    name: string;
    category: string;
    body: string;
    language?: string;
}) {
    return api<WhatsappTemplate>("/api/chatbot/templates", { method: "POST", body: data });
}

export async function deleteWhatsappTemplate(id: string) {
    return api(`/api/chatbot/templates/${id}`, { method: "DELETE" });
}

export async function syncWhatsappTemplates() {
    return api<{ synced: number }>("/api/chatbot/templates/sync", { method: "POST" });
}

// ═══ Dashboard API ═══

export async function getChatbotDashboard() {
    return api<DashboardStats>("/api/chatbot/dashboard");
}

// ═══ Funnels (for flow forms) ═══

export async function listFunnelsForChatbot() {
    return api<Array<{
        id: string;
        name: string;
        stages: Array<{ id: string; name: string }>;
    }>>("/api/funnels");
}
