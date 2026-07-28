"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Calendar, Loader2, Filter, Target, TrendingUp, Clock, DollarSign, BadgePercent } from "lucide-react";
import { reportsService, SalesFunnelData } from "@/services/reports.service";

export default function SalesFunnelPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [funnelId, setFunnelId] = useState<string>('');
    const [data, setData] = useState<SalesFunnelData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getSalesFunnel(year, funnelId || undefined);
            if (res.success && res.data) {
                setData(res.data);
                // Define o funil default caso o estado local esteja vazio e a API retornou um selecionado
                if (!funnelId && res.data.selectedFunnelId) {
                    setFunnelId(res.data.selectedFunnelId);
                }
            }
            setIsLoading(false);
        };
        load();
    }, [year, funnelId]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getMaxStageValue = () => {
        if (!data || data.stagesSnapshot.length === 0) return 1;
        return Math.max(...data.stagesSnapshot.map(s => s.value));
    };
    
    const maxStageValue = getMaxStageValue() || 1; // Para evitar divisão por 0 na barra

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
                        <span className="text-slate-300 text-sm font-medium">Funil de Vendas</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Filter size={24} className="text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Funil de Vendas e Conversão</h1>
                            <p className="text-sm text-slate-400">Desempenho da máquina de vendas e oportunidades estagnadas.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/80 p-2 rounded-2xl border border-white/5">
                    {/* Seletor de Funil */}
                    {data && data.funnels.length > 0 && (
                        <div className="relative">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <select 
                                value={funnelId}
                                onChange={(e) => setFunnelId(e.target.value)}
                                className="pl-9 pr-8 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl border border-white/10 focus:outline-none appearance-none"
                            >
                                {data.funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="h-8 w-px bg-white/10 mx-1"></div>
                    
                    {/* Seletor de Ano */}
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

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 size={40} className="animate-spin text-orange-500" />
                    <span className="text-sm font-bold text-orange-400 uppercase tracking-widest">Processando Vendas...</span>
                </div>
            )}

            {!isLoading && data && (
                <div className="space-y-8">
                    {/* KPIs de Desempenho Global */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                                <BadgePercent size={48} className="text-orange-400" />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Win Rate (Conversão)</span>
                            <div className="text-3xl font-black text-white mt-2">
                                {data.metrics.winRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-500 mt-1 font-medium">De {data.metrics.wonCount + data.metrics.lostCount} negócios fechados</div>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <TrendingUp size={48} className="text-emerald-500" />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider">Vendas Ganhas (YTD)</span>
                            <div className="text-3xl font-black text-emerald-400 mt-2">
                                {formatCurrency(data.metrics.wonValue)}
                            </div>
                            <div className="text-xs text-emerald-500/60 mt-1 font-medium">{data.metrics.wonCount} negócios fechados</div>
                        </div>

                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                                <DollarSign size={48} className="text-blue-400" />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ticket Médio</span>
                            <div className="text-3xl font-black text-white mt-2">
                                {formatCurrency(data.metrics.ticketMedio)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 font-medium">Por negócio ganho</div>
                        </div>

                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                                <Clock size={48} className="text-purple-400" />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ciclo de Vendas</span>
                            <div className="text-3xl font-black text-white mt-2">
                                {data.metrics.cicloVendasDias.toFixed(0)} <span className="text-lg text-slate-500">dias</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 font-medium">Para fechamento</div>
                        </div>
                    </motion.div>

                    {/* Gráfico do Funil de Oportunidades Abertas */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-8">
                        <div className="flex items-center gap-2 mb-8">
                            <Target size={20} className="text-orange-400" />
                            <h2 className="text-lg font-bold text-white">Snapshot do Funil (Oportunidades Abertas)</h2>
                        </div>

                        {data.stagesSnapshot.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">Nenhum estágio configurado ou negócio aberto neste funil.</div>
                        ) : (
                            <div className="space-y-4 max-w-4xl mx-auto">
                                {data.stagesSnapshot.map((stage, idx) => {
                                    const widthPercent = (stage.value / maxStageValue) * 100 || 2; // minimo de 2% para ficar visível se houver count
                                    // Fallbacks para cores em bg do tailwind
                                    const colorMap: any = {
                                        blue: 'bg-blue-500', emerald: 'bg-emerald-500', rose: 'bg-rose-500', 
                                        orange: 'bg-orange-500', purple: 'bg-purple-500', amber: 'bg-amber-500', slate: 'bg-slate-500'
                                    };
                                    const bgColor = colorMap[stage.color] || 'bg-indigo-500';

                                    return (
                                        <div key={stage.stageId} className="flex items-center gap-6 group">
                                            {/* Nome do Estágio */}
                                            <div className="w-48 text-right shrink-0">
                                                <div className="text-sm font-bold text-slate-200">{stage.name}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{stage.count} negócio(s)</div>
                                            </div>

                                            {/* Barra do Funil */}
                                            <div className="flex-1 bg-slate-900/50 rounded-full h-10 overflow-hidden border border-white/[0.02] flex items-center shadow-inner relative">
                                                <motion.div 
                                                    initial={{ width: 0 }} 
                                                    animate={{ width: `${stage.value === 0 && stage.count === 0 ? 0 : Math.max(widthPercent, 5)}%` }} 
                                                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                    className={`h-full ${bgColor} flex items-center justify-end px-4`}
                                                >
                                                </motion.div>
                                                <div className="absolute left-4 text-sm font-black text-white mix-blend-difference drop-shadow-md">
                                                    {formatCurrency(stage.value)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        <div className="mt-10 pt-6 border-t border-white/[0.06] text-center text-xs text-slate-500 font-medium max-w-4xl mx-auto">
                            O Snapshot acima reflete o pipeline atual em tempo real (negócios abertos). Valores mostram a projeção financeira presa em cada fase aguardando fechamento.
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
