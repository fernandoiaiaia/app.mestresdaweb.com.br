"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, XCircle, Download } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const reasons = [
    { name: "Valor acima do orçamento", value: 35, color: "#ef4444" }, { name: "Escopo não alinhado", value: 25, color: "#f59e0b" },
    { name: "Prazo insuficiente", value: 20, color: "#3b82f6" }, { name: "Concorrência", value: 12, color: "#8b5cf6" }, { name: "Outros", value: 8, color: "#64748b" },
];
const objections = [
    { objection: "Muito caro", count: 42 }, { objection: "Prazo longo", count: 28 }, { objection: "Funcionalidade faltante", count: 22 },
    { objection: "Já tenho fornecedor", count: 18 }, { objection: "Preciso aprovar interno", count: 15 },
];
const lostByMonth = [
    { month: "Set", perdas: 6 }, { month: "Out", perdas: 6 }, { month: "Nov", perdas: 6 },
    { month: "Dez", perdas: 7 }, { month: "Jan", perdas: 8 }, { month: "Fev", perdas: 8 }, { month: "Mar", perdas: 10 },
];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function LossAnalysisPage() {
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
                {[{ label: "Total Perdidas", value: "35", color: "text-red-400" }, { label: "Valor Perdido", value: "R$ 890k", color: "text-red-400" }, { label: "Principal Motivo", value: "Preço", color: "text-amber-400" }, { label: "Taxa de Perda", value: "29%", color: "text-amber-400" }].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <span className={`text-xl font-bold block ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Motivos de Recusa</h3>
                    <div className="flex items-center gap-6">
                        <div className="h-[220px] w-[220px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={reasons} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">{reasons.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={ts} /></PieChart></ResponsiveContainer></div>
                        <div className="flex-1 space-y-3">{reasons.map(r => (<div key={r.name} className="flex items-center gap-3"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color }} /><span className="text-sm text-slate-300 flex-1">{r.name}</span><span className="text-sm font-bold text-white">{r.value}%</span><div className="w-20 bg-slate-800 rounded-full h-1.5 hidden md:block"><div className="h-1.5 rounded-full" style={{ width: `${r.value}%`, backgroundColor: r.color }} /></div></div>))}</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Objeções Mais Comuns</h3>
                    <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={objections} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="objection" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={140} /><Tooltip contentStyle={ts} /><Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} name="Ocorrências" /></BarChart></ResponsiveContainer></div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Perdas por Mês</h3>
                <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={lostByMonth}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="perdas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Propostas Perdidas" /></BarChart></ResponsiveContainer></div>
            </motion.div>
        </div>
    );
}
