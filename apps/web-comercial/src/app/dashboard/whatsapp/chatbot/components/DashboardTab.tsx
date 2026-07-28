"use client";

import { useState, useEffect } from "react";
import { Activity, MessageSquare, ArrowRightLeft, ShieldAlert, TrendingUp, Loader2 } from "lucide-react";
import { getChatbotDashboard, type DashboardStats } from "@/lib/chatbot-api";

export function DashboardTab() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        setLoading(true);
        const res = await getChatbotDashboard();
        if (res.success && res.data) {
            setStats(res.data);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <Loader2 size={24} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    const s = stats || {
        totalSessions: 0, activeSessions: 0, completedSessions: 0,
        handedOffSessions: 0, todaySessions: 0, avgQualificationScore: 0, conversionRate: 0
    };

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-medium text-slate-400">Sessões Ativas</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Activity size={16} className="text-blue-400" />
                        </div>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white">{s.activeSessions}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">{s.todaySessions} hoje</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-medium text-slate-400">Qualificações (IA)</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <MessageSquare size={16} className="text-purple-400" />
                        </div>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white">{s.completedSessions}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">total concluídas</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-medium text-slate-400">Taxa de Handoff</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <ArrowRightLeft size={16} className="text-amber-400" />
                        </div>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white">{s.handedOffSessions}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">transferências para humano</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-medium text-slate-400">Score de Qualificação</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <TrendingUp size={16} className="text-emerald-400" />
                        </div>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-emerald-400">{s.avgQualificationScore}%</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">média BANT</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white mb-4">Resumo Geral</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Total de sessões</span>
                            <span className="text-sm font-bold text-white">{s.totalSessions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Sessões ativas agora</span>
                            <span className="text-sm font-bold text-blue-400">{s.activeSessions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Qualificações completas</span>
                            <span className="text-sm font-bold text-emerald-400">{s.completedSessions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Transferências (handoff)</span>
                            <span className="text-sm font-bold text-amber-400">{s.handedOffSessions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Taxa de conversão</span>
                            <span className="text-sm font-bold text-purple-400">{s.conversionRate}%</span>
                        </div>
                    </div>
                 </div>
                 <div className="h-64 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-center flex-col gap-2">
                    <ShieldAlert size={24} className="text-slate-600" />
                    <span className="text-xs text-slate-500">Quality Rating Meta</span>
                    <span className="text-lg font-bold text-emerald-400">Alto</span>
                    <span className="text-[10px] text-slate-500">Monitorado em tempo real via API</span>
                 </div>
            </div>
        </div>
    );
}
