"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Users, Download, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const consultants = [
    { name: "Maria Santos", proposals: 18, approved: 14, revenue: 485000, conversion: 78, avgCycle: 4, trend: "up", satisfaction: 92 },
    { name: "João Silva", proposals: 22, approved: 15, revenue: 620000, conversion: 68, avgCycle: 6, trend: "up", satisfaction: 88 },
    { name: "Carlos Oliveira", proposals: 14, approved: 8, revenue: 312000, conversion: 57, avgCycle: 8, trend: "down", satisfaction: 75 },
    { name: "Roberta Alves", proposals: 9, approved: 5, revenue: 189000, conversion: 56, avgCycle: 7, trend: "up", satisfaction: 85 },
    { name: "André Costa", proposals: 16, approved: 11, revenue: 405000, conversion: 69, avgCycle: 5, trend: "up", satisfaction: 90 },
];
const monthlyByConsultant = [
    { month: "Jan", Maria: 3, João: 4, Carlos: 2, Roberta: 1, André: 3 },
    { month: "Fev", Maria: 5, João: 3, Carlos: 3, Roberta: 2, André: 4 },
    { month: "Mar", Maria: 6, João: 8, Carlos: 3, Roberta: 2, André: 4 },
];
const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4"];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function TeamPerformancePage() {
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
                {[{ label: "Total Consultores", value: "5", color: "text-blue-400" }, { label: "Média Conversão", value: "66%", color: "text-blue-400" }, { label: "Receita Total Equipe", value: "R$ 2.0M", color: "text-purple-400" }, { label: "Ciclo Médio Equipe", value: "6 dias", color: "text-amber-400" }].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl"><span className={`text-xl font-bold block ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span></motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-white/[0.04]"><h3 className="text-sm font-bold text-white">Ranking de Consultores</h3></div>
                <table className="w-full text-left"><thead><tr className="border-b border-white/[0.04] bg-slate-900/50">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">#</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Consultor</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Propostas</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Aprovadas</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Conversão</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Receita</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ciclo</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tendência</th>
                </tr></thead><tbody className="divide-y divide-white/[0.03]">{consultants.sort((a, b) => b.revenue - a.revenue).map((c, i) => (
                    <tr key={c.name} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-sm font-bold" style={{ color: colors[i] }}>{i + 1}º</td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold">{c.name.split(" ").map(n => n[0]).join("")}</div><span className="text-sm font-medium text-white">{c.name}</span></div></td>
                        <td className="px-6 py-4 text-sm text-slate-300">{c.proposals}</td>
                        <td className="px-6 py-4 text-sm text-blue-400 font-medium">{c.approved}</td>
                        <td className="px-6 py-4"><span className={`text-sm font-bold ${c.conversion >= 70 ? "text-blue-400" : c.conversion >= 50 ? "text-amber-400" : "text-red-400"}`}>{c.conversion}%</span></td>
                        <td className="px-6 py-4 text-sm text-white font-medium">R$ {(c.revenue / 1000).toFixed(0)}k</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{c.avgCycle}d</td>
                        <td className="px-6 py-4">{c.trend === "up" ? <ArrowUp size={14} className="text-blue-400" /> : <ArrowDown size={14} className="text-red-400" />}</td>
                    </tr>
                ))}</tbody></table>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Propostas Aprovadas por Consultor (Mensal)</h3>
                <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyByConsultant}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="Maria" fill={colors[0]} radius={[3, 3, 0, 0]} /><Bar dataKey="João" fill={colors[1]} radius={[3, 3, 0, 0]} /><Bar dataKey="Carlos" fill={colors[2]} radius={[3, 3, 0, 0]} /><Bar dataKey="Roberta" fill={colors[3]} radius={[3, 3, 0, 0]} /><Bar dataKey="André" fill={colors[4]} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </motion.div>
        </div>
    );
}
