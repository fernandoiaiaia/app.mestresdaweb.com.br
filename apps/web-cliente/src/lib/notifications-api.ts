// ═══════════════════════════════════════
// ProposalAI — Notifications API (Web Cliente)
// ═══════════════════════════════════════

import { api } from "./api";

// ── Types ──

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    description: string;
    read: boolean;
    link: string | null;
    proposalId: string | null;
    dealId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

export interface NotificationFeedResponse {
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ── Feed API ──

export async function fetchNotifications(query?: {
    type?: string;
    read?: string;
    search?: string;
    page?: number;
    limit?: number;
}) {
    const params = new URLSearchParams();
    if (query?.type && query.type !== "all") params.set("type", query.type);
    if (query?.read) params.set("read", query.read);
    if (query?.search) params.set("search", query.search);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();

    return api<NotificationFeedResponse>(`/api/notifications/feed${qs ? `?${qs}` : ""}`) as Promise<{
        success: boolean;
        data?: Notification[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
    }>;
}

export async function fetchUnreadCount() {
    return api<{ count: number }>("/api/notifications/feed/unread-count");
}

export async function markNotificationAsRead(id: string) {
    return api(`/api/notifications/feed/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsAsRead() {
    return api("/api/notifications/feed/read-all", { method: "PATCH" });
}

export async function deleteNotification(id: string) {
    return api(`/api/notifications/feed/${id}`, { method: "DELETE" });
}

export async function deleteAllNotifications() {
    return api("/api/notifications/feed/clear", { method: "DELETE" });
}
