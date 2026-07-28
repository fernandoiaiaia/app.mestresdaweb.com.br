"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Calendar, Loader2, Code2, LineChart, TrendingUp, TrendingDown, Clock, ShieldAlert } from "lucide-react";
import { reportsService, ProjectProfitabilityRow } from "@/services/reports.service";

export default function ProjectProfitabilityPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<ProjectProfitabilityRow[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getProjectProfitability(year);
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

    // Filtros e Agregações
    const activeProjects = data ? data.filter(p => p.hoursLogged > 0 || p.revenue > 0) : [];
    
    const globalRevenue = activeProjects.reduce((acc, p) => acc + p.revenue, 0);
    const globalCost = activeProjects.reduce((acc, p) => acc + p.cost, 0);
    const globalProfit = globalRevenue - globalCost;
    const globalMargin = globalRevenue > 0 ? (globalProfit / globalRevenue) * 100 : 0;

    const mostProfitableProject = activeProjects.length > 0 ? [...activeProjects].sort((a, b) => b.profit - a.profit)[0] : null;

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
                        <span className="text-slate-300 text-sm font-medium">Projetos</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Code2 size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Rentabilidade de Projetos</h1>
                            <p className="text-sm text-slate-400">Cruzamento de Custos Operacionais (Horas Trabalhadas) vs Receita de Venda.</p>
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
                    {/* KPI 1: Margem Global */}
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-lg ${globalMargin >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                <LineChart size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Margem Média Global</h3>
                        </div>
                        <div className={`text-3xl font-black ${globalMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {globalMargin.toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-500 mt-2 font-medium">
                            Resultado consolidado de todos os projetos de {year}.
                        </div>
                    </div>

                    {/* KPI 2: Lucro Global */}
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-lg ${globalProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {globalProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Lucro Operacional</h3>
                        </div>
                        <div className={`text-3xl font-black ${globalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(globalProfit)}
                        </div>
                        <div className="text-sm font-medium mt-2 flex items-center gap-2">
                            <span className="text-slate-500">Receita: {formatCurrency(globalRevenue)}</span>
                        </div>
                    </div>

                    {/* KPI 3: Melhor Projeto */}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Code2 size={80} className="text-indigo-500" />
                        </div>
                        <div className="z-10 relative">
                            <h3 className="text-xs font-bold text-indigo-400/80 uppercase tracking-wider mb-2">Projeto Mais Lucrativo</h3>
                            <div className="text-xl font-black text-white truncate pr-10">
                                {mostProfitableProject?.projectName || "Nenhum"}
                            </div>
                            {mostProfitableProject && (
                                <div className="mt-3 inline-flex items-center gap-2 bg-slate-900/50 border border-white/5 px-3 py-1.5 rounded-lg">
                                    <span className="text-sm font-bold text-emerald-400">{formatCurrency(mostProfitableProject.profit)}</span>
                                    <span className="text-xs text-slate-500">lucro líquido</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Ranking Table */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                            <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Calculando Custos...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-slate-950 border-b border-white/[0.06] text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold">Projeto & Cliente</th>
                                <th className="p-4 font-bold text-center">Horas Logadas</th>
                                <th className="p-4 font-bold text-right">Custo Real (HH)</th>
                                <th className="p-4 font-bold text-right">Receita (Vendido)</th>
                                <th className="p-4 font-bold text-right">Lucro Bruto</th>
                                <th className="p-4 font-bold w-48">Margem (%)</th>
                            </tr>
                        </thead>
                        {activeProjects && activeProjects.length > 0 ? (
                            <tbody>
                                {activeProjects.map((row) => {
                                    const isLoss = row.profit < 0;
                                    const noRevenue = row.revenue === 0;

                                    return (
                                        <tr key={row.projectId} className="border-b border-white/[0.02] hover:bg-slate-800/50 transition-colors group">
                                            {/* Projeto Info */}
                                            <td className="p-4">
                                                <div className="font-bold text-sm text-slate-200">{row.projectName}</div>
                                                <div className="text-xs text-slate-500">{row.clientName}</div>
                                                {noRevenue && (
                                                    <div className="text-[10px] uppercase font-bold text-amber-500/80 flex items-center gap-1 mt-1">
                                                        <ShieldAlert size={10} /> Sem Receita Vinculada (Custo Puro)
                                                    </div>
                                                )}
                                            </td>

                                            {/* Horas */}
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                                                        <Clock size={14} className="text-slate-500" />
                                                        {row.hoursLogged.toFixed(1)}h
                                                    </span>
                                                    {row.hoursEstimated > 0 && (
                                                        <span className="text-[10px] text-slate-500">
                                                            de {row.hoursEstimated}h orçadas
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Custo */}
                                            <td className="p-4 text-right">
                                                <div className="text-[14px] font-bold text-rose-400">
                                                    {formatCurrency(row.cost)}
                                                </div>
                                            </td>

                                            {/* Receita */}
                                            <td className="p-4 text-right">
                                                <div className={`text-[14px] font-bold ${noRevenue ? 'text-slate-600' : 'text-emerald-400'}`}>
                                                    {formatCurrency(row.revenue)}
                                                </div>
                                            </td>

                                            {/* Lucro */}
                                            <td className="p-4 text-right bg-white/[0.01]">
                                                <div className={`text-[15px] font-black ${isLoss ? 'text-rose-500' : 'text-emerald-400'}`}>
                                                    {isLoss ? '-' : '+'}{formatCurrency(Math.abs(row.profit))}
                                                </div>
                                            </td>

                                            {/* Margem Bar */}
                                            <td className="p-4 w-48">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-xs font-bold ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {row.margin.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                                                    {isLoss ? (
                                                        <div className="h-full bg-rose-500" style={{ width: `100%` }}></div>
                                                    ) : (
                                                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(row.margin, 100)}%` }}></div>
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
                                        <td colSpan={6} className="p-8 text-center text-slate-500">
                                            Nenhum projeto com horas logadas ou receita atrelada foi encontrado.
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
