"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Clock, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { api } from "@/lib/api";

const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function SalesCyclePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        metrics: { cicloMedioAtual: number; melhorMes: { month: string; dias: number }; piorMes: { month: string; dias: number }; reducao: number };
        cycleData: Array<{ month: string; dias: number }>;
        bySegment: Array<{ segment: string; dias: number }>;
        byFunnel: Array<{ product: string; dias: number }>;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api<any>("/api/deals/reports/sales-cycle");
                if (result.success && result.data) setData(result.data);
            } catch (err) {
                console.error("Falha ao carregar sales cycle", err);
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
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><Clock size={20} className="text-amber-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Ciclo de Vendas</h1><p className="text-sm text-slate-400">Tempo médio do primeiro contato à aprovação</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {isLoading || !data ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl h-24 animate-pulse"></div>)
                ) : (
                    [
                        { label: "Ciclo Médio Atual", value: `${data.metrics.cicloMedioAtual} dias`, color: "text-amber-400" }, 
                        { label: "Melhor Mês", value: `${data.metrics.melhorMes.month} (${data.metrics.melhorMes.dias}d)`, color: "text-blue-400" }, 
                        { label: "Pior Mês", value: `${data.metrics.piorMes.month} (${data.metrics.piorMes.dias}d)`, color: "text-red-400" }, 
                        { label: data.metrics.reducao <= 0 ? "Redução" : "Aumento", value: `${data.metrics.reducao > 0 ? '+' : ''}${data.metrics.reducao}%`, color: data.metrics.reducao <= 0 ? "text-blue-400" : "text-red-400" }
                    ].map((k, i) => (
                        <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                            <span className={`text-xl font-bold block ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span>
                        </motion.div>
                    ))
                )}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Evolução do Ciclo de Vendas</h3>
                <div className="h-[280px]">
                    {isLoading || !data ? (
                        <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%"><LineChart data={data.cycleData}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} unit=" dias" /><Tooltip contentStyle={ts} /><Line type="monotone" dataKey="dias" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }} name="Dias" /></LineChart></ResponsiveContainer>
                    )}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Ciclo por Segmento</h3>
                    <div className="h-[240px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data.bySegment.length === 0 ? (
                            <div className="text-xs text-slate-500 text-center py-10">Nenhum fechamento registrado para calcular.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={data.bySegment} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} unit=" dias" /><YAxis type="category" dataKey="segment" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={85} /><Tooltip contentStyle={ts} /><Bar dataKey="dias" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Dias" /></BarChart></ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Ciclo por Módulo / Funil</h3>
                    <div className="h-[240px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data.byFunnel.length === 0 ? (
                            <div className="text-xs text-slate-500 text-center py-10">Nenhum fechamento registrado.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={data.byFunnel} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} unit=" dias" /><YAxis type="category" dataKey="product" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={110} /><Tooltip contentStyle={ts} /><Bar dataKey="dias" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Dias" /></BarChart></ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
