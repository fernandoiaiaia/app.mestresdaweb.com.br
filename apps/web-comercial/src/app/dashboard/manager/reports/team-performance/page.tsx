"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Users, Download, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { api } from "@/lib/api";

const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#ef4444", "#64748b"];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function TeamPerformancePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        metrics: { totalAdvisors: number; mediaConversao: number; receitaTotalEquipe: string; cicloMedioEquipe: number };
        consultants: Array<{ name: string; proposals: number; approved: number; revenue: number; conversion: number; avgCycle: number; trend: "up" | "down" }>;
        monthlyByConsultant: Array<Record<string, string | number>>;
        activeConsultantsNames: string[];
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api<any>("/api/deals/reports/team-performance");
                if (result.success && result.data) setData(result.data);
            } catch (err) {
                console.error("Falha ao carregar métricas de equipe", err);
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
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Users size={20} className="text-blue-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Performance da Equipe</h1><p className="text-sm text-slate-400">Ranking, conversão individual, volume e tendências</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {isLoading || !data ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl h-24 animate-pulse"></div>)
                ) : (
                    [
                        { label: "Total Advisors", value: data.metrics.totalAdvisors.toString(), color: "text-blue-400" }, 
                        { label: "Média Conversão", value: `${data.metrics.mediaConversao}%`, color: "text-blue-400" }, 
                        { label: "Receita Total Equipe", value: data.metrics.receitaTotalEquipe, color: "text-purple-400" }, 
                        { label: "Ciclo Médio Equipe", value: `${data.metrics.cicloMedioEquipe}d`, color: "text-amber-400" }
                    ].map((k, i) => (
                        <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl overflow-hidden">
                            <span className={`text-xl font-bold block truncate ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span>
                        </motion.div>
                    ))
                )}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-white/[0.04]"><h3 className="text-sm font-bold text-white">Ranking de Advisors</h3></div>
                
                {isLoading || !data ? (
                    <div className="p-8 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : data.consultants.length === 0 ? (
                    <div className="p-8 flex items-center justify-center text-sm text-slate-400">Nenhum histórico comercial detectado para membros da equipe.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left"><thead><tr className="border-b border-white/[0.04] bg-slate-900/50">
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">#</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Advisor</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Propostas</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Aprovadas</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Conversão</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Receita Bruta</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ciclo</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tendência Mensal</th>
                        </tr></thead><tbody className="divide-y divide-white/[0.03]">{data.consultants.map((c, i) => (
                            <tr key={c.name} className="hover:bg-white/[0.02]">
                                <td className="px-6 py-4 text-sm font-bold" style={{ color: colors[i % colors.length] }}>{i + 1}º</td>
                                <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: colors[i % colors.length] }}>{c.name.split(" ").slice(0, 2).map(n => n[0]).join("")}</div><span className="text-sm font-medium text-white truncate max-w-[120px]">{c.name}</span></div></td>
                                <td className="px-6 py-4 text-sm text-slate-300">{c.proposals}</td>
                                <td className="px-6 py-4 text-sm text-blue-400 font-medium">{c.approved}</td>
                                <td className="px-6 py-4"><span className={`text-sm font-bold ${c.conversion >= 70 ? "text-blue-400" : c.conversion >= 50 ? "text-amber-400" : "text-red-400"}`}>{c.conversion}%</span></td>
                                <td className="px-6 py-4 text-sm text-white font-medium">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c.revenue)}</td>
                                <td className="px-6 py-4 text-sm text-slate-400">{c.avgCycle}d</td>
                                <td className="px-6 py-4">{c.trend === "up" ? <ArrowUp size={14} className="text-blue-400" /> : <ArrowDown size={14} className="text-red-400" />}</td>
                            </tr>
                        ))}</tbody></table>
                    </div>
                )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Negócios Aprovados por Advisor (Trimestre)</h3>
                <div className="h-[300px]">
                    {isLoading || !data ? (
                        <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : data.monthlyByConsultant.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-400">Sem histórico comercial recente para gerar o gráfico.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.monthlyByConsultant}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={ts} />
                                {data.activeConsultantsNames.map((name, index) => (
                                    <Bar key={name} dataKey={name} fill={colors[index % colors.length]} radius={[3, 3, 0, 0]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
