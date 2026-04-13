"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Clock, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const cycleData = [
    { month: "Set", dias: 12 }, { month: "Out", dias: 10 }, { month: "Nov", dias: 8 },
    { month: "Dez", dias: 11 }, { month: "Jan", dias: 7 }, { month: "Fev", dias: 6 }, { month: "Mar", dias: 5 },
];
const bySegment = [
    { segment: "Tecnologia", dias: 4 }, { segment: "Saúde", dias: 7 }, { segment: "Educação", dias: 6 },
    { segment: "Varejo", dias: 9 }, { segment: "Indústria", dias: 11 },
];
const byProduct = [
    { product: "Sistema Web", dias: 5 }, { product: "App Mobile", dias: 7 }, { product: "E-commerce", dias: 4 },
    { product: "Landing Page", dias: 2 }, { product: "Software Desktop", dias: 10 },
];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function SalesCyclePage() {
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
                {[{ label: "Ciclo Médio Atual", value: "5 dias", color: "text-amber-400" }, { label: "Melhor Mês", value: "Mar (5d)", color: "text-blue-400" }, { label: "Pior Mês", value: "Set (12d)", color: "text-red-400" }, { label: "Redução", value: "-58%", color: "text-blue-400" }].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <span className={`text-xl font-bold block ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span>
                    </motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Evolução do Ciclo de Vendas</h3>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%"><LineChart data={cycleData}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} unit=" dias" /><Tooltip contentStyle={ts} /><Line type="monotone" dataKey="dias" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }} name="Dias" /></LineChart></ResponsiveContainer>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Ciclo por Segmento</h3>
                    <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={bySegment} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} unit=" dias" /><YAxis type="category" dataKey="segment" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={85} /><Tooltip contentStyle={ts} /><Bar dataKey="dias" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Dias" /></BarChart></ResponsiveContainer></div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Ciclo por Produto</h3>
                    <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={byProduct} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} unit=" dias" /><YAxis type="category" dataKey="product" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={110} /><Tooltip contentStyle={ts} /><Bar dataKey="dias" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Dias" /></BarChart></ResponsiveContainer></div>
                </motion.div>
            </div>
        </div>
    );
}
