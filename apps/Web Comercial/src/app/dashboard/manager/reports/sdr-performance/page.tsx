"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Zap, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from "recharts";

const leadsTrend = [
    { month: "Set", gerados: 42, qualificados: 18 }, { month: "Out", gerados: 55, qualificados: 24 },
    { month: "Nov", gerados: 48, qualificados: 20 }, { month: "Dez", gerados: 60, qualificados: 28 },
    { month: "Jan", gerados: 72, qualificados: 35 }, { month: "Fev", gerados: 68, qualificados: 32 },
    { month: "Mar", gerados: 85, qualificados: 40 },
];
const cadenceMetrics = [
    { cadence: "Cold Outbound", sends: 420, opens: 180, replies: 28, rate: "6.7%" },
    { cadence: "Inbound Follow-up", sends: 250, opens: 185, replies: 52, rate: "20.8%" },
    { cadence: "Reativação", sends: 180, opens: 95, replies: 18, rate: "10.0%" },
    { cadence: "Upsell Clientes", sends: 120, opens: 88, replies: 22, rate: "18.3%" },
];
const responseTrend = [
    { month: "Set", taxa: 8.2 }, { month: "Out", taxa: 10.5 }, { month: "Nov", taxa: 9.8 },
    { month: "Dez", taxa: 12.1 }, { month: "Jan", taxa: 14.3 }, { month: "Fev", taxa: 13.8 }, { month: "Mar", taxa: 15.2 },
];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function SDRPerformancePage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/dashboard/manager/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"><ChevronLeft size={16} /><BarChart3 size={14} /><span>Relatórios</span></Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"><Zap size={20} className="text-cyan-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Performance SDR</h1><p className="text-sm text-slate-400">Leads, cadências, taxas de resposta e qualificação</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[{ label: "Leads Gerados", value: "430", color: "text-cyan-400" }, { label: "Qualificados", value: "197", color: "text-blue-400" }, { label: "Tax. Qualificação", value: "46%", color: "text-blue-400" }, { label: "Cadências Ativas", value: "4", color: "text-purple-400" }, { label: "Tax. Resposta", value: "15.2%", color: "text-amber-400" }].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl"><span className={`text-xl font-bold block ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span></motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Leads Gerados vs Qualificados</h3>
                    <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={leadsTrend}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="gerados" fill="#1e293b" stroke="#334155" strokeWidth={1} name="Gerados" radius={[3, 3, 0, 0]} /><Bar dataKey="qualificados" fill="#06b6d4" name="Qualificados" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Evolução da Taxa de Resposta</h3>
                    <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={responseTrend}><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} unit="%" /><Tooltip contentStyle={ts} /><Area type="monotone" dataKey="taxa" stroke="#06b6d4" fill="url(#sg)" strokeWidth={2} name="Taxa %" /></AreaChart></ResponsiveContainer></div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.04]"><h3 className="text-sm font-bold text-white">Métricas por Cadência</h3></div>
                <table className="w-full text-left"><thead><tr className="border-b border-white/[0.04] bg-slate-900/50">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cadência</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Envios</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Aberturas</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Respostas</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Taxa</th>
                </tr></thead><tbody className="divide-y divide-white/[0.03]">{cadenceMetrics.map(c => (
                    <tr key={c.cadence} className="hover:bg-white/[0.02]"><td className="px-6 py-3 text-sm text-white font-medium">{c.cadence}</td><td className="px-6 py-3 text-sm text-slate-300">{c.sends}</td><td className="px-6 py-3 text-sm text-blue-400">{c.opens}</td><td className="px-6 py-3 text-sm text-blue-400 font-medium">{c.replies}</td><td className="px-6 py-3 text-sm text-amber-400 font-bold">{c.rate}</td></tr>
                ))}</tbody></table>
            </motion.div>
        </div>
    );
}
