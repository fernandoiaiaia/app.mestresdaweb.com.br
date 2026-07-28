"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Calendar, Loader2, PieChart, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Target } from "lucide-react";
import { reportsService, ProfitabilityRow } from "@/services/reports.service";

export default function ProfitabilityPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<ProfitabilityRow[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getProfitability(year);
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

    const totalLucro = data?.reduce((acc, row) => acc + row.lucro, 0) || 0;
    const topCenter = data && data.length > 0 && data[0].lucro > 0 ? data[0] : null;
    const bottomCenter = data && data.length > 0 && data[data.length - 1].lucro < 0 ? data[data.length - 1] : null;

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
                        <span className="text-slate-300 text-sm font-medium">Rentabilidade</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <PieChart size={24} className="text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Rentabilidade por Centro de Custo</h1>
                            <p className="text-sm text-slate-400">Descubra quais áreas geram mais lucro e quais geram prejuízo.</p>
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
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Target size={64} className="text-white" />
                        </div>
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Lucro Líquido Global ({year})</span>
                        <div className={`text-3xl font-black mt-2 ${totalLucro >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(totalLucro)}
                        </div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <TrendingUp size={64} className="text-emerald-500" />
                        </div>
                        <span className="text-[11px] uppercase font-bold text-emerald-400/80 tracking-wider">Centro de Custo Mais Lucrativo</span>
                        {topCenter ? (
                            <>
                                <div className="text-2xl font-black text-emerald-400 mt-2 truncate" title={topCenter.costCenter}>
                                    {topCenter.costCenter}
                                </div>
                                <div className="text-sm font-bold text-emerald-500/80 mt-1">
                                    +{formatCurrency(topCenter.lucro)} ({topCenter.margem.toFixed(1)}%)
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-500 mt-2">Nenhum setor com lucro.</div>
                        )}
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <TrendingDown size={64} className="text-rose-500" />
                        </div>
                        <span className="text-[11px] uppercase font-bold text-rose-400/80 tracking-wider">Centro de Custo Mais Deficitário</span>
                        {bottomCenter ? (
                            <>
                                <div className="text-2xl font-black text-rose-400 mt-2 truncate" title={bottomCenter.costCenter}>
                                    {bottomCenter.costCenter}
                                </div>
                                <div className="text-sm font-bold text-rose-500/80 mt-1">
                                    {formatCurrency(bottomCenter.lucro)}
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-500 mt-2">Nenhum setor com prejuízo.</div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Tabela */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="animate-spin text-purple-500" />
                            <span className="text-sm font-bold text-purple-400 uppercase tracking-widest">Calculando Rentabilidade...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-950 border-b border-white/[0.06] text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold">Centro de Custo</th>
                                <th className="p-4 font-bold text-right">Lançamentos</th>
                                <th className="p-4 font-bold text-right">Receitas</th>
                                <th className="p-4 font-bold text-right">Despesas</th>
                                <th className="p-4 font-bold text-right bg-white/[0.02]">Lucro Líquido</th>
                                <th className="p-4 font-bold text-right bg-white/[0.02]">Margem (%)</th>
                                <th className="p-4 font-bold text-center w-[200px]">Proporção</th>
                            </tr>
                        </thead>
                        {data && data.length > 0 ? (
                            <tbody>
                                {data.map((row, idx) => {
                                    const totalVolume = row.receitas + row.despesas;
                                    const percentReceita = totalVolume > 0 ? (row.receitas / totalVolume) * 100 : 0;
                                    const isLucro = row.lucro >= 0;

                                    return (
                                        <tr key={idx} className="border-b border-white/[0.02] hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-bold text-sm text-slate-200">
                                                {row.costCenter}
                                            </td>
                                            <td className="p-4 text-center text-xs font-medium text-slate-500">
                                                {row.qtdLancamentos}
                                            </td>
                                            <td className="p-4 text-right text-sm text-emerald-400/80">
                                                {formatCurrency(row.receitas)}
                                            </td>
                                            <td className="p-4 text-right text-sm text-rose-400/80">
                                                {formatCurrency(row.despesas)}
                                            </td>
                                            <td className={`p-4 text-right text-sm font-black bg-white/[0.01] ${isLucro ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {isLucro ? '+' : ''}{formatCurrency(row.lucro)}
                                            </td>
                                            <td className={`p-4 text-right text-sm font-bold bg-white/[0.01] ${isLucro ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {isLucro ? <ArrowUpRight size={14} className="inline mr-1" /> : <ArrowDownRight size={14} className="inline mr-1" />}
                                                {row.margem.toFixed(1)}%
                                            </td>
                                            <td className="p-4 w-[200px] align-middle">
                                                {/* Barra de Proporção (Receita vs Despesa) */}
                                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                                                    {totalVolume > 0 ? (
                                                        <>
                                                            <div className="h-full bg-emerald-500" style={{ width: `${percentReceita}%` }}></div>
                                                            <div className="h-full bg-rose-500" style={{ width: `${100 - percentReceita}%` }}></div>
                                                        </>
                                                    ) : (
                                                        <div className="h-full w-full bg-slate-800"></div>
                                                    )}
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
                                            Nenhum lançamento encontrado para o ano selecionado.
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
