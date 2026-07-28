"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Calendar, Loader2, Trophy, Users, TrendingUp, DollarSign, Clock, Target } from "lucide-react";
import { reportsService, ConsultantPerformanceRow } from "@/services/reports.service";

export default function ConsultantPerformancePage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<ConsultantPerformanceRow[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getConsultantPerformance(year);
            if (res.success && res.data) {
                setData(res.data);
            }
            setIsLoading(false);
        };
        load();
    }, [year]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Vendedor que gerou maior receita
    const topRevenueConsultant = data && data.length > 0 && data[0].wonValue > 0 ? data[0] : null;
    
    // Vendedor com melhor taxa de conversão (mínimo de 5 negócios para ter validade estatística)
    const topWinRateConsultant = data 
        ? [...data].filter(c => (c.wonCount + c.lostCount) >= 5).sort((a, b) => b.winRate - a.winRate)[0] 
        : null;

    const getInitials = (name: string) => {
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    };

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
                        <span className="text-slate-300 text-sm font-medium">Desempenho</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Users size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Desempenho de Consultores</h1>
                            <p className="text-sm text-slate-400">Ranking oficial do time comercial por receita e taxa de conversão.</p>
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

            {/* KPIs do Topo (Pódio) */}
            {!isLoading && data && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Top Revenue */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden flex items-center gap-6">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Trophy size={80} className="text-emerald-500" />
                        </div>
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-black border border-emerald-500/30 overflow-hidden shrink-0">
                            {topRevenueConsultant?.avatar ? (
                                <img src={topRevenueConsultant.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                topRevenueConsultant ? getInitials(topRevenueConsultant.name) : <Trophy size={32} />
                            )}
                        </div>
                        <div className="z-10">
                            <span className="text-[11px] uppercase font-bold text-emerald-400/80 tracking-wider flex items-center gap-1.5 mb-1">
                                <DollarSign size={14} /> Campeão de Receita
                            </span>
                            <h3 className="text-2xl font-black text-white">{topRevenueConsultant?.name || "Nenhum vencedor"}</h3>
                            <div className="text-emerald-400 font-bold mt-1 text-lg">
                                {topRevenueConsultant ? formatCurrency(topRevenueConsultant.wonValue) : "R$ 0,00"}
                            </div>
                        </div>
                    </div>

                    {/* Top Win Rate */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-slate-900 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden flex items-center gap-6">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Target size={80} className="text-blue-500" />
                        </div>
                        <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl font-black border border-blue-500/30 overflow-hidden shrink-0">
                            {topWinRateConsultant?.avatar ? (
                                <img src={topWinRateConsultant.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                topWinRateConsultant ? getInitials(topWinRateConsultant.name) : <Target size={32} />
                            )}
                        </div>
                        <div className="z-10">
                            <span className="text-[11px] uppercase font-bold text-blue-400/80 tracking-wider flex items-center gap-1.5 mb-1">
                                <TrendingUp size={14} /> Campeão de Conversão (Win Rate)
                            </span>
                            <h3 className="text-2xl font-black text-white">{topWinRateConsultant?.name || "Nenhum vencedor"}</h3>
                            <div className="text-blue-400 font-bold mt-1 text-lg">
                                {topWinRateConsultant ? `${topWinRateConsultant.winRate.toFixed(1)}%` : "0%"} <span className="text-xs font-medium text-slate-500 ml-2">(Mínimo 5 leads)</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Ranking Table */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                            <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">Processando Ranking...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-950 border-b border-white/[0.06] text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold text-center w-16">Pos</th>
                                <th className="p-4 font-bold">Consultor</th>
                                <th className="p-4 font-bold text-right bg-white/[0.02]">Receita Gerada</th>
                                <th className="p-4 font-bold text-center">Vendas</th>
                                <th className="p-4 font-bold w-48">Win Rate (Conversão)</th>
                                <th className="p-4 font-bold text-right">Ticket Médio</th>
                                <th className="p-4 font-bold text-right">Ciclo Médio</th>
                            </tr>
                        </thead>
                        {data && data.length > 0 ? (
                            <tbody>
                                {data.map((row, idx) => {
                                    return (
                                        <tr key={row.id} className="border-b border-white/[0.02] hover:bg-slate-800/50 transition-colors group">
                                            {/* Posição */}
                                            <td className="p-4 text-center">
                                                {idx === 0 ? <Trophy size={18} className="text-amber-400 mx-auto" /> : 
                                                 idx === 1 ? <Trophy size={18} className="text-slate-300 mx-auto" /> : 
                                                 idx === 2 ? <Trophy size={18} className="text-amber-700 mx-auto" /> : 
                                                 <span className="text-sm font-bold text-slate-500">{idx + 1}º</span>}
                                            </td>
                                            
                                            {/* Consultor Info */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center text-slate-300 text-sm font-bold overflow-hidden shrink-0">
                                                        {row.avatar ? (
                                                            <img src={row.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : getInitials(row.name)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-200">{row.name}</div>
                                                        <div className="text-xs text-slate-500">{row.wonCount + row.lostCount} leads atendidos</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Receita */}
                                            <td className="p-4 text-right bg-white/[0.01]">
                                                <div className="text-[15px] font-black text-emerald-400">
                                                    {formatCurrency(row.wonValue)}
                                                </div>
                                            </td>

                                            {/* Vendas Numéricas */}
                                            <td className="p-4 text-center">
                                                <div className="inline-flex items-center justify-center px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                                                    {row.wonCount} <span className="text-emerald-500/60 ml-1">ganhas</span>
                                                </div>
                                            </td>

                                            {/* Win Rate Bar */}
                                            <td className="p-4 w-48">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-slate-300">{row.winRate.toFixed(1)}%</span>
                                                    <span className="text-[10px] text-slate-500">{row.lostCount} perdidas</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                                                    <div className="h-full bg-blue-500" style={{ width: `${row.winRate}%` }}></div>
                                                    <div className="h-full bg-rose-500" style={{ width: `${100 - row.winRate}%` }}></div>
                                                </div>
                                            </td>

                                            {/* Ticket Médio */}
                                            <td className="p-4 text-right text-sm font-bold text-slate-300">
                                                {formatCurrency(row.ticketMedio)}
                                            </td>

                                            {/* Ciclo de Vendas */}
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 text-sm font-bold text-slate-400">
                                                    <Clock size={14} className="text-slate-500" />
                                                    {row.cicloVendasDias.toFixed(0)} <span className="text-xs font-medium text-slate-500">dias</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ) : (
                            !isLoading && (
                                <tbody>
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">
                                            Nenhum negócio processado para o ano selecionado.
                                        </td>
                                    </tr>
                                </tbody>
                            )
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
