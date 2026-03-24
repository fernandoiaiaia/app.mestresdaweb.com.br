"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Layers, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const rankingData = [
    { product: "Sistema Web", vendas: 45, revenue: 1250000, ticket: 27778 },
    { product: "App Mobile", vendas: 32, revenue: 980000, ticket: 30625 },
    { product: "E-commerce", vendas: 28, revenue: 620000, ticket: 22143 },
    { product: "Landing Page", vendas: 22, revenue: 154000, ticket: 7000 },
    { product: "Software Desktop", vendas: 15, revenue: 480000, ticket: 32000 },
];
const shareData = [
    { name: "Sistema Web", value: 35, color: "#3b82f6" }, { name: "App Mobile", value: 25, color: "#22c55e" },
    { name: "E-commerce", value: 20, color: "#f59e0b" }, { name: "Landing Page", value: 12, color: "#8b5cf6" },
    { name: "Desktop", value: 8, color: "#06b6d4" },
];
const ticketData = [
    { product: "Desktop", ticket: 32000 }, { product: "App Mobile", ticket: 30625 },
    { product: "Sistema Web", ticket: 27778 }, { product: "E-commerce", ticket: 22143 }, { product: "Landing Page", ticket: 7000 },
];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function ProductsRankingPage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/dashboard/manager/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"><ChevronLeft size={16} /><BarChart3 size={14} /><span>Relatórios</span></Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><Layers size={20} className="text-violet-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Ranking de Produtos</h1><p className="text-sm text-slate-400">Produtos mais vendidos, ticket médio e participação</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Participação por Produto</h3>
                    <div className="flex items-center gap-6">
                        <div className="h-[220px] w-[220px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={shareData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">{shareData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={ts} /></PieChart></ResponsiveContainer></div>
                        <div className="flex-1 space-y-3">{shareData.map(s => (<div key={s.name} className="flex items-center gap-2 text-[11px]"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-slate-400 flex-1">{s.name}</span><span className="text-white font-bold">{s.value}%</span></div>))}</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Ticket Médio por Produto</h3>
                    <div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={ticketData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} /><YAxis type="category" dataKey="product" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={100} /><Tooltip contentStyle={ts} formatter={(v: any) => [`R$ ${Number(v).toLocaleString("pt-BR")}`]} /><Bar dataKey="ticket" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Ticket Médio" /></BarChart></ResponsiveContainer></div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.04]"><h3 className="text-sm font-bold text-white">Ranking Detalhado</h3></div>
                <table className="w-full text-left"><thead><tr className="border-b border-white/[0.04] bg-slate-900/50">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">#</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Produto</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Vendas</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Receita</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ticket Médio</th>
                </tr></thead><tbody className="divide-y divide-white/[0.03]">{rankingData.map((p, i) => (
                    <tr key={p.product} className="hover:bg-white/[0.02]"><td className="px-6 py-3 text-sm text-slate-500 font-bold">{i + 1}º</td><td className="px-6 py-3 text-sm text-white font-medium">{p.product}</td><td className="px-6 py-3 text-sm text-slate-300">{p.vendas}</td><td className="px-6 py-3 text-sm text-blue-400 font-medium">R$ {(p.revenue / 1000).toFixed(0)}k</td><td className="px-6 py-3 text-sm text-slate-300">R$ {(p.ticket / 1000).toFixed(1)}k</td></tr>
                ))}</tbody></table>
            </motion.div>
        </div>
    );
}
