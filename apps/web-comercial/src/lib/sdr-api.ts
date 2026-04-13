"use client";

import { api } from "./api";
import type {
    Playbook, Persona, Identity, Cadence,
    SDRLead, Conversation, QualificationCriteria, QualificationThreshold,
} from "@/store/sdr-store";

// ═══════════════════════════════════════
// SDR API Service — Connects to /api/sdr/*
// ═══════════════════════════════════════

const BASE = "/api/sdr";

// ═══ CADENCES ═══
export const cadencesApi = {
    list: () => api<any[]>(`${BASE}/cadences`),
    get: (id: string) => api<any>(`${BASE}/cadences/${id}`),
    create: (data: any) => api<any>(`${BASE}/cadences`, { method: "POST", body: data }),
    update: (id: string, data: any) => api<any>(`${BASE}/cadences/${id}`, { method: "PUT", body: data }),
    delete: (id: string) => api<void>(`${BASE}/cadences/${id}`, { method: "DELETE" }),
    updateStatus: (id: string, status: string) => api<any>(`${BASE}/cadences/${id}/status`, { method: "PATCH", body: { status } }),

    // Steps
    addStep: (cadenceId: string, data: any) => api<any>(`${BASE}/cadences/${cadenceId}/steps`, { method: "POST", body: data }),
    updateStep: (cadenceId: string, stepId: string, data: any) => api<any>(`${BASE}/cadences/${cadenceId}/steps/${stepId}`, { method: "PUT", body: data }),
    deleteStep: (cadenceId: string, stepId: string) => api<void>(`${BASE}/cadences/${cadenceId}/steps/${stepId}`, { method: "DELETE" }),
    reorderSteps: (cadenceId: string, stepIds: string[]) => api<void>(`${BASE}/cadences/${cadenceId}/steps/reorder`, { method: "PUT", body: { stepIds } }),
};

// ═══ LEADS ═══
export const leadsApi = {
    listAvailable: (query?: any) => {
        const params = query ? `?${new URLSearchParams(query).toString()}` : "";
        return api<SDRLead[]>(`${BASE}/leads/available${params}`);
    },
    activate: (leadIds: string[], cadenceId: string, consultantId?: string) =>
        api<any>(`${BASE}/leads/activate`, { method: "POST", body: { leadIds, cadenceId, consultantId } }),
    import: (leads: any[], cadenceId?: string) =>
        api<any>(`${BASE}/leads/import`, { method: "POST", body: { leads, cadenceId } }),
    pause: (id: string) => api<void>(`${BASE}/leads/${id}/pause`, { method: "POST" }),
    resume: (id: string) => api<void>(`${BASE}/leads/${id}/resume`, { method: "POST" }),
    remove: (id: string) => api<void>(`${BASE}/leads/${id}/remove`, { method: "POST" }),
    takeover: (id: string) => api<any>(`${BASE}/leads/${id}/takeover`, { method: "POST" }),
    timeline: (id: string) => api<any[]>(`${BASE}/leads/${id}/timeline`),
    qualification: (id: string) => api<any>(`${BASE}/leads/${id}/qualification`),
    recalculateScore: (id: string) => api<any>(`${BASE}/leads/${id}/recalculate-score`, { method: "POST" }),
    overrideTemperature: (id: string, temperature: string) =>
        api<any>(`${BASE}/leads/${id}/override-temperature`, { method: "POST", body: { temperature } }),
};

// ═══ MONITOR ═══
export const monitorApi = {
    stats: () => api<any>(`${BASE}/monitor/stats`),
    leads: (query?: any) => {
        const params = query ? `?${new URLSearchParams(query).toString()}` : "";
        return api<any>(`${BASE}/monitor/leads${params}`);
    },
    feed: () => api<any[]>(`${BASE}/monitor/feed`),
    interventions: () => api<any[]>(`${BASE}/monitor/interventions`),
};

// ═══ QUALIFICATION ═══
export const qualificationApi = {
    listCriteria: () => api<QualificationCriteria[]>(`${BASE}/qualification/criteria`),
    createCriteria: (data: any) => api<QualificationCriteria>(`${BASE}/qualification/criteria`, { method: "POST", body: data }),
    updateCriteria: (id: string, data: any) => api<QualificationCriteria>(`${BASE}/qualification/criteria/${id}`, { method: "PUT", body: data }),
    deleteCriteria: (id: string) => api<void>(`${BASE}/qualification/criteria/${id}`, { method: "DELETE" }),
    reorderCriteria: (criteriaIds: string[]) => api<void>(`${BASE}/qualification/criteria/reorder`, { method: "PUT", body: { criteriaIds } }),
    getThresholds: () => api<QualificationThreshold>(`${BASE}/qualification/thresholds`),
    updateThresholds: (data: QualificationThreshold) => api<QualificationThreshold>(`${BASE}/qualification/thresholds`, { method: "PUT", body: data }),
};

// ═══ SCHEDULING ═══
export const schedulingApi = {
    listMeetings: (query?: any) => {
        const params = query ? `?${new URLSearchParams(query).toString()}` : "";
        return api<any[]>(`${BASE}/scheduling/meetings${params}`);
    },
    createMeeting: (data: any) => api<any>(`${BASE}/scheduling/meetings`, { method: "POST", body: data }),
    updateMeeting: (id: string, data: any) => api<any>(`${BASE}/scheduling/meetings/${id}`, { method: "PUT", body: data }),
};
