"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, DollarSign, Download, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";

const revenueData = [
    { month: "Set", realizado: 280000, forecast: 300000 }, { month: "Out", realizado: 420000, forecast: 380000 },
    { month: "Nov", realizado: 380000, forecast: 400000 }, { month: "Dez", realizado: 310000, forecast: 350000 },
    { month: "Jan", realizado: 520000, forecast: 450000 }, { month: "Fev", realizado: 485000, forecast: 500000 },
    { month: "Mar", realizado: 620000, forecast: 550000 },
];
const cumulativeData = [
    { month: "Set", acumulado: 280000, meta: 350000 }, { month: "Out", acumulado: 700000, meta: 700000 },
    { month: "Nov", acumulado: 1080000, meta: 1050000 }, { month: "Dez", acumulado: 1390000, meta: 1400000 },
    { month: "Jan", acumulado: 1910000, meta: 1750000 }, { month: "Fev", acumulado: 2395000, meta: 2100000 },
    { month: "Mar", acumulado: 3015000, meta: 2450000 },
];
const bySegment = [
    { segment: "Tecnologia", valor: 1200000 }, { segment: "Saúde", valor: 650000 },
    { segment: "Educação", valor: 480000 }, { segment: "Varejo", valor: 385000 }, { segment: "Outros", valor: 300000 },
];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };
const fmt = (v: number) => `R$ ${(v / 1000).toFixed(0)}k`;

export default function RevenueForecastPage() {
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
                {[
                    { label: "Receita Total", value: "R$ 3.0M", change: "+22%", up: true, color: "text-blue-400" },
                    { label: "Forecast Mês Atual", value: "R$ 680k", change: "+10%", up: true, color: "text-blue-400" },
                    { label: "Receita Média/Mês", value: "R$ 431k", change: "+15%", up: true, color: "text-purple-400" },
                    { label: "Crescimento MoM", value: "+28%", change: "+5pp", up: true, color: "text-amber-400" },
                ].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <div className="flex items-center justify-between mb-2"><span className={`text-[10px] uppercase tracking-widest text-slate-600`}>{k.label}</span><span className={`text-[10px] font-bold ${k.up ? "text-blue-400" : "text-red-400"}`}>{k.up ? <ArrowUp size={10} className="inline" /> : <ArrowDown size={10} className="inline" />} {k.change}</span></div>
                        <span className={`text-xl font-bold block ${k.color}`}>{k.value}</span>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Realizado vs Forecast</h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
                                <Tooltip contentStyle={ts} formatter={(v: any) => [fmt(Number(v))]} />
                                <Bar dataKey="forecast" fill="#1e293b" name="Forecast" radius={[3, 3, 0, 0]} stroke="#334155" strokeWidth={1} />
                                <Bar dataKey="realizado" fill="#22c55e" name="Realizado" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Receita Acumulada vs Meta</h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cumulativeData}>
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
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Receita por Segmento</h3>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bySegment} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                            <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
                            <YAxis type="category" dataKey="segment" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={90} />
                            <Tooltip contentStyle={ts} formatter={(v: any) => [`R$ ${(Number(v) / 1000).toFixed(0)}k`]} />
                            <Bar dataKey="valor" fill="#22c55e" radius={[0, 4, 4, 0]} name="Receita" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
