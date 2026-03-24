"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell, CheckCircle2, Info, Package, FileText, Loader2,
    Trash2, CheckCheck, Search, Filter, X, Clock,
    AlertTriangle, Zap, Users, Target, BellOff, RefreshCw,
} from "lucide-react";
import {
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
    type Notification,
} from "@/lib/notifications-api";

/* ════════════════════════════════ */
/* TYPE → ICON / COLOR CONFIG      */
/* ════════════════════════════════ */
const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
    task_assigned:     { icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", label: "Tarefa" },
    comment_mention:   { icon: Info, color: "text-violet-400", bg: "bg-violet-500/10", label: "Comentário" },
    task_blocked:      { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Bloqueio" },
    sprint_completed:  { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10", label: "Sprint" },
    delivery_approved: { icon: Package, color: "text-blue-400", bg: "bg-blue-500/10", label: "Entrega" },
    delivery_revision: { icon: RefreshCw, color: "text-amber-400", bg: "bg-amber-500/10", label: "Revisão" },
    ai_alert:          { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "IA" },
    report_pending:    { icon: FileText, color: "text-orange-400", bg: "bg-orange-500/10", label: "Relatório" },
    deadline_risk:     { icon: Clock, color: "text-red-400", bg: "bg-red-500/10", label: "Deadline" },
    acceptance_signed: { icon: Target, color: "text-teal-400", bg: "bg-teal-500/10", label: "Aceite" },
    delivery:          { icon: Package, color: "text-blue-400", bg: "bg-blue-500/10", label: "Entrega" },
    document:          { icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10", label: "Documento" },
    task:              { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10", label: "Tarefa" },
    info:              { icon: Info, color: "text-slate-400", bg: "bg-slate-500/10", label: "Info" },
};
const defaultConfig = { icon: Bell, color: "text-slate-400", bg: "bg-slate-500/10", label: "Outro" };

const TYPE_FILTERS = [
    { value: "all", label: "Todas" },
    { value: "task_assigned", label: "Tarefas" },
    { value: "comment_mention", label: "Comentários" },
    { value: "delivery_approved", label: "Entregas" },
    { value: "deadline_risk", label: "Deadlines" },
    { value: "ai_alert", label: "IA" },
];

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Agora";
    if (mins < 60) return `Há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Há ${days}d`;
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/* ════════════════════════════════ */
/* COMPONENT                        */
/* ════════════════════════════════ */
export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
    const [showFilters, setShowFilters] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetchNotifications({
            type: typeFilter !== "all" ? typeFilter : undefined,
            read: readFilter === "unread" ? "false" : readFilter === "read" ? "true" : undefined,
            search: search || undefined,
            limit: 100,
        });
        if (res.success && res.data) setNotifications(res.data);
        setLoading(false);
    }, [typeFilter, readFilter, search]);

    useEffect(() => { load(); }, [load]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = async (notif: Notification) => {
        if (notif.read) return;
        await markNotificationAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        await deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        setDeletingId(null);
    };

    const handleClearAll = async () => {
        if (!confirm("Tem certeza que deseja apagar todas as notificações?")) return;
        await deleteAllNotifications();
        setNotifications([]);
    };

    const handleClick = async (notif: Notification) => {
        await handleMarkAsRead(notif);
        if (notif.link) router.push(notif.link);
    };

    return (
        <div className="p-6 md:p-8 space-y-5">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Notificações
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-400 mt-1">Fique por dentro de todas as atualizações.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-blue-400 border border-white/[0.06] rounded-xl hover:bg-blue-500/5 hover:border-blue-500/20 transition-all">
                                <CheckCheck size={14} /> Marcar todas como lidas
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button onClick={handleClearAll}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-400 border border-white/[0.06] rounded-xl hover:bg-red-500/5 hover:border-red-500/20 transition-all">
                                <Trash2 size={14} /> Limpar
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Search + Filters */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="flex items-center gap-3 flex-wrap">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar notificações..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-800/40 border border-white/[0.06] rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 transition-colors"
                    />
                </div>
                {/* Read filter */}
                <div className="flex items-center bg-slate-800/40 border border-white/[0.06] rounded-xl overflow-hidden">
                    {(["all", "unread", "read"] as const).map(v => (
                        <button key={v} onClick={() => setReadFilter(v)}
                            className={`px-3 py-2 text-[11px] font-bold transition-colors ${readFilter === v ? "bg-blue-500/10 text-blue-400" : "text-slate-500 hover:text-slate-300"}`}>
                            {v === "all" ? "Todas" : v === "unread" ? "Não lidas" : "Lidas"}
                        </button>
                    ))}
                </div>
                {/* Type filter toggle */}
                <button onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-xl border transition-colors
                        ${showFilters ? "border-blue-500/20 bg-blue-500/10 text-blue-400" : "border-white/[0.06] text-slate-500 hover:text-slate-300"}`}>
                    <Filter size={12} /> Tipo
                </button>
            </motion.div>

            {/* Type filter pills */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 flex-wrap overflow-hidden">
                        {TYPE_FILTERS.map(f => (
                            <button key={f.value} onClick={() => setTypeFilter(f.value)}
                                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all
                                    ${typeFilter === f.value
                                        ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                                        : "border-white/[0.04] bg-slate-800/30 text-slate-500 hover:text-white hover:border-white/[0.08]"
                                    }`}>
                                {f.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="text-blue-400 animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && notifications.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 bg-slate-800/20 border border-white/[0.04] rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/[0.06] flex items-center justify-center mb-4">
                        <BellOff size={28} className="text-slate-600" />
                    </div>
                    <p className="text-lg font-bold text-slate-400">Nenhuma notificação</p>
                    <p className="text-sm text-slate-500 mt-1">
                        {search ? "Nenhum resultado para a busca." : "Você está em dia! Nenhuma notificação por aqui."}
                    </p>
                    {search && (
                        <button onClick={() => setSearch("")} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                            <X size={12} /> Limpar busca
                        </button>
                    )}
                </motion.div>
            )}

            {/* Notification List */}
            {!loading && (
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {notifications.map((notif, i) => {
                            const tc = typeConfig[notif.type] || defaultConfig;
                            const Icon = tc.icon;
                            const isDeleting = deletingId === notif.id;

                            return (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }}
                                    exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                                    transition={{ delay: i < 20 ? i * 0.02 : 0 }}
                                    onClick={() => handleClick(notif)}
                                    className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${notif.read
                                        ? "bg-slate-800/20 border-white/[0.03] hover:border-white/[0.06]"
                                        : "bg-slate-800/50 border-white/[0.08] hover:border-blue-500/20"
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-9 h-9 rounded-xl ${tc.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                        <Icon size={16} className={tc.color} />
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-sm font-semibold truncate ${notif.read ? "text-slate-300" : "text-white"}`}>
                                                {notif.title}
                                            </h3>
                                            {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                            <span className={`hidden sm:inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded-full ${tc.bg} ${tc.color}`}>
                                                {tc.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{notif.description}</p>
                                        <p className="text-[10px] text-slate-600 mt-1 font-medium">{timeAgo(notif.createdAt)}</p>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        {!notif.read && (
                                            <button
                                                onClick={e => { e.stopPropagation(); handleMarkAsRead(notif); }}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                                title="Marcar como lida"
                                            >
                                                <CheckCircle2 size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDelete(notif.id); }}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
