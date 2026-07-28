"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, TrendingUp, Calendar, Loader2, AlertCircle, TrendingDown, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { reportsService, CashFlowData } from "@/services/reports.service";

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function CashFlowPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getCashFlow(year);
            if (res.success && res.data) {
                setCashFlow(res.data);
            }
            setIsLoading(false);
        };
        load();
    }, [year]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Obter o menor saldo projetado para alertar o usuário se o caixa vai furar
    const minProjectedBalance = cashFlow ? Math.min(...cashFlow.months.map(m => m.saldoFinalProjetado)) : 0;
    const lowestMonthIdx = cashFlow ? cashFlow.months.findIndex(m => m.saldoFinalProjetado === minProjectedBalance) : 0;

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
                        <span className="text-slate-300 text-sm font-medium">Fluxo de Caixa</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <TrendingUp size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Fluxo de Caixa Projetado</h1>
                            <p className="text-sm text-slate-400">Previsibilidade de liquidez e caixa futuro.</p>
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

            {/* Alerta de Caixa Negativo */}
            {!isLoading && minProjectedBalance < 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="text-rose-400 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-rose-400">Alerta de Furo de Caixa</h3>
                        <p className="text-sm text-rose-400/80 mt-1">A projeção indica que a conta ficará negativa em <b>{formatCurrency(minProjectedBalance)}</b> no mês de <b>{MONTH_NAMES[lowestMonthIdx]}</b>. Recomendamos antecipar recebíveis ou revisar despesas para esse período.</p>
                    </div>
                </motion.div>
            )}

            {/* Tabela de Fluxo de Caixa */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                            <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">Calculando Projeções...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 border-b border-white/[0.06] text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold min-w-[200px] sticky left-0 bg-slate-950 z-20 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">Mês</th>
                                {MONTH_NAMES.map(m => <th key={m} className="p-4 font-bold text-center min-w-[120px]">{m}</th>)}
                            </tr>
                        </thead>
                        {cashFlow && (
                            <tbody>
                                {/* SALDO INICIAL */}
                                <tr className="border-b border-white/[0.02] bg-slate-900/30">
                                    <td className="p-4 font-bold text-sm text-slate-300 sticky left-0 bg-slate-900 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">Saldo Inicial (Projetado)</td>
                                    {cashFlow.months.map(m => (
                                        <td key={m.monthIndex} className={`p-4 text-center text-sm font-medium ${m.saldoInicialProjetado >= 0 ? 'text-slate-300' : 'text-rose-400'}`}>
                                            {formatCurrency(m.saldoInicialProjetado)}
                                        </td>
                                    ))}
                                </tr>

                                {/* ENTRADAS */}
                                <tr className="border-b border-white/[0.02]">
                                    <td className="p-4 text-sm text-slate-400 sticky left-0 bg-slate-800 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.5)] flex items-center gap-2">
                                        <ArrowUpRight size={14} className="text-emerald-500" /> Entradas Previstas
                                    </td>
                                    {cashFlow.months.map(m => (
                                        <td key={m.monthIndex} className="p-4 text-center text-sm text-slate-400">
                                            {m.entradasPrevistas > 0 ? formatCurrency(m.entradasPrevistas) : '-'}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-b border-white/[0.05]">
                                    <td className="p-4 text-sm text-emerald-400 font-medium sticky left-0 bg-slate-800 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.5)] pl-8">
                                        + Entradas Realizadas
                                    </td>
                                    {cashFlow.months.map(m => (
                                        <td key={m.monthIndex} className="p-4 text-center text-sm text-emerald-400 font-medium">
                                            {m.entradasRealizadas > 0 ? formatCurrency(m.entradasRealizadas) : '-'}
                                        </td>
                                    ))}
                                </tr>

                                {/* SAÍDAS */}
                                <tr className="border-b border-white/[0.02]">
                                    <td className="p-4 text-sm text-slate-400 sticky left-0 bg-slate-800 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.5)] flex items-center gap-2">
                                        <ArrowDownRight size={14} className="text-rose-500" /> Saídas Previstas
                                    </td>
                                    {cashFlow.months.map(m => (
                                        <td key={m.monthIndex} className="p-4 text-center text-sm text-slate-400">
                                            {m.saidasPrevistas > 0 ? formatCurrency(m.saidasPrevistas) : '-'}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-b border-white/[0.05]">
                                    <td className="p-4 text-sm text-rose-400 font-medium sticky left-0 bg-slate-800 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.5)] pl-8">
                                        - Saídas Realizadas
                                    </td>
                                    {cashFlow.months.map(m => (
                                        <td key={m.monthIndex} className="p-4 text-center text-sm text-rose-400 font-medium">
                                            {m.saidasRealizadas > 0 ? formatCurrency(m.saidasRealizadas) : '-'}
                                        </td>
                                    ))}
                                </tr>

                                {/* GERAÇÃO DE CAIXA NO MÊS */}
                                <tr className="border-b border-white/[0.02] bg-slate-900/50">
                                    <td className="p-4 text-xs font-bold text-slate-500 uppercase sticky left-0 bg-slate-900 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                                        Geração de Caixa (Mês)
                                    </td>
                                    {cashFlow.months.map(m => {
                                        const geracao = (m.entradasRealizadas + m.entradasPrevistas) - (m.saidasRealizadas + m.saidasPrevistas);
                                        return (
                                            <td key={m.monthIndex} className={`p-4 text-center text-xs font-bold ${geracao > 0 ? 'text-emerald-500/70' : geracao < 0 ? 'text-rose-500/70' : 'text-slate-500'}`}>
                                                {geracao > 0 ? '+' : ''}{formatCurrency(geracao)}
                                            </td>
                                        );
                                    })}
                                </tr>

                                {/* SALDO FINAL PROJETADO */}
                                <tr className="border-b border-white/[0.05] bg-blue-500/5">
                                    <td className="p-4 font-black text-sm text-blue-400 sticky left-0 bg-slate-900 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                                        SALDO FINAL PROJETADO
                                    </td>
                                    {cashFlow.months.map(m => (
                                        <td key={m.monthIndex} className={`p-4 text-center font-black text-sm ${m.saldoFinalProjetado >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                                            {formatCurrency(m.saldoFinalProjetado)}
                                        </td>
                                    ))}
                                </tr>

                                {/* SALDO FINAL REALIZADO (O que de fato tá na conta hoje) */}
                                <tr className="bg-slate-950">
                                    <td className="p-4 font-medium text-xs text-slate-500 sticky left-0 bg-slate-950 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                                        Saldo Final Realizado (Hoje)
                                    </td>
                                    {cashFlow.months.map(m => {
                                        // Só exibe se teve alguma movimentação realizada
                                        const showRealizado = m.saldoFinalRealizado !== m.saldoInicialRealizado || m.entradasRealizadas > 0 || m.saidasRealizadas > 0;
                                        return (
                                            <td key={m.monthIndex} className="p-4 text-center font-medium text-xs text-slate-500">
                                                {showRealizado ? formatCurrency(m.saldoFinalRealizado) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
