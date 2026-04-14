"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, CalendarDays, Download, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { api } from "@/lib/api";

const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function PeriodSummaryPage() {
    const [view, setView] = useState<"week" | "month">("month");
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        kpis: Array<{ label: string; value: string; change: string; up: boolean; color: string }>;
        weeklyData: Array<{ week: string; propostas: number; deals: number; tarefas: number; leads: number }>;
        dailyRevenue: Array<{ day: string; valor: number }>;
        highlights: { melhorAdvisor: string; produtoDestaque: string; cadenciaTop: string; };
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api<any>("/api/deals/reports/period-summary");
                if (result.success && result.data) setData(result.data);
            } catch (err) {
                console.error("Falha ao carregar Sumário Executivo", err);
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
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center"><CalendarDays size={20} className="text-teal-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Resumo por Período</h1><p className="text-sm text-slate-400">Dashboard executivo com KPIs consolidados</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1 p-1 bg-slate-800/50 border border-white/[0.06] rounded-xl">
                            <button onClick={() => setView("week")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "week" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-slate-500 hover:text-white"}`}>Semanal</button>
                            <button onClick={() => setView("month")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "month" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-slate-500 hover:text-white"}`}>Mensal</button>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                    </div>
                </div>
            </motion.div>

            {/* Executive KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {isLoading || !data ? (
                    Array.from({length: 6}).map((_, i) => <div key={i} className="h-20 bg-slate-800/60 rounded-xl animate-pulse"></div>)
                ) : (
                    data.kpis.map((k, i) => (
                        <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                            <div className="flex items-center justify-between mb-1"><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span></div>
                            <div className="flex items-end justify-between"><span className={`text-lg font-bold ${k.color}`}>{k.value}</span><span className={`text-[10px] whitespace-nowrap font-bold ${k.up ? "text-blue-400" : "text-red-400"}`}>{k.up ? <ArrowUp size={9} className="inline" /> : <ArrowDown size={9} className="inline" />} {k.change}</span></div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Atividade Semanal (Mês Vigente)</h3>
                    <div className="h-[280px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={data.weeklyData}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="week" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="propostas" fill="#3b82f6" name="Oportunidades Avançadas" radius={[3, 3, 0, 0]} /><Bar dataKey="deals" fill="#22c55e" name="Novos Fechamentos" radius={[3, 3, 0, 0]} /><Bar dataKey="leads" fill="#06b6d4" name="Volume Geração" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Receita Histórica Acumulada no Mês</h3>
                    <div className="h-[280px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.dailyRevenue}><defs><linearGradient id="ps" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} /><stop offset="95%" stopColor="#14b8a6" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} /><Tooltip contentStyle={ts} formatter={(v: any) => [`R$ ${Number(v).toLocaleString("pt-BR")}`, "Acumulado"]} labelFormatter={label => `Dia ${label}`} /><Area type="monotone" dataKey="valor" stroke="#14b8a6" fill="url(#ps)" strokeWidth={2} /></AreaChart></ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Quick Summary Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-teal-400" /> Destaques Coroados deste Período</h3>
                {isLoading || !data ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="h-20 bg-slate-800/60 rounded-xl animate-pulse"></div><div className="h-20 bg-slate-800/60 rounded-xl animate-pulse"></div><div className="h-20 bg-slate-800/60 rounded-xl animate-pulse"></div></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl"><span className="text-[10px] text-blue-400 font-bold uppercase block mb-1">🏆 Melhor Advisor</span><span className="text-sm text-white font-medium">{data.highlights.melhorAdvisor}</span></div>
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl"><span className="text-[10px] text-blue-400 font-bold uppercase block mb-1">📈 Funil em Alta</span><span className="text-sm text-white font-medium">{data.highlights.produtoDestaque}</span></div>
                        <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl"><span className="text-[10px] text-purple-400 font-bold uppercase block mb-1">⚡ Canal Touchpoint</span><span className="text-sm text-white font-medium">{data.highlights.cadenciaTop}</span></div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
