"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, CheckCheck, ExternalLink, Trash2, X } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
    task_assigned: "Tarefa Atribuída", comment_mention: "Menção", task_blocked: "Tarefa Bloqueada",
    sprint_completed: "Sprint Concluído", delivery_approved: "Entrega Aprovada", delivery_revision: "Ajuste Solicitado",
    ai_alert: "Alerta IA", report_pending: "Relatório Pendente", deadline_risk: "Risco de Prazo", acceptance_signed: "Aceite Assinado",
    approved: "Aprovado", rejected: "Rejeitado", adjustments: "Ajustes", sent: "Enviado", viewed: "Visualizado",
    comment: "Comentário", expired: "Expirado", created: "Criado", client_approved: "Aprovação Cliente",
};

interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    description: string;
    read: boolean;
    link: string | null;
    proposalId: string | null;
    dealId: string | null;
    metadata: any;
    createdAt: string;
}

export default function NotificationsPage() {
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (search) params.set("search", search);
        params.set("page", String(page));
        params.set("limit", "30");

        const res = await api<any>(`/api/notifications/feed?${params.toString()}`);
        if (res.success) {
            setNotifications(res.data || []);
            setTotalPages((res as any).totalPages || 1);
        }
        setLoading(false);
    }, [typeFilter, search, page]);

    const fetchUnreadCount = useCallback(async () => {
        const res = await api<any>(`/api/notifications/feed/unread-count`);
        if (res.success && res.data) setUnreadCount(res.data.count || 0);
    }, []);

    useEffect(() => { fetchNotifications(); fetchUnreadCount(); }, [fetchNotifications, fetchUnreadCount]);

    const handleMarkAllAsRead = async () => {
        await api("/api/notifications/feed/read-all", { method: "PATCH" });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleMarkAsRead = async (id: string) => {
        await api(`/api/notifications/feed/${id}/read`, { method: "PATCH" });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleDelete = async (id: string) => {
        const wasUnread = notifications.find(n => n.id === id && !n.read);
        await api(`/api/notifications/feed/${id}`, { method: "DELETE" });
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleDeleteAll = async () => {
        await api("/api/notifications/feed/clear", { method: "DELETE" });
        setNotifications([]);
        setUnreadCount(0);
    };

    const uniqueTypes = [...new Set(notifications.map(n => n.type))];

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        Notificações
                        {unreadCount > 0 && <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">{unreadCount} não lidas</span>}
                    </h1>
                    <p className="text-slate-400 mt-1">Histórico completo de notificações e alertas do sistema.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleMarkAllAsRead} disabled={unreadCount === 0}
                        className="px-4 py-2.5 bg-slate-800/60 border border-white/[0.06] rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                        <CheckCheck size={16} /> Marcar todas como lidas
                    </button>
                    <button onClick={handleDeleteAll} disabled={notifications.length === 0}
                        className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                        <Trash2 size={16} /> Limpar Tudo
                    </button>
                </div>
            </motion.div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar notificação..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50" />
                </div>
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-slate-300 focus:outline-none">
                    <option value="all">Todos os tipos</option>
                    {uniqueTypes.map(type => <option key={type} value={type}>{TYPE_LABELS[type] || type}</option>)}
                </select>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin" />
                </div>
            )}

            {!loading && (
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {notifications.map((n, i) => {
                            const content = (
                                <motion.div key={n.id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40, height: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all group ${
                                        !n.read ? 'bg-blue-600/5 border-blue-600/20 hover:bg-blue-600/10' : 'bg-slate-800/30 border-white/[0.06] hover:bg-slate-800/60'
                                    }`}>
                                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${!n.read ? 'bg-green-500' : 'bg-slate-700'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className={`text-sm font-semibold ${!n.read ? 'text-white' : 'text-slate-300'}`}>{n.title}</h3>
                                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-700/50 rounded text-slate-500">{TYPE_LABELS[n.type] || n.type}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">{n.description}</p>
                                        <p className="text-[10px] text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {!n.read && (
                                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMarkAsRead(n.id); }}
                                                title="Marcar como lida"
                                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                                <CheckCheck size={14} />
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(n.id); }}
                                            title="Remover notificação"
                                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                            <X size={14} />
                                        </button>
                                        {n.link && <ExternalLink size={14} className="text-slate-600 mt-0.5" />}
                                    </div>
                                </motion.div>
                            );

                            if (n.link) {
                                return (
                                    <Link key={n.id} href={n.link} onClick={() => { if (!n.read) handleMarkAsRead(n.id); }}>
                                        {content}
                                    </Link>
                                );
                            }
                            return content;
                        })}
                    </AnimatePresence>
                </div>
            )}

            {!loading && notifications.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    <Bell size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">Nenhuma notificação encontrada</p>
                    <p className="text-xs text-slate-600 mt-1">Novas notificações aparecerão aqui automaticamente.</p>
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                        className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-800/40 border border-white/[0.06] rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        ← Anterior
                    </button>
                    <span className="text-xs text-slate-500">Página {page} de {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                        className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-800/40 border border-white/[0.06] rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        Próxima →
                    </button>
                </div>
            )}
        </div>
    );
}
