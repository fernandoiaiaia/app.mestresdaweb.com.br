"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Calendar, Loader2, Megaphone, Target, Magnet, Percent, BarChart } from "lucide-react";
import { reportsService, AcquisitionRow } from "@/services/reports.service";

export default function AcquisitionROIPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<AcquisitionRow[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getAcquisitionROI(year);
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

    // Canal que gerou maior receita
    const topRevenueChannel = data && data.length > 0 && data[0].wonValue > 0 ? data[0] : null;
    
    // Canal com melhor taxa de conversão (mínimo de 5 leads para validade)
    const topWinRateChannel = data 
        ? [...data].filter(c => c.totalLeads >= 5).sort((a, b) => b.winRate - a.winRate)[0] 
        : null;

    // Calcular o máximo de receita para definir 100% nas barras relativas
    const maxRevenue = data && data.length > 0 ? Math.max(...data.map(d => d.wonValue)) || 1 : 1;

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
                        <span className="text-slate-300 text-sm font-medium">Canais e Aquisição</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                            <Megaphone size={24} className="text-pink-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Retorno por Canal de Aquisição</h1>
                            <p className="text-sm text-slate-400">Descubra de onde vêm os seus clientes mais lucrativos.</p>
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
                    {/* Top Receita */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Magnet size={100} className="text-emerald-500" />
                        </div>
                        <div className="z-10">
                            <span className="text-[11px] uppercase font-bold text-emerald-400/80 tracking-wider flex items-center gap-1.5 mb-1">
                                <BarChart size={14} /> Canal de Maior Retorno (Volume Financeiro)
                            </span>
                            <h3 className="text-3xl font-black text-white">{topRevenueChannel?.source || "Nenhum canal"}</h3>
                            <div className="text-emerald-400 font-bold mt-2 text-xl">
                                {topRevenueChannel ? formatCurrency(topRevenueChannel.wonValue) : "R$ 0,00"}
                            </div>
                        </div>
                        {topRevenueChannel && (
                            <div className="z-10 bg-slate-900/60 p-4 rounded-xl border border-white/5 text-right shrink-0">
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Ticket Médio</div>
                                <div className="text-lg font-black text-slate-200">{formatCurrency(topRevenueChannel.ticketMedio)}</div>
                            </div>
                        )}
                    </div>

                    {/* Top Win Rate */}
                    <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Target size={100} className="text-pink-500" />
                        </div>
                        <div className="z-10">
                            <span className="text-[11px] uppercase font-bold text-pink-400/80 tracking-wider flex items-center gap-1.5 mb-1">
                                <Percent size={14} /> Canal de Maior Conversão (Qualidade de Lead)
                            </span>
                            <h3 className="text-3xl font-black text-white">{topWinRateChannel?.source || "Nenhum canal"}</h3>
                            <div className="text-pink-400 font-bold mt-2 text-xl">
                                {topWinRateChannel ? `${topWinRateChannel.winRate.toFixed(1)}%` : "0%"} <span className="text-xs font-medium text-pink-500/60 ml-1">Win Rate</span>
                            </div>
                        </div>
                        {topWinRateChannel && (
                            <div className="z-10 bg-slate-900/60 p-4 rounded-xl border border-white/5 text-right shrink-0">
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Leads Gerados</div>
                                <div className="text-lg font-black text-slate-200">{topWinRateChannel.totalLeads} leads</div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Ranking Table */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="animate-spin text-pink-500" />
                            <span className="text-sm font-bold text-pink-400 uppercase tracking-widest">Processando Fontes...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-950 border-b border-white/[0.06] text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold text-center w-16">Rank</th>
                                <th className="p-4 font-bold">Origem (Canal)</th>
                                <th className="p-4 font-bold text-center">Volume de Leads</th>
                                <th className="p-4 font-bold text-center">Vendas Fechadas</th>
                                <th className="p-4 font-bold w-48">Taxa de Conversão</th>
                                <th className="p-4 font-bold text-right">Ticket Médio</th>
                                <th className="p-4 font-bold text-right bg-white/[0.02]">Receita Gerada</th>
                            </tr>
                        </thead>
                        {data && data.length > 0 ? (
                            <tbody>
                                {data.map((row, idx) => {
                                    const revenuePercent = (row.wonValue / maxRevenue) * 100 || 0;

                                    return (
                                        <tr key={idx} className="border-b border-white/[0.02] hover:bg-slate-800/50 transition-colors group">
                                            {/* Rank */}
                                            <td className="p-4 text-center">
                                                <span className="text-sm font-bold text-slate-500">{idx + 1}º</span>
                                            </td>
                                            
                                            {/* Source */}
                                            <td className="p-4 font-black text-sm text-slate-200 capitalize">
                                                {row.source}
                                            </td>

                                            {/* Leads */}
                                            <td className="p-4 text-center">
                                                <div className="inline-block px-3 py-1 bg-slate-900 text-slate-300 border border-white/5 rounded-lg text-xs font-bold">
                                                    {row.totalLeads}
                                                </div>
                                            </td>

                                            {/* Vendas */}
                                            <td className="p-4 text-center">
                                                <div className="text-sm font-bold text-emerald-400">
                                                    {row.wonCount}
                                                </div>
                                            </td>

                                            {/* Win Rate */}
                                            <td className="p-4 w-48 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-bold w-10 ${row.winRate > 20 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                        {row.winRate.toFixed(1)}%
                                                    </span>
                                                    <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${row.winRate > 20 ? 'bg-emerald-500' : 'bg-slate-600'}`} 
                                                            style={{ width: `${row.winRate}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Ticket Médio */}
                                            <td className="p-4 text-right text-sm font-bold text-slate-400">
                                                {formatCurrency(row.ticketMedio)}
                                            </td>

                                            {/* Receita Gerada */}
                                            <td className="p-4 text-right bg-white/[0.01] relative overflow-hidden">
                                                {/* Barra de Fundo da Receita */}
                                                <div 
                                                    className="absolute inset-y-0 right-0 bg-emerald-500/5 transition-all group-hover:bg-emerald-500/10" 
                                                    style={{ width: `${revenuePercent}%` }}
                                                ></div>
                                                <div className="relative z-10 text-[15px] font-black text-white">
                                                    {formatCurrency(row.wonValue)}
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
                                            Nenhum negócio processado para analisar os canais.
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
