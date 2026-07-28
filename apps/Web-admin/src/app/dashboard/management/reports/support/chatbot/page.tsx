"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Calendar, Loader2, Bot, ShieldCheck, Sparkles, MessageSquare, AlertTriangle } from "lucide-react";
import { reportsService, ChatbotMetricsData } from "@/services/reports.service";

export default function ChatbotMetricsPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<ChatbotMetricsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getChatbotMetrics(year);
            if (res.success && res.data) {
                setData(res.data);
            }
            setIsLoading(false);
        };
        load();
    }, [year]);

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen pb-32">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Link href="/dashboard/management/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                            <ChevronLeft size={16} /><span>Relatórios</span>
                        </Link>
                        <span className="text-slate-700">/</span>
                        <span className="text-slate-300 text-sm font-medium">Suporte</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                            <Bot size={24} className="text-pink-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Atendimento IA (Chatbot)</h1>
                            <p className="text-sm text-slate-400">Eficiência de retenção e qualificação automática de leads.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/80 p-2 rounded-2xl border border-white/5">
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select 
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="pl-9 pr-8 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl border border-white/10 focus:outline-none appearance-none"
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* KPIs */}
            {!isLoading && data && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    {/* KPI 1: Volume */}
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400">
                                <MessageSquare size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Volume</h3>
                        </div>
                        <div className="text-3xl font-black text-white">
                            {data.totalSessions}
                        </div>
                        <div className="text-sm text-slate-500 mt-2 font-medium">
                            Total de chats.
                        </div>
                    </div>

                    {/* KPI 2: Retenção */}
                    <div className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 ${data.retentionRate > 50 ? 'ring-1 ring-emerald-500/30' : ''}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-lg ${data.retentionRate > 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                <ShieldCheck size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Retenção</h3>
                        </div>
                        <div className={`text-3xl font-black ${data.retentionRate > 50 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {data.retentionRate.toFixed(1)}%
                        </div>
                        <div className="text-sm mt-2 font-medium text-slate-500">
                            Sem transbordo.
                        </div>
                    </div>

                    {/* KPI 3: Transbordo (Handoff) */}
                    <div className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 ${data.handoffRate > 40 ? 'ring-1 ring-rose-500/30' : ''}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-lg ${data.handoffRate > 40 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Handoff</h3>
                        </div>
                        <div className={`text-3xl font-black ${data.handoffRate > 40 ? 'text-rose-400' : 'text-amber-400'}`}>
                            {data.handoffRate.toFixed(1)}%
                        </div>
                        <div className="text-sm mt-2 font-medium text-slate-500">
                            Repassado a humanos.
                        </div>
                    </div>

                    {/* KPI 4: Reuniões Agendadas */}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                                <Calendar size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-indigo-400/80 uppercase tracking-wider">Reuniões</h3>
                        </div>
                        <div className="text-3xl font-black text-white">
                            {data.totalMeetingsScheduled} <span className="text-lg font-bold text-indigo-500/50">agendadas</span>
                        </div>
                        <div className="text-sm mt-2 font-medium text-indigo-400/80">
                            Fechadas direto com a IA.
                        </div>
                    </div>

                    {/* KPI 5: Score */}
                    <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles size={80} className="text-pink-500" />
                        </div>
                        <div className="z-10 relative">
                            <h3 className="text-xs font-bold text-pink-400/80 uppercase tracking-wider mb-2">Score Médio</h3>
                            <div className="text-3xl font-black text-white">
                                {data.avgScore.toFixed(0)} <span className="text-lg font-bold text-slate-400">/ 100</span>
                            </div>
                            <div className="mt-2 text-sm font-medium text-pink-400/90">
                                Qualificação da IA.
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline Mensal */}
                <div className="lg:col-span-2 bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative p-6">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="animate-spin text-pink-500" />
                                <span className="text-sm font-bold text-pink-400 uppercase tracking-widest">Processando Inteligência...</span>
                            </div>
                        </div>
                    )}

                    <h2 className="text-lg font-bold text-white mb-6">Eficiência Mês a Mês</h2>
                    
                    <div className="space-y-4">
                        {data?.timeline && data.timeline.map((row) => {
                            // Se não teve sessão, exibe zerado de forma neutra
                            if (row.total === 0) {
                                return (
                                    <div key={row.month} className="flex items-center gap-4 opacity-30">
                                        <div className="w-12 text-sm font-bold text-slate-400 uppercase">{monthNames[row.month - 1]}</div>
                                        <div className="flex-1 h-6 bg-slate-900 rounded-lg"></div>
                                        <div className="w-40 flex items-center justify-end gap-3">
                                            <div className="text-right text-xs font-bold text-slate-600">0 chats</div>
                                        </div>
                                    </div>
                                );
                            }

                            const retentionPct = (row.completed / row.total) * 100;
                            const handoffPct = (row.handedOff / row.total) * 100;

                            return (
                                <div key={row.month} className="flex items-center gap-4">
                                    <div className="w-12 text-sm font-bold text-slate-300 uppercase">
                                        {monthNames[row.month - 1]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-6 bg-slate-900 rounded-lg overflow-hidden flex">
                                            {/* Retenção (Verde) */}
                                            <div 
                                                className="h-full bg-emerald-500/80 transition-all duration-500" 
                                                style={{ width: `${retentionPct}%` }}
                                                title={`Retenção: ${retentionPct.toFixed(1)}%`}
                                            ></div>
                                            {/* Transbordo (Vermelho/Laranja) */}
                                            <div 
                                                className="h-full bg-rose-500/80 transition-all duration-500" 
                                                style={{ width: `${handoffPct}%` }}
                                                title={`Transbordo: ${handoffPct.toFixed(1)}%`}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="w-40 flex items-center justify-end gap-3 text-right">
                                        {row.meetingsScheduled > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md" title={`${row.meetingsScheduled} reuniões agendadas pela IA`}>
                                                <Calendar size={12} /> {row.meetingsScheduled}
                                            </div>
                                        )}
                                        <div className="text-sm font-bold text-white w-16">{row.total} chats</div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                                <div className="w-3 h-3 rounded-sm bg-emerald-500/80"></div> Retenção (IA)
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                                <div className="w-3 h-3 rounded-sm bg-rose-500/80"></div> Transbordo
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                                <Calendar size={12} className="text-indigo-400" /> Reuniões Agendadas
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bots Performance */}
                <div className="lg:col-span-1 bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                    <div className="p-6 border-b border-white/[0.06]">
                        <h2 className="text-lg font-bold text-white">Performance por Bot</h2>
                        <p className="text-sm text-slate-400">Qual IA pede mais ajuda?</p>
                    </div>

                    <div className="p-4">
                        {data?.botPerformances && data.botPerformances.length > 0 ? (
                            <div className="space-y-4">
                                {data.botPerformances.map((bot, idx) => (
                                    <div key={idx} className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
                                                <Bot size={16} />
                                            </div>
                                            <div className="font-bold text-sm text-white">{bot.botName}</div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Taxa de Handoff</div>
                                                <div className={`text-lg font-black ${bot.handoffRate > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {bot.handoffRate.toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium">
                                                {bot.totalSessions} sessões totais
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 text-slate-500 text-sm">
                                Nenhuma IA atuando no momento.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
