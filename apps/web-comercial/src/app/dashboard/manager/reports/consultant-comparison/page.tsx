"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, UserCheck, Download } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const consultants = ["Maria Santos", "João Silva", "Carlos Oliveira", "Roberta Alves", "André Costa"];
const radarData = [
    { metric: "Conversão", Maria: 78, João: 68, Carlos: 57, Roberta: 56, André: 69 },
    { metric: "Volume", Maria: 72, João: 88, Carlos: 56, Roberta: 36, André: 64 },
    { metric: "Receita", Maria: 78, João: 100, Carlos: 50, Roberta: 30, André: 65 },
    { metric: "Velocidade", Maria: 90, João: 70, Carlos: 45, Roberta: 50, André: 80 },
    { metric: "Satisfação", Maria: 92, João: 88, Carlos: 75, Roberta: 85, André: 90 },
];
const comparisonData = [
    { name: "Maria", conversão: 78, volume: 18, receita: 485 },
    { name: "João", conversão: 68, volume: 22, receita: 620 },
    { name: "Carlos", conversão: 57, volume: 14, receita: 312 },
    { name: "Roberta", conversão: 56, volume: 9, receita: 189 },
    { name: "André", conversão: 69, volume: 16, receita: 405 },
];
const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4"];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function ConsultantComparisonPage() {
    const [c1, setC1] = useState(0);
    const [c2, setC2] = useState(1);
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/dashboard/manager/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"><ChevronLeft size={16} /><BarChart3 size={14} /><span>Relatórios</span></Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"><UserCheck size={20} className="text-indigo-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Comparativo de Consultores</h1><p className="text-sm text-slate-400">Side-by-side em todas as métricas-chave</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="flex items-center gap-3 mb-6">
                <span className="text-xs text-slate-500 font-bold uppercase">Comparar:</span>
                <select value={c1} onChange={e => setC1(Number(e.target.value))} className="px-3 py-2 bg-slate-800/60 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none">{consultants.map((c, i) => <option key={i} value={i}>{c}</option>)}</select>
                <span className="text-slate-600">vs</span>
                <select value={c2} onChange={e => setC2(Number(e.target.value))} className="px-3 py-2 bg-slate-800/60 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none">{consultants.map((c, i) => <option key={i} value={i}>{c}</option>)}</select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Radar de Performance</h3>
                    <div className="h-[320px]"><ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis dataKey="metric" stroke="#64748b" fontSize={11} />
                            <Radar name={consultants[c1]} dataKey={consultants[c1].split(" ")[0]} stroke={colors[c1]} fill={colors[c1]} fillOpacity={0.2} />
                            <Radar name={consultants[c2]} dataKey={consultants[c2].split(" ")[0]} stroke={colors[c2]} fill={colors[c2]} fillOpacity={0.2} />
                            <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                        </RadarChart>
                    </ResponsiveContainer></div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Comparativo Geral</h3>
                    <div className="h-[320px]"><ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="conversão" fill="#3b82f6" name="Conversão %" radius={[3, 3, 0, 0]} /><Bar dataKey="volume" fill="#22c55e" name="Volume" radius={[3, 3, 0, 0]} /></BarChart>
                    </ResponsiveContainer></div>
                </motion.div>
            </div>

            {/* Side by side cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[c1, c2].map((ci) => {
                    const d = comparisonData[ci];
                    return (
                        <motion.div key={ci} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: colors[ci] }}>{consultants[ci].split(" ").map(n => n[0]).join("")}</div>
                                <h3 className="text-base font-bold text-white">{consultants[ci]}</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><span className="text-[10px] text-slate-500 uppercase block">Conversão</span><span className="text-lg font-bold text-white">{d.conversão}%</span></div>
                                <div><span className="text-[10px] text-slate-500 uppercase block">Propostas</span><span className="text-lg font-bold text-white">{d.volume}</span></div>
                                <div><span className="text-[10px] text-slate-500 uppercase block">Receita</span><span className="text-lg font-bold text-blue-400">R$ {d.receita}k</span></div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
