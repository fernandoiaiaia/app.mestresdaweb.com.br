"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Calendar, Loader2, Gauge, Zap, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { reportsService, ProjectVelocityRow } from "@/services/reports.service";

export default function ProjectVelocityPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<ProjectVelocityRow[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getProjectVelocity(year);
            if (res.success && res.data) {
                setData(res.data);
            }
            setIsLoading(false);
        };
        load();
    }, [year]);

    // Filtros e Agregações
    const activeProjects = data ? data.filter(p => p.completedTasks > 0) : [];
    
    const globalCompletedTasks = activeProjects.reduce((acc, p) => acc + p.completedTasks, 0);
    const globalLeadTime = activeProjects.length > 0 
        ? activeProjects.reduce((acc, p) => acc + p.avgLeadTime, 0) / activeProjects.length 
        : 0;

    const globalEstimated = activeProjects.reduce((acc, p) => acc + p.totalEstimated, 0);
    const globalLogged = activeProjects.reduce((acc, p) => acc + p.totalLogged, 0);
    
    const globalDeviation = globalEstimated > 0 
        ? ((globalLogged / globalEstimated) - 1) * 100 
        : 0;

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
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <Gauge size={24} className="text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Velocidade de Entrega (Velocity)</h1>
                            <p className="text-sm text-slate-400">Análise de eficiência da engenharia e precisão de estimativas de tempo.</p>
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
                    {/* KPI 1: Lead Time */}
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Clock size={80} className="text-blue-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                                <Zap size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Lead Time Médio</h3>
                        </div>
                        <div className="text-3xl font-black text-white relative z-10">
                            {globalLeadTime.toFixed(1)} <span className="text-lg font-bold text-slate-500">dias</span>
                        </div>
                        <div className="text-sm text-slate-500 mt-2 font-medium relative z-10">
                            Tempo médio entre a criação e a entrega da tarefa.
                        </div>
                    </div>

                    {/* KPI 2: Acurácia Global */}
                    <div className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden ${globalDeviation > 20 ? 'ring-1 ring-rose-500/30' : ''}`}>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className={`p-2.5 rounded-lg ${globalDeviation <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                <Gauge size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Desvio de Estimativa Global</h3>
                        </div>
                        <div className={`text-3xl font-black relative z-10 flex items-baseline gap-2 ${globalDeviation <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {globalDeviation > 0 ? '+' : ''}{globalDeviation.toFixed(1)}%
                            {globalDeviation > 20 && (
                                <span className="flex items-center gap-1 text-[11px] uppercase bg-rose-500/20 text-rose-400 px-2 py-1 rounded-md">
                                    <AlertTriangle size={12} /> Alerta
                                </span>
                            )}
                        </div>
                        <div className="text-sm mt-2 font-medium relative z-10">
                            <span className="text-slate-500">
                                {globalDeviation <= 0 
                                    ? "O time está entregando dentro do tempo orçado." 
                                    : "O time está gastando mais tempo do que foi orçado nas propostas."}
                            </span>
                        </div>
                    </div>

                    {/* KPI 3: Entregas */}
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400">
                                <CheckCircle2 size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Volume de Entregas</h3>
                        </div>
                        <div className="text-3xl font-black text-white">
                            {globalCompletedTasks} <span className="text-lg font-bold text-slate-500">tarefas</span>
                        </div>
                        <div className="text-sm font-medium mt-2 flex items-center gap-2">
                            <span className="text-slate-500">Total de tickets concluídos com sucesso.</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Tabela */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="animate-spin text-violet-500" />
                            <span className="text-sm font-bold text-violet-400 uppercase tracking-widest">Calculando Velocidade...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-slate-950 border-b border-white/[0.06] text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold">Projeto & Cliente</th>
                                <th className="p-4 font-bold text-center">Tarefas Concluídas</th>
                                <th className="p-4 font-bold text-right">Lead Time Médio</th>
                                <th className="p-4 font-bold w-64 text-center">Horas Logadas vs Estimadas</th>
                                <th className="p-4 font-bold text-right bg-white/[0.02]">Desvio de Prazo (Accuracy)</th>
                            </tr>
                        </thead>
                        {activeProjects && activeProjects.length > 0 ? (
                            <tbody>
                                {activeProjects.map((row) => {
                                    const overBudget = row.estimationDeviation > 0;
                                    
                                    // Cálculo de progresso para a barra
                                    // Se estimou 100 e fez 50, a barra verde vai até 50%.
                                    // Se estimou 100 e fez 150, a barra verde vai até 100% e a vermelha avança 50%.
                                    const maxHours = Math.max(row.totalEstimated, row.totalLogged) || 1;
                                    const estimatedPct = (row.totalEstimated / maxHours) * 100;
                                    const loggedPct = (row.totalLogged / maxHours) * 100;

                                    return (
                                        <tr key={row.projectId} className="border-b border-white/[0.02] hover:bg-slate-800/50 transition-colors group">
                                            {/* Projeto Info */}
                                            <td className="p-4">
                                                <div className="font-bold text-sm text-slate-200">{row.projectName}</div>
                                                <div className="text-xs text-slate-500">{row.clientName}</div>
                                            </td>

                                            {/* Tarefas */}
                                            <td className="p-4 text-center">
                                                <div className="inline-block px-3 py-1 bg-slate-900 text-violet-400 border border-violet-500/20 rounded-lg text-xs font-bold">
                                                    {row.completedTasks}
                                                </div>
                                            </td>

                                            {/* Lead Time */}
                                            <td className="p-4 text-right">
                                                <div className="text-[14px] font-bold text-slate-300 flex items-center justify-end gap-1.5">
                                                    <Clock size={14} className="text-slate-500" />
                                                    {row.avgLeadTime.toFixed(1)} dias
                                                </div>
                                            </td>

                                            {/* Horas */}
                                            <td className="p-4 w-64 align-middle">
                                                <div className="flex flex-col gap-1.5 w-full max-w-[200px] mx-auto">
                                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                                                        <span className="text-slate-400">Logado: <span className="text-white">{row.totalLogged.toFixed(1)}h</span></span>
                                                        <span className="text-slate-500">Est: {row.totalEstimated.toFixed(1)}h</span>
                                                    </div>
                                                    
                                                    {/* Barra Visual */}
                                                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden relative">
                                                        {/* Marcador do Estimado (Meta) */}
                                                        <div 
                                                            className="absolute top-0 bottom-0 border-r-2 border-white/30 z-10"
                                                            style={{ width: `${estimatedPct}%` }}
                                                        ></div>
                                                        
                                                        {/* Preenchimento do Logado */}
                                                        <div 
                                                            className={`h-full absolute left-0 top-0 bottom-0 ${overBudget ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                                            style={{ width: `${loggedPct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Desvio */}
                                            <td className="p-4 text-right bg-white/[0.01]">
                                                <div className={`text-[15px] font-black flex items-center justify-end gap-2 ${overBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {overBudget ? <TrendingUp size={16} className="text-rose-500" /> : <TrendingDown size={16} className="text-emerald-500" />}
                                                    {overBudget ? '+' : ''}{row.estimationDeviation.toFixed(1)}%
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
                                        <td colSpan={5} className="p-8 text-center text-slate-500">
                                            Nenhuma tarefa concluída foi encontrada para cálculo de velocidade.
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
