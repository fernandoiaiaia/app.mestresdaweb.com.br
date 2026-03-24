"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Briefcase, Download } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const bySegment = [
    { name: "Tecnologia", value: 45, color: "#3b82f6" }, { name: "Saúde", value: 22, color: "#22c55e" },
    { name: "Educação", value: 18, color: "#f59e0b" }, { name: "Varejo", value: 10, color: "#8b5cf6" },
    { name: "Outros", value: 5, color: "#64748b" },
];
const bySource = [
    { source: "Indicação", clientes: 38 }, { source: "Site/Inbound", clientes: 25 },
    { source: "Prospecção Ativa", clientes: 20 }, { source: "Redes Sociais", clientes: 12 }, { source: "Evento", clientes: 5 },
];
const byValue = [
    { faixa: "Até R$10k", clientes: 28 }, { faixa: "R$10k-50k", clientes: 42 },
    { faixa: "R$50k-100k", clientes: 18 }, { faixa: "R$100k+", clientes: 12 },
];
const topClients = [
    { name: "TechCorp Ltda", segment: "Tecnologia", proposals: 8, revenue: "R$ 420k", lastContact: "2 dias" },
    { name: "Saúde Digital", segment: "Saúde", proposals: 5, revenue: "R$ 285k", lastContact: "5 dias" },
    { name: "EduTech BR", segment: "Educação", proposals: 6, revenue: "R$ 195k", lastContact: "1 dia" },
    { name: "Varejo Smart", segment: "Varejo", proposals: 3, revenue: "R$ 150k", lastContact: "8 dias" },
    { name: "Logística PRO", segment: "Tecnologia", proposals: 4, revenue: "R$ 310k", lastContact: "3 dias" },
];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function ClientsPortfolioPage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/dashboard/manager/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"><ChevronLeft size={16} /><BarChart3 size={14} /><span>Relatórios</span></Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"><Briefcase size={20} className="text-cyan-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Carteira de Clientes</h1><p className="text-sm text-slate-400">Distribuição por segmento, origem e valor</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[{ label: "Total Clientes", value: "100", color: "text-cyan-400" }, { label: "Clientes Ativos", value: "82", color: "text-blue-400" }, { label: "Novos (30d)", value: "14", color: "text-blue-400" }, { label: "Inativos", value: "18", color: "text-red-400" }].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <span className={`text-xl font-bold block ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Por Segmento</h3>
                    <div className="h-[220px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={bySegment} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">{bySegment.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={ts} /></PieChart></ResponsiveContainer></div>
                    <div className="space-y-2 mt-2">{bySegment.map(s => (<div key={s.name} className="flex items-center gap-2 text-[11px]"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-slate-400 flex-1">{s.name}</span><span className="text-white font-bold">{s.value}%</span></div>))}</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Por Origem</h3>
                    <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={bySource} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="source" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={110} /><Tooltip contentStyle={ts} /><Bar dataKey="clientes" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Clientes" /></BarChart></ResponsiveContainer></div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Por Faixa de Valor</h3>
                    <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={byValue}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="faixa" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="clientes" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Clientes" /></BarChart></ResponsiveContainer></div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.04]"><h3 className="text-sm font-bold text-white">Top Clientes por Receita</h3></div>
                <table className="w-full text-left"><thead><tr className="border-b border-white/[0.04] bg-slate-900/50">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Segmento</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Propostas</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Receita</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Último Contato</th>
                </tr></thead><tbody className="divide-y divide-white/[0.03]">{topClients.map(c => (
                    <tr key={c.name} className="hover:bg-white/[0.02]"><td className="px-6 py-3 text-sm text-white font-medium">{c.name}</td><td className="px-6 py-3"><span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] rounded-lg font-bold">{c.segment}</span></td><td className="px-6 py-3 text-sm text-slate-300">{c.proposals}</td><td className="px-6 py-3 text-sm text-blue-400 font-medium">{c.revenue}</td><td className="px-6 py-3 text-sm text-slate-400">{c.lastContact}</td></tr>
                ))}</tbody></table>
            </motion.div>
        </div>
    );
}
