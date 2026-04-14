"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, XCircle, Download } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { api } from "@/lib/api";

const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function LossAnalysisPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        metrics: { totalPerdidas: number; valorPerdido: string; principalMotivo: string; taxaDePerda: number };
        reasons: Array<{ name: string; value: number; color: string }>;
        objections: Array<{ objection: string; count: number }>;
        lostByMonth: Array<{ month: string; perdas: number }>;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api<any>("/api/deals/reports/loss-analysis");
                if (result.success && result.data) setData(result.data);
            } catch (err) {
                console.error("Falha ao carregar análise de perdas", err);
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
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"><XCircle size={20} className="text-red-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Análise de Perdas</h1><p className="text-sm text-slate-400">Motivos de recusa, objeções e padrões de rejeição</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {isLoading || !data ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl h-24 animate-pulse"></div>)
                ) : (
                    [
                        { label: "Total Perdidas", value: data.metrics.totalPerdidas.toString(), color: "text-red-400" }, 
                        { label: "Valor Perdido", value: data.metrics.valorPerdido, color: "text-red-400" }, 
                        { label: "Principal Motivo", value: data.metrics.principalMotivo, color: "text-amber-400" }, 
                        { label: "Taxa de Perda", value: `${data.metrics.taxaDePerda}%`, color: "text-amber-400" }
                    ].map((k, i) => (
                        <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl overflow-hidden">
                            <span className={`text-xl font-bold block truncate ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Motivos da Recusa</h3>
                    {isLoading || !data ? (
                        <div className="h-[220px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : data.reasons.length === 0 ? (
                        <div className="h-[220px] flex items-center justify-center text-xs text-slate-500">Sem histórico motivacional.</div>
                    ) : (
                        <div className="flex items-center gap-6">
                            <div className="h-[220px] w-[220px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.reasons} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">{data.reasons.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={ts} /></PieChart></ResponsiveContainer></div>
                            <div className="flex-1 space-y-3">{data.reasons.map(r => (<div key={r.name} className="flex flex-wrap md:flex-nowrap items-center gap-3"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color }} /><span className="text-xs text-slate-300 flex-1 truncate max-w-[120px] md:max-w-none" title={r.name}>{r.name}</span><span className="text-sm font-bold text-white">{r.value}%</span><div className="w-16 md:w-20 bg-slate-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${r.value}%`, backgroundColor: r.color }} /></div></div>))}</div>
                        </div>
                    )}
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Evasão por Etapas (Drop-Ratio)</h3>
                    <div className="h-[280px]">
                        {isLoading || !data ? (
                            <div className="h-[220px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data.objections.length === 0 ? (
                            <div className="h-[220px] flex items-center justify-center text-xs text-slate-500">Sem histórico por etapas.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={data.objections} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="objection" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={100} /><Tooltip contentStyle={ts} /><Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} name="Ocorrências" /></BarChart></ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Evolução de Perdas (6 Meses)</h3>
                <div className="h-[240px]">
                    {isLoading || !data ? (
                        <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%"><BarChart data={data.lostByMonth}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="perdas" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Propostas Perdidas" /></BarChart></ResponsiveContainer>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
