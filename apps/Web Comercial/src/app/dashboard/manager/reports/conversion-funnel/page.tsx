"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, PieChart as PieChartIcon, Download, ArrowRight } from "lucide-react";

const funnelSteps = [
    { name: "Leads Gerados", value: 430, color: "#3b82f6", rate: "100%" },
    { name: "Leads Qualificados", value: 197, color: "#8b5cf6", rate: "46%" },
    { name: "Oportunidades Abertas", value: 120, color: "#f59e0b", rate: "61%" },
    { name: "Propostas Enviadas", value: 95, color: "#22c55e", rate: "79%" },
    { name: "Em Negociação", value: 52, color: "#06b6d4", rate: "55%" },
    { name: "Negócios Fechados", value: 35, color: "#16a34a", rate: "67%" },
];

export default function ConversionFunnelPage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/dashboard/manager/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"><ChevronLeft size={16} /><BarChart3 size={14} /><span>Relatórios</span></Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center"><PieChartIcon size={20} className="text-pink-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Funil de Conversão Geral</h1><p className="text-sm text-slate-400">Conversão end-to-end: Lead → Negócio Fechado</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {[{ label: "Conversão Total End-to-End", value: "8.1%", color: "text-pink-400" }, { label: "Melhor Conversão (Etapa)", value: "Proposta→Negociação (79%)", color: "text-blue-400" }, { label: "Pior Conversão (Etapa)", value: "Lead→Qualificado (46%)", color: "text-amber-400" }].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl"><span className={`text-lg font-bold block ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span></motion.div>
                ))}
            </div>

            {/* Visual Funnel */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-8 mb-6">
                <h3 className="text-sm font-bold text-slate-300 mb-8 text-center">Funil Completo</h3>
                <div className="max-w-2xl mx-auto space-y-3">
                    {funnelSteps.map((step, i) => {
                        const widthPct = (step.value / funnelSteps[0].value) * 100;
                        return (
                            <motion.div key={step.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.08 }}>
                                <div className="flex items-center gap-4">
                                    <span className="text-[11px] text-slate-400 w-40 shrink-0 text-right">{step.name}</span>
                                    <div className="flex-1 relative">
                                        <div className="bg-slate-800/60 rounded-full h-10 overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${widthPct}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.7 }} className="h-full rounded-full flex items-center justify-center relative" style={{ backgroundColor: step.color, minWidth: "60px" }}>
                                                <span className="text-xs font-bold text-white">{step.value}</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold w-12 shrink-0" style={{ color: step.color }}>{step.rate}</span>
                                </div>
                                {i < funnelSteps.length - 1 && (
                                    <div className="flex items-center gap-4 py-1"><span className="w-40" /><div className="flex-1 flex justify-center"><ArrowRight size={14} className="text-slate-700 rotate-90" /></div><span className="w-12" /></div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Bottlenecks */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Análise de Gargalos</h3>
                <div className="space-y-3">
                    {funnelSteps.slice(0, -1).map((step, i) => {
                        const next = funnelSteps[i + 1];
                        const dropoff = step.value - next.value;
                        const dropPct = ((dropoff / step.value) * 100).toFixed(0);
                        return (
                            <div key={i} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl">
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-[11px] text-slate-400">{step.name}</span><ArrowRight size={12} className="text-slate-600" /><span className="text-[11px] text-slate-400">{next.name}</span>
                                </div>
                                <span className="text-[11px] text-red-400 font-bold">-{dropoff} ({dropPct}%)</span>
                                <div className="w-32 bg-slate-800 rounded-full h-2"><div className="h-2 rounded-full bg-red-500/60" style={{ width: `${dropPct}%` }} /></div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
