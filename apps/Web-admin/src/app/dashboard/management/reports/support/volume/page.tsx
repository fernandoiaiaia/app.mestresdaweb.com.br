"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Calendar, Loader2, Headphones, Activity, Clock, CheckCircle2, Trophy, User } from "lucide-react";
import { reportsService, SupportVolumeData } from "@/services/reports.service";

export default function SupportVolumePage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<SupportVolumeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getSupportVolume(year);
            if (res.success && res.data) {
                setData(res.data);
            }
            setIsLoading(false);
        };
        load();
    }, [year]);

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    const formatSLA = (hours: number) => {
        if (hours < 1) {
            const mins = Math.round(hours * 60);
            return `${mins} min${mins !== 1 ? 's' : ''}`;
        }
        if (hours < 24) {
            return `${hours.toFixed(1)} h`;
        }
        const days = Math.floor(hours / 24);
        return `${days} dia${days !== 1 ? 's' : ''}`;
    };

    const maxValue = data?.timeline && data.timeline.length > 0 
        ? Math.max(...data.timeline.map(m => m.total)) || 1 
        : 1;

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
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Headphones size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Volume de Atendimentos</h1>
                            <p className="text-sm text-slate-400">Demanda de tickets, TTR médio e ranking de produtividade do time.</p>
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* KPI 1: Volume */}
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Activity size={80} className="text-indigo-500" />
                        </div>
                        <div className="z-10 relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                                    <Headphones size={20} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Demanda Total</h3>
                            </div>
                            <div className="text-3xl font-black text-white flex items-baseline gap-2">
                                {data.totalVolume} <span className="text-lg font-bold text-slate-500">tickets abertos</span>
                            </div>
                            <div className="text-sm text-slate-500 mt-2 font-medium">
                                Volume bruto de conversas (Whatsapp) no ano.
                            </div>
                        </div>
                    </div>

                    {/* KPI 2: Resolução */}
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <CheckCircle2 size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Taxa de Resolução</h3>
                        </div>
                        <div className={`text-3xl font-black ${data.resolutionRate >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {data.resolutionRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-500 mt-2 font-medium">
                            Eficiência geral de fechamento de tickets.
                        </div>
                    </div>

                    {/* KPI 3: Tempo Médio de Resolução */}
                    <div className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 ${data.avgResolutionTimeHours > 48 ? 'ring-1 ring-rose-500/30' : ''}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-lg ${data.avgResolutionTimeHours > 48 ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                <Clock size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">TTR (SLA Médio)</h3>
                        </div>
                        <div className={`text-3xl font-black ${data.avgResolutionTimeHours > 48 ? 'text-rose-400' : 'text-blue-400'}`}>
                            {formatSLA(data.avgResolutionTimeHours)}
                        </div>
                        <div className="text-sm font-medium mt-2 text-slate-500">
                            Tempo médio entre a abertura e o fechamento do chamado.
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline de Volume Mensal */}
                <div className="lg:col-span-2 bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative p-6">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="animate-spin text-indigo-500" />
                                <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Processando Demandas...</span>
                            </div>
                        </div>
                    )}

                    <h2 className="text-lg font-bold text-white mb-6">Gráfico de Demanda (Sazonalidade)</h2>
                    
                    <div className="flex items-end gap-2 h-64 mt-4 relative">
                        {data?.timeline && data.timeline.map((row) => {
                            const barHeight = (row.total / maxValue) * 100 || 0;
                            const resolvedPct = row.total > 0 ? (row.resolved / row.total) * 100 : 0;
                            
                            return (
                                <div key={row.month} className="flex-1 flex flex-col items-center justify-end group">
                                    <div className="w-full relative flex flex-col justify-end group-hover:opacity-80 transition-opacity cursor-crosshair">
                                        {/* Hover Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl border border-white/10 whitespace-nowrap z-20 pointer-events-none transition-opacity shadow-xl">
                                            {row.total} tickets ({row.resolved} resolvidos)
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-b border-r border-white/10"></div>
                                        </div>
                                        
                                        {/* Bar Container */}
                                        <div className="w-full bg-slate-900 rounded-t-md mx-1 relative overflow-hidden flex flex-col justify-end" style={{ height: `${barHeight}%`, minHeight: '4px' }}>
                                            {/* Open Portion (Indigo) */}
                                            <div className="w-full bg-indigo-500/50" style={{ height: `${100 - resolvedPct}%` }}></div>
                                            {/* Resolved Portion (Emerald) */}
                                            <div className="w-full bg-emerald-500/80" style={{ height: `${resolvedPct}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-slate-500 mt-3 uppercase tracking-wider">{monthNames[row.month - 1]}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-6 mt-8 pt-4 border-t border-white/5 justify-center">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                            <div className="w-3 h-3 rounded-sm bg-emerald-500/80"></div> Tickets Resolvidos
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                            <div className="w-3 h-3 rounded-sm bg-indigo-500/50"></div> Em Aberto
                        </div>
                    </div>
                </div>

                {/* Ranking de Atendentes */}
                <div className="lg:col-span-1 bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                    <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Top Atendentes</h2>
                            <p className="text-sm text-slate-400">Ranking de resolução.</p>
                        </div>
                        <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
                            <Trophy size={20} />
                        </div>
                    </div>

                    <div className="p-0">
                        {data?.topAgents && data.topAgents.length > 0 ? (
                            <div className="divide-y divide-white/[0.04]">
                                {data.topAgents.map((agent, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 hover:bg-slate-800/50 transition-colors">
                                        <div className="w-8 text-center text-sm font-black text-slate-500">
                                            #{idx + 1}
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-700 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                            {agent.profileImage ? (
                                                <img src={agent.profileImage} alt={agent.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={16} className="text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-white truncate">{agent.name}</div>
                                            <div className="text-xs text-slate-500">Analista de Suporte</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-lg font-black text-emerald-400">
                                                {agent.resolvedCount}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                                Resolvidos
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            !isLoading && (
                                <div className="text-center p-10 flex flex-col items-center">
                                    <User size={40} className="text-slate-700 mb-3" />
                                    <div className="text-slate-500 font-medium text-sm">Nenhum atendimento resolvido.</div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
