"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    Bell,
    CheckCircle2,
    Clock,
    Send,
    MessageSquare,
    Eye,
    AlertTriangle,
    FileText,
    XCircle,
    Check,
    Search,
    Settings,
    Trash2,
    Loader2,
} from "lucide-react";

/* ═══ Types ═══ */
interface Notification {
    id: string;
    type: string;
    title: string;
    description: string;
    read: boolean;
    proposalId?: string;
    dealId?: string;
    createdAt: string;
}

interface FeedResponse {
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/* ═══ Config ═══ */
const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    approved: { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Aprovação" },
    rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Rejeição" },
    adjustments: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Ajustes" },
    sent: { icon: Send, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Envio" },
    viewed: { icon: Eye, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", label: "Visualização" },
    comment: { icon: MessageSquare, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", label: "Comentário" },
    expired: { icon: Clock, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Expiração" },
    created: { icon: FileText, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", label: "Criação" },
    client_approved: { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Aceite Cliente" },
};

const typeOptions = ["all", "approved", "client_approved", "adjustments", "rejected", "sent", "viewed", "comment", "expired", "created"];

/* ═══ Helpers ═══ */
function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "agora";
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHr < 24) return `${diffHr}h atrás`;
    if (diffDay === 1) return "1 dia atrás";
    return `${diffDay} dias atrás`;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ═══ Page ═══ */
export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState("all");
    const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const unreadCount = notifications.filter((n) => !n.read).length;

    // ═══ Fetch notifications ═══
    const fetchNotifications = useCallback(async () => {
        const params = new URLSearchParams();
        if (filterType !== "all") params.set("type", filterType);
        if (filterRead === "unread") params.set("read", "false");
        else if (filterRead === "read") params.set("read", "true");
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        params.set("limit", "100");

        const res = await api<FeedResponse>(`/api/notifications/feed?${params.toString()}`);
        if (res.success && res.data) {
            setNotifications((res.data as any).data || []);
            setTotal((res.data as any).total || 0);
        }
    }, [filterType, filterRead, searchQuery]);

    useEffect(() => {
        setIsLoading(true);
        fetchNotifications().finally(() => setIsLoading(false));
    }, [fetchNotifications]);

    // ═══ Actions ═══
    const markAllRead = async () => {
        await api("/api/notifications/feed/read-all", { method: "PATCH" });
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const markAsRead = async (id: string) => {
        await api(`/api/notifications/feed/${id}/read`, { method: "PATCH" });
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    };

    const deleteNotification = async (id: string) => {
        await api(`/api/notifications/feed/${id}`, { method: "DELETE" });
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    // ═══ Group by date ═══
    const grouped = notifications.reduce((acc, n) => {
        const dateKey = formatDate(n.createdAt);
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(n);
        return acc;
    }, {} as Record<string, Notification[]>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Bell size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Notificações</h1>
                            <p className="text-sm text-slate-400">
                                {unreadCount > 0 ? `${unreadCount} não lida(s)` : "Todas lidas"} · {notifications.length} total
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 transition-all">
                                <Check size={14} /> Marcar todas como lidas
                            </button>
                        )}
                        <Link href="/dashboard/settings/notifications" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                            <Settings size={18} />
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Search + Filters */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 space-y-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar notificações..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {typeOptions.map((type) => {
                        const config = type === "all" ? null : typeConfig[type];
                        const isActive = filterType === type;
                        return (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${isActive ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/5"}`}
                            >
                                {type === "all" ? "Todas" : config?.label || type}
                            </button>
                        );
                    })}
                    <div className="ml-auto flex gap-2">
                        {(["all", "unread", "read"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setFilterRead(r)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${filterRead === r ? "bg-white/5 border-white/10 text-white" : "border-transparent text-slate-600 hover:text-slate-400"}`}
                            >
                                {r === "all" ? "Todas" : r === "unread" ? "Não lidas" : "Lidas"}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Notifications grouped by date */}
            <div className="space-y-6">
                {Object.keys(grouped).length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-slate-600">
                        <Bell size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Nenhuma notificação encontrada</p>
                    </motion.div>
                ) : (
                    Object.entries(grouped).map(([date, items], gi) => (
                        <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.05 }}>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3 px-1">{date}</h3>
                            <div className="space-y-2">
                                {items.map((n) => {
                                    const config = typeConfig[n.type] || typeConfig.created;
                                    const Icon = config.icon;
                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => markAsRead(n.id)}
                                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group ${!n.read ? "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]" : "bg-transparent border-white/[0.04] hover:bg-white/[0.02]"}`}
                                        >
                                            <div className={`w-9 h-9 rounded-xl ${config.bg} border flex items-center justify-center shrink-0`}>
                                                <Icon size={16} className={config.color} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-sm font-semibold ${!n.read ? "text-white" : "text-slate-300"}`}>{n.title}</span>
                                                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                                </div>
                                                <p className="text-[12px] text-slate-500 leading-relaxed">{n.description}</p>
                                                <span className="text-[10px] text-slate-600 mt-1.5 block">{formatRelativeTime(n.createdAt)}</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
