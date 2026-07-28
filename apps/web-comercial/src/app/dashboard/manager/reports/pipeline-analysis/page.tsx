"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Target, Download, AlertTriangle, ArrowUp, ArrowDown, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Funnel, FunnelChart } from "recharts";
import { api } from "@/lib/api";

const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function PipelineAnalysisPage() {
    const [period, setPeriod] = useState("6m");
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        metrics: { totalPipeline: number; totalValue: string; avgDays: number; stagnatedCount: number; funnelRate: number; };
        funnelData: Array<{ name: string; value: number; fill: string; }>;
        stageTimeData: Array<{ stage: string; dias: number; }>;
        stagnatedDeals: Array<{ id: string; name: string; stage: string; days: number; value: string; consultant: string; }>;
    } | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                // Backend endpoint configured previously
                const result = await api<any>("/api/deals/reports/pipeline-analysis");
                if (result.success && result.data) {
                    setData(result.data);
                }
            } catch (err) {
                console.error("Falha ao carregar análise de pipeline", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalysis();
    }, []);
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/dashboard/manager/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"><ChevronLeft size={16} /><BarChart3 size={14} /><span>Relatórios</span></Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"><Target size={20} className="text-purple-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Análise de Pipeline</h1><p className="text-sm text-slate-400">Funil, tempo por etapa e deals estagnados</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {isLoading || !data ? (
                    // Loading skeleton for metrics
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl h-24 animate-pulse"></div>
                    ))
                ) : (
                    [
                        { label: "Total no Pipeline", value: data.metrics.totalPipeline.toString(), color: "text-purple-400" },
                        { label: "Valor Total", value: data.metrics.totalValue, color: "text-blue-400" },
                        { label: "Tempo Médio", value: `${data.metrics.avgDays} dias`, color: "text-amber-400" },
                        { label: "Estagnados", value: data.metrics.stagnatedCount.toString(), color: "text-red-400" },
                        { label: "Tax. Conversão", value: `${data.metrics.funnelRate}%`, color: "text-blue-400" },
                    ].map((k, i) => (
                        <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                            <span className={`text-xl font-bold block ${k.color}`}>{k.value}</span>
                            <span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Funil de Vendas</h3>
                    <div className="space-y-3">
                        {isLoading || !data ? (
                            <div className="h-40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data.funnelData.length === 0 ? (
                            <div className="text-xs text-slate-500 text-center py-10">Nenhum dado de funil encontrado.</div>
                        ) : (
                            data.funnelData.map((s, i) => (
                                <div key={s.name} className="flex items-center gap-3">
                                    <span className="text-[11px] text-slate-400 w-28 shrink-0 truncate" title={s.name}>{s.name}</span>
                                    <div className="flex-1 bg-slate-800/60 rounded-full h-8 relative overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(s.value / Math.max(...data.funnelData.map(f => f.value), 1)) * 100}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }} className="h-full rounded-full flex items-center justify-end pr-3" style={{ backgroundColor: s.fill }}>
                                            <span className="text-[11px] font-bold text-white">{s.value}</span>
                                        </motion.div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 w-12 text-right">{i > 0 && data.funnelData[i - 1].value > 0 ? `${((s.value / data.funnelData[i - 1].value) * 100).toFixed(0)}%` : s.value > 0 ? "100%" : "0%"}</span>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Tempo Médio por Etapa</h3>
                    <div className="h-[240px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data.stageTimeData.length === 0 ? (
                            <div className="text-xs text-slate-500 text-center py-10">Nenhum dado de tempo encontrado.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.stageTimeData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                    <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} unit=" dias" />
                                    <YAxis type="category" dataKey="stage" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={90} />
                                    <Tooltip contentStyle={ts} />
                                    <Bar dataKey="dias" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Dias" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Deals Estagnados (+7 dias sem movimentação)</h3>
                </div>
                <table className="w-full text-left">
                    <thead><tr className="border-b border-white/[0.04] bg-slate-900/50">
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Deal</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Etapa</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Dias Parado</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Advisor</th>
                    </tr></thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {isLoading || !data ? (
                            <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-sm">Carregando negócios...</td></tr>
                        ) : data.stagnatedDeals.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-sm">Excelente! Nenhum negócio estagnado no pipeline no momento.</td></tr>
                        ) : (
                            data.stagnatedDeals.map(d => (
                                <tr key={d.id} className="hover:bg-white/[0.02]">
                                    <td className="px-6 py-3 text-sm text-white font-medium">{d.name}</td>
                                    <td className="px-6 py-3"><span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-lg truncate block max-w-[150px]">{d.stage}</span></td>
                                    <td className="px-6 py-3 text-sm text-red-400 font-bold">{d.days} dias</td>
                                    <td className="px-6 py-3 text-sm text-white">{d.value}</td>
                                    <td className="px-6 py-3 text-sm text-slate-400">{d.consultant}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </motion.div>
        </div>
    );
}
