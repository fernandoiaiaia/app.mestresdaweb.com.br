"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { MessageSquare, Clock, User, ExternalLink } from "lucide-react";
import Link from "next/link";

export function SessionsTab() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ total: 0, completed: 0, transferred: 0, active: 0, avgMessages: 0, completionRate: 0 });
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [sessionsRes, statsRes] = await Promise.all([
                api<any[]>("/api/chatbot/sessions"),
                api<any>("/api/chatbot/sessions/stats")
            ]);
            if (sessionsRes.data) setSessions(sessionsRes.data);
            if (statsRes.data) setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Setup polling for real-time monitoring
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-blue-500/10 text-blue-500';
            case 'completed': return 'bg-emerald-500/10 text-emerald-500';
            case 'transferred': return 'bg-amber-500/10 text-amber-500';
            case 'expired': return 'bg-slate-500/10 text-slate-500';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Ativa';
            case 'completed': return 'Concluída';
            case 'transferred': return 'Transferida';
            case 'expired': return 'Expirada';
            default: return status;
        }
    };

    if (loading && sessions.length === 0) return <div className="p-8 text-center text-slate-500">Carregando sessões...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <MessageSquare size={20} className="text-violet-500" />
                Monitoramento de Sessões
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Ativas Agora</p>
                    <p className="text-2xl font-bold text-blue-500">{stats.active}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Taxa de Conclusão</p>
                    <p className="text-2xl font-bold text-emerald-500">{stats.completionRate}%</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Transferidas</p>
                    <p className="text-2xl font-bold text-amber-500">{stats.transferred}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Média Mensagens</p>
                    <p className="text-2xl font-bold text-slate-700 dark:text-white">{stats.avgMessages}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Total</p>
                    <p className="text-2xl font-bold text-slate-700 dark:text-white">{stats.total}</p>
                </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                <th className="p-4">Contato</th>
                                <th className="p-4">Fluxo</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Dados Coletados</th>
                                <th className="p-4">Msgs</th>
                                <th className="p-4">Última Atividade</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-sm">
                            {sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        Nenhuma sessão encontrada.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{session.conversation?.contact?.profileName || 'Lead'}</p>
                                                    <p className="text-xs text-slate-500">{session.conversation?.contact?.phone || 'Sem telefone'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{session.flow?.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase">{session.flow?.mode}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase whitespace-nowrap ${getStatusColor(session.status)}`}>
                                                {getStatusText(session.status)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="max-w-[200px] truncate text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded">
                                                {Object.keys(session.collectedData || {}).length > 0 
                                                    ? JSON.stringify(session.collectedData)
                                                    : 'Nenhum dado'
                                                }
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-slate-500">
                                            {session.messageCount}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <Clock size={12} />
                                                <span>{new Date(session.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href="/dashboard/whatsapp/kanban" className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Abrir no WhatsApp Web">
                                                    <MessageSquare size={16} />
                                                </Link>
                                                {session.dealId && (
                                                    <Link href={`/dashboard/crm/pipeline/${session.dealId}`} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Ver Oportunidade">
                                                        <ExternalLink size={16} />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
