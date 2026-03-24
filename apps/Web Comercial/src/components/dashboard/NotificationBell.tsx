"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    ExternalLink,
    Check,
} from "lucide-react";

/* ═══ Types ═══ */
interface Notification {
    id: string;
    type: string;
    title: string;
    description: string;
    read: boolean;
    proposalId?: string;
    createdAt: string;
}

/* ═══ Config ═══ */
const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    approved: { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10" },
    rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
    adjustments: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    sent: { icon: Send, color: "text-blue-400", bg: "bg-blue-500/10" },
    viewed: { icon: Eye, color: "text-purple-400", bg: "bg-purple-500/10" },
    comment: { icon: MessageSquare, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    expired: { icon: Clock, color: "text-red-400", bg: "bg-red-500/10" },
    created: { icon: FileText, color: "text-slate-400", bg: "bg-slate-500/10" },
    client_approved: { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10" },
};

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

/* ═══ Component ═══ */
export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    // ═══ Fetch notifications & unread count ═══
    const fetchData = useCallback(async () => {
        try {
            const [feedRes, countRes] = await Promise.all([
                api<any>("/api/notifications/feed?limit=5"),
                api<any>("/api/notifications/feed/unread-count"),
            ]);
            if (feedRes.success && feedRes.data) {
                setNotifications(feedRes.data.data || []);
            }
            if (countRes.success && countRes.data) {
                setUnreadCount(countRes.data.count || 0);
            }
        } catch (e) {
            // Silently fail — bell is non-critical
        }
    }, []);

    // Initial fetch + polling every 30s
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAllRead = async () => {
        await api("/api/notifications/feed/read-all", { method: "PATCH" });
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const markAsRead = async (id: string) => {
        await api(`/api/notifications/feed/${id}/read`, { method: "PATCH" });
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    return (
        <div className="relative" ref={ref}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-blue-600 text-white text-[9px] font-bold rounded-full min-w-[18px] px-1 shadow-lg shadow-blue-600/50">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-[380px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-[60] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white">Notificações</h3>
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-bold">{unreadCount}</span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                                    <Check size={12} /> Marcar todas
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="text-center py-10 text-slate-600">
                                    <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-[11px]">Nenhuma notificação</p>
                                </div>
                            ) : (
                                notifications.map((n) => {
                                    const config = typeConfig[n.type] || typeConfig.created;
                                    const Icon = config.icon;
                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => markAsRead(n.id)}
                                            className={`flex items-start gap-3 px-5 py-3.5 border-b border-white/[0.03] cursor-pointer hover:bg-white/[0.02] transition-colors ${!n.read ? "bg-white/[0.02]" : ""}`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                                <Icon size={14} className={config.color} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-white">{n.title}</span>
                                                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.description}</p>
                                                <span className="text-[10px] text-slate-600 mt-1 block">{formatRelativeTime(n.createdAt)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/[0.06] px-5 py-3">
                            <Link
                                href="/dashboard/notifications"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Ver todas as notificações <ExternalLink size={11} />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
