"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, DollarSign, Download, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";
import { api } from "@/lib/api";

const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };
const fmt = (v: number) => `R$ ${(v / 1000).toFixed(0)}k`;

export default function RevenueForecastPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        metrics: { receitaTotal: number; forecastMesAtual: number; receitaMediaMes: number; crescimentoMoM: number };
        revenueData: Array<{ month: string; realizado: number; forecast: number }>;
        cumulativeData: Array<{ month: string; acumulado: number; meta: number }>;
        bySegment: Array<{ segment: string; valor: number }>;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api<any>("/api/deals/reports/revenue-forecast");
                if (result.success && result.data) setData(result.data);
            } catch (err) {
                console.error("Falha ao carregar revenue forecast", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/dashboard/manager/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"><ChevronLeft size={16} /><BarChart3 size={14} /><span>Relatórios</span></Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><DollarSign size={20} className="text-blue-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Receita & Forecast</h1><p className="text-sm text-slate-400">Receita realizada, projeção e comparativo com metas</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {isLoading || !data ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl h-24 animate-pulse"></div>)
                ) : (
                    [
                        { label: "Receita Total", value: `R$ ${(data.metrics.receitaTotal / 1000000).toFixed(2)}M`, change: "+22%", up: true, color: "text-blue-400" },
                        { label: "Forecast Mês Atual", value: `R$ ${(data.metrics.forecastMesAtual / 1000).toFixed(0)}k`, change: "+10%", up: true, color: "text-blue-400" },
                        { label: "Receita Média/Mês", value: `R$ ${(data.metrics.receitaMediaMes / 1000).toFixed(0)}k`, change: "+15%", up: true, color: "text-purple-400" },
                        { label: "Crescimento MoM", value: `${data.metrics.crescimentoMoM}%`, change: "", up: data.metrics.crescimentoMoM >= 0, color: data.metrics.crescimentoMoM >= 0 ? "text-amber-400" : "text-red-400" },
                    ].map((k, i) => (
                        <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                            <div className="flex items-center justify-between mb-2"><span className={`text-[10px] uppercase tracking-widest text-slate-600`}>{k.label}</span><span className={`text-[10px] font-bold ${k.up ? "text-blue-400" : "text-red-400"}`}>{k.up ? <ArrowUp size={10} className="inline" /> : <ArrowDown size={10} className="inline" />} {k.change}</span></div>
                            <span className={`text-xl font-bold block ${k.color}`}>{k.value}</span>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Realizado vs Forecast</h3>
                    <div className="h-[280px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
                                    <Tooltip contentStyle={ts} formatter={(v: any) => [fmt(Number(v))]} />
                                    <Bar dataKey="forecast" fill="#1e293b" name="Forecast" radius={[3, 3, 0, 0]} stroke="#334155" strokeWidth={1} />
                                    <Bar dataKey="realizado" fill="#22c55e" name="Realizado" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Receita Acumulada vs Meta</h3>
                    <div className="h-[280px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.cumulativeData}>
                                    <defs>
                                        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                                    <Tooltip contentStyle={ts} formatter={(v: any) => [fmt(Number(v))]} />
                                    <Line type="monotone" dataKey="meta" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" name="Meta" dot={false} />
                                    <Area type="monotone" dataKey="acumulado" stroke="#22c55e" fill="url(#rg)" strokeWidth={2} name="Acumulado" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Receita por Segmento</h3>
                <div className="h-[250px]">
                    {isLoading || !data ? (
                        <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : data.bySegment.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-10">Nenhum segmento faturado.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.bySegment} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
                                <YAxis type="category" dataKey="segment" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={90} />
                                <Tooltip contentStyle={ts} formatter={(v: any) => [`R$ ${(Number(v) / 1000).toFixed(0)}k`]} />
                                <Bar dataKey="valor" fill="#22c55e" radius={[0, 4, 4, 0]} name="Receita" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
