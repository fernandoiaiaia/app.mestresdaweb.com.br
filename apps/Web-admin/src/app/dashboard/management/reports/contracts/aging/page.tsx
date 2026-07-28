"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Calendar, Loader2, Hourglass, Activity, AlertOctagon, Timer, PenTool } from "lucide-react";
import { reportsService, ContractsAgingData } from "@/services/reports.service";

export default function ContractsAgingPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<ContractsAgingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getContractsAging(year);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'sent': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'signing': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'Rascunho';
            case 'review': return 'Em Revisão';
            case 'sent': return 'Enviado ao Cliente';
            case 'signing': return 'Aguard. Assinaturas';
            default: return status;
        }
    };

    const buckets = data?.buckets || { '0-7': 0, '8-15': 0, '16-30': 0, '31+': 0 };
    const totalPending = Object.values(buckets).reduce((a, b) => a + b, 0);

    const calcBucketPct = (val: number) => totalPending > 0 ? (val / totalPending) * 100 : 0;

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
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                            <Hourglass size={24} className="text-rose-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Aging de Pipeline Contratual</h1>
                            <p className="text-sm text-slate-400">Tempo de ciclo (Lead Time) e rastreamento de contratos estagnados.</p>
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
                    {/* KPI 1: Lead Time Médio */}
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Timer size={80} className="text-blue-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                                <PenTool size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Lead Time Jurídico</h3>
                        </div>
                        <div className="text-3xl font-black text-white relative z-10">
                            {data.avgLeadTime.toFixed(1)} <span className="text-lg font-bold text-slate-500">dias</span>
                        </div>
                        <div className="text-sm text-slate-500 mt-2 font-medium relative z-10">
                            Tempo médio histórico para obter todas as assinaturas.
                        </div>
                    </div>

                    {/* KPI 2: Saúde do Funil */}
                    <div className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 ${data.healthyPercentage < 50 ? 'ring-1 ring-rose-500/30' : ''}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-lg ${data.healthyPercentage >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                <Activity size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Saúde do Pipeline</h3>
                        </div>
                        <div className={`text-3xl font-black ${data.healthyPercentage >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {data.healthyPercentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-500 mt-2 font-medium">
                            Contratos pendentes que estão dentro de um prazo saudável (menos de 15 dias).
                        </div>
                    </div>

                    {/* KPI 3: Críticos */}
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400">
                                <AlertOctagon size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-rose-400/80 uppercase tracking-wider">Gargalos Críticos</h3>
                        </div>
                        <div className="text-3xl font-black text-white">
                            {buckets['31+']} <span className="text-lg font-bold text-rose-500/50">contratos</span>
                        </div>
                        <div className="text-sm font-medium mt-2 text-rose-400/80">
                            Estagnados há mais de 30 dias na base.
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Aging Buckets (Gráfico Visual) */}
                <div className="lg:col-span-1 bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 flex flex-col">
                    <h2 className="text-lg font-bold text-white mb-6">Distribuição de Idade (Aging)</h2>
                    
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-rose-500" />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-6 justify-center">
                            {/* Bucket 1 */}
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-emerald-400">0 a 7 dias (Saudável)</span>
                                    <span className="text-white">{buckets['0-7']}</span>
                                </div>
                                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${calcBucketPct(buckets['0-7'])}%` }}></div>
                                </div>
                            </div>
                            {/* Bucket 2 */}
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-blue-400">8 a 15 dias (Atenção)</span>
                                    <span className="text-white">{buckets['8-15']}</span>
                                </div>
                                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${calcBucketPct(buckets['8-15'])}%` }}></div>
                                </div>
                            </div>
                            {/* Bucket 3 */}
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-amber-400">16 a 30 dias (Alerta)</span>
                                    <span className="text-white">{buckets['16-30']}</span>
                                </div>
                                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: `${calcBucketPct(buckets['16-30'])}%` }}></div>
                                </div>
                            </div>
                            {/* Bucket 4 */}
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-rose-400">Mais de 30 dias (Crítico)</span>
                                    <span className="text-white">{buckets['31+']}</span>
                                </div>
                                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500" style={{ width: `${calcBucketPct(buckets['31+'])}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabela de Gargalos */}
                <div className="lg:col-span-2 bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="animate-spin text-rose-500" />
                                <span className="text-sm font-bold text-rose-400 uppercase tracking-widest">Processando...</span>
                            </div>
                        </div>
                    )}

                    <div className="p-6 border-b border-white/[0.06]">
                        <h2 className="text-lg font-bold text-white">Lista de Gargalos (Radar de Atrasos)</h2>
                        <p className="text-sm text-slate-400">Contratos pendentes ordenados do mais velho para o mais novo.</p>
                    </div>

                    <div className="overflow-y-auto max-h-[500px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-white/[0.06] z-10">
                                <tr className="text-xs uppercase tracking-wider text-slate-500">
                                    <th className="p-4 font-bold">Nº / Cliente</th>
                                    <th className="p-4 font-bold">Valor (R$)</th>
                                    <th className="p-4 font-bold text-center">Status Atual</th>
                                    <th className="p-4 font-bold text-right">Idade no Pipeline</th>
                                </tr>
                            </thead>
                            {data && data.agingContracts.length > 0 ? (
                                <tbody>
                                    {data.agingContracts.map((row) => {
                                        const isCritical = row.ageInDays > 30;
                                        
                                        return (
                                            <tr key={row.id} className="border-b border-white/[0.02] hover:bg-slate-800/50 transition-colors group">
                                                <td className="p-4">
                                                    <div className="font-bold text-sm text-slate-200">#{row.number}</div>
                                                    <div className="text-xs text-slate-500">{row.contractorName}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-[14px] font-bold text-slate-300">
                                                        {formatCurrency(row.value)}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-block px-3 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(row.status)}`}>
                                                        {getStatusLabel(row.status)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className={`text-[15px] font-black flex items-center justify-end gap-2 ${isCritical ? 'text-rose-500' : 'text-slate-300'}`}>
                                                        {isCritical && <AlertOctagon size={16} className="text-rose-500" />}
                                                        {row.ageInDays} dias
                                                    </div>
                                                    {isCritical && (
                                                        <div className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest mt-0.5">
                                                            Risco de Perda
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            ) : (
                                !isLoading && (
                                    <tbody>
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-500">
                                                Nenhum contrato pendente encontrado. Seu pipeline está limpo! 🎉
                                            </td>
                                        </tr>
                                    </tbody>
                                )
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
