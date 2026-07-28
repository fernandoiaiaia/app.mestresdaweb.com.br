"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Calendar, Loader2, Repeat, Banknote, ShieldCheck, PieChart } from "lucide-react";
import { reportsService, ContractsMRRData } from "@/services/reports.service";

export default function ContractsMRRPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<ContractsMRRData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getContractsMRR(year);
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

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // Calcula KPIs
    const timeline = data?.timeline || [];
    const tcv = timeline.reduce((acc, curr) => acc + curr.value, 0);
    const mrrAvg = timeline.length > 0 ? tcv / 12 : 0; // Usamos 12 meses pro ano
    const activeContractsCount = data?.activeContractsCount || 0;

    const maxMRRMonth = timeline.length > 0 
        ? [...timeline].sort((a, b) => b.value - a.value)[0] 
        : null;

    const maxValue = timeline.length > 0 ? Math.max(...timeline.map(m => m.value)) || 1 : 1;

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
                        <span className="text-slate-300 text-sm font-medium">Contratos</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Repeat size={24} className="text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Receita Recorrente & Mensalidades (MRR)</h1>
                            <p className="text-sm text-slate-400">Projeção de fluxo de caixa garantido por contratos ativos.</p>
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
                    {/* KPI 1: TCV */}
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400">
                                <Banknote size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Contract Value (TCV)</h3>
                        </div>
                        <div className="text-3xl font-black text-white">
                            {formatCurrency(tcv)}
                        </div>
                        <div className="text-sm text-slate-500 mt-2 font-medium">
                            Montante total faturável no ano através dos contratos.
                        </div>
                    </div>

                    {/* KPI 2: MRR Médio */}
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <PieChart size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">MRR Mensal Projetado</h3>
                        </div>
                        <div className="text-3xl font-black text-emerald-400">
                            {formatCurrency(mrrAvg)} <span className="text-lg font-bold text-slate-500">/mês</span>
                        </div>
                        <div className="text-sm font-medium mt-2 flex items-center gap-2 text-slate-500">
                            Média financeira mês a mês garantida.
                        </div>
                    </div>

                    {/* KPI 3: Contratos Ativos */}
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck size={80} className="text-orange-500" />
                        </div>
                        <div className="z-10 relative">
                            <h3 className="text-xs font-bold text-orange-400/80 uppercase tracking-wider mb-2">Segurança Contratual</h3>
                            <div className="text-3xl font-black text-white flex items-baseline gap-2">
                                {activeContractsCount} <span className="text-lg font-bold text-slate-400">contratos ativos</span>
                            </div>
                            {maxMRRMonth && maxMRRMonth.value > 0 && (
                                <div className="mt-3 text-sm font-medium text-orange-400/90">
                                    Pico em <strong className="text-orange-400">{monthNames[maxMRRMonth.month - 1]}</strong> ({formatCurrency(maxMRRMonth.value)})
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Timeline MRR Table */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative p-6">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="animate-spin text-orange-500" />
                            <span className="text-sm font-bold text-orange-400 uppercase tracking-widest">Calculando Projeção...</span>
                        </div>
                    </div>
                )}

                <h2 className="text-lg font-bold text-white mb-6">Timeline de Entradas (Jan a Dez)</h2>

                <div className="space-y-4">
                    {timeline && timeline.map((row) => {
                        const progress = (row.value / maxValue) * 100 || 0;
                        const isPeak = maxMRRMonth?.month === row.month && row.value > 0;

                        return (
                            <div key={row.month} className="flex items-center gap-4">
                                <div className="w-24 text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    {monthNames[row.month - 1].substring(0, 3)}
                                </div>
                                <div className="flex-1">
                                    <div className="h-8 bg-slate-900 rounded-lg overflow-hidden relative group">
                                        <div 
                                            className={`h-full absolute left-0 top-0 bottom-0 transition-all duration-1000 ${isPeak ? 'bg-orange-500' : 'bg-slate-600 group-hover:bg-orange-500/50'}`} 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                        <div className="absolute inset-0 flex items-center px-4 justify-between">
                                            <span className="text-xs font-bold text-white/90 drop-shadow-md z-10">
                                                {row.count > 0 ? `${row.count} recebimentos previstos` : 'Nenhuma entrada prevista'}
                                            </span>
                                            <span className="text-[13px] font-black text-white drop-shadow-md z-10">
                                                {formatCurrency(row.value)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
