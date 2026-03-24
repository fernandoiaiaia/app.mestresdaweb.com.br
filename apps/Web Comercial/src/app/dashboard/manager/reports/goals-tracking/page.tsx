"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Gauge, Download, Target, ArrowUp } from "lucide-react";

const goals = [
    { name: "Receita Mensal", target: "R$ 600k", current: "R$ 520k", progress: 87, color: "#22c55e" },
    { name: "Propostas Enviadas", target: "40", current: "35", progress: 88, color: "#3b82f6" },
    { name: "Taxa de Conversão", target: "75%", current: "71%", progress: 95, color: "#8b5cf6" },
    { name: "Novos Clientes", target: "15", current: "12", progress: 80, color: "#06b6d4" },
    { name: "Ciclo de Vendas", target: "5 dias", current: "5 dias", progress: 100, color: "#f59e0b" },
];
const individualGoals = [
    { name: "Maria Santos", target: "R$ 120k", current: "R$ 105k", progress: 88 },
    { name: "João Silva", target: "R$ 150k", current: "R$ 140k", progress: 93 },
    { name: "Carlos Oliveira", target: "R$ 100k", current: "R$ 72k", progress: 72 },
    { name: "Roberta Alves", target: "R$ 80k", current: "R$ 68k", progress: 85 },
    { name: "André Costa", target: "R$ 110k", current: "R$ 95k", progress: 86 },
];

export default function GoalsTrackingPage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/dashboard/manager/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"><ChevronLeft size={16} /><BarChart3 size={14} /><span>Relatórios</span></Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><Gauge size={20} className="text-orange-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Metas & Objetivos</h1><p className="text-sm text-slate-400">Acompanhamento de metas individuais e coletivas</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 mb-6">
                <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2"><Target size={16} className="text-blue-400" /> Metas Coletivas</h3>
                <div className="space-y-5">
                    {goals.map((g, i) => (
                        <motion.div key={g.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-slate-300 font-medium">{g.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] text-slate-500">{g.current} / {g.target}</span>
                                    <span className={`text-xs font-bold ${g.progress >= 90 ? "text-blue-400" : g.progress >= 70 ? "text-amber-400" : "text-red-400"}`}>{g.progress}%</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-800/60 rounded-full h-3 overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${g.progress}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: g.color }} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.04]"><h3 className="text-sm font-bold text-white flex items-center gap-2"><ArrowUp size={16} className="text-blue-400" /> Metas Individuais de Receita</h3></div>
                <table className="w-full text-left"><thead><tr className="border-b border-white/[0.04] bg-slate-900/50">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Consultor</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Meta</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Atual</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Atingimento</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Progresso</th>
                </tr></thead><tbody className="divide-y divide-white/[0.03]">{individualGoals.map(g => (
                    <tr key={g.name} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold">{g.name.split(" ").map(n => n[0]).join("")}</div><span className="text-sm font-medium text-white">{g.name}</span></div></td>
                        <td className="px-6 py-4 text-sm text-slate-400">{g.target}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{g.current}</td>
                        <td className="px-6 py-4"><span className={`text-sm font-bold ${g.progress >= 90 ? "text-blue-400" : g.progress >= 70 ? "text-amber-400" : "text-red-400"}`}>{g.progress}%</span></td>
                        <td className="px-6 py-4 w-40"><div className="w-full bg-slate-800 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${g.progress}%`, backgroundColor: g.progress >= 90 ? "#22c55e" : g.progress >= 70 ? "#f59e0b" : "#ef4444" }} /></div></td>
                    </tr>
                ))}</tbody></table>
            </motion.div>
        </div>
    );
}
