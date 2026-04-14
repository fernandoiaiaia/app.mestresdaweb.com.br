"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, UserCheck, Download } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { api } from "@/lib/api";

const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4"];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function ConsultantComparisonPage() {
    const [c1, setC1] = useState(0);
    const [c2, setC2] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        consultants: string[];
        radarData: Array<Record<string, string | number>>;
        comparisonData: Array<{ name: string; conversão: number; volume: number; receita: number }>;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api<any>("/api/deals/reports/consultant-comparison");
                if (result.success && result.data) setData(result.data);
            } catch (err) {
                console.error("Falha ao carregar comparativo de equipe", err);
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
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"><UserCheck size={20} className="text-indigo-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Comparativo de Advisors</h1><p className="text-sm text-slate-400">Side-by-side em todas as métricas-chave</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="flex items-center gap-3 mb-6">
                <span className="text-xs text-slate-500 font-bold uppercase">Comparar (Top 5+):</span>
                {isLoading || !data ? (
                     <div className="flex items-center gap-2"><div className="w-32 h-9 bg-slate-800/60 rounded-xl animate-pulse"></div><span className="text-slate-600">vs</span><div className="w-32 h-9 bg-slate-800/60 rounded-xl animate-pulse"></div></div>
                ) : data.consultants.length < 2 ? (
                    <div className="text-sm text-amber-500">Volumetria insuficiente (Mín 2 consultores)</div>
                ) : (
                    <>
                        <select value={c1} onChange={e => setC1(Number(e.target.value))} className="px-3 py-2 bg-slate-800/60 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none">{data.consultants.map((c, i) => <option key={i} value={i}>{c}</option>)}</select>
                        <span className="text-slate-600">vs</span>
                        <select value={c2} onChange={e => setC2(Number(e.target.value))} className="px-3 py-2 bg-slate-800/60 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none">{data.consultants.map((c, i) => <option key={i} value={i}>{c}</option>)}</select>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Radar de Performance (Glocal Score)</h3>
                    <div className="h-[320px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data.consultants.length < 2 ? (
                            <div className="h-full flex items-center justify-center text-sm text-slate-400">Dados insuficientes para matriz Radar.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={data.radarData}>
                                    <PolarGrid stroke="#1e293b" />
                                    <PolarAngleAxis dataKey="metric" stroke="#64748b" fontSize={11} />
                                    <Radar name={data.consultants[c1]} dataKey={data.consultants[c1].split(" ")[0]} stroke={colors[c1 % colors.length]} fill={colors[c1 % colors.length]} fillOpacity={0.2} />
                                    <Radar name={data.consultants[c2]} dataKey={data.consultants[c2].split(" ")[0]} stroke={colors[c2 % colors.length]} fill={colors[c2 % colors.length]} fillOpacity={0.2} />
                                    <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Comparativo Geral</h3>
                    <div className="h-[320px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data.comparisonData.length < 2 ? (
                            <div className="h-full flex items-center justify-center text-sm text-slate-400">Dados insuficientes para tabela cruzada.</div>
                        ) : (() => {
                            const activeComp = data.comparisonData.filter(d => d.name === data.consultants[c1].split(" ")[0] || d.name === data.consultants[c2].split(" ")[0]);
                            return (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={activeComp}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="conversão" fill="#3b82f6" name="Conversão %" radius={[3, 3, 0, 0]} /><Bar dataKey="volume" fill="#22c55e" name="Volume" radius={[3, 3, 0, 0]} /></BarChart>
                                </ResponsiveContainer>
                            );
                        })()}
                    </div>
                </motion.div>
            </div>

            {/* Side by side cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isLoading && data && data.consultants.length >= 2 && [c1, c2].map((ci) => {
                    const fname = data.consultants[ci].split(" ")[0];
                    const d = data.comparisonData.find(x => x.name === fname) || { conversão: 0, volume: 0, receita: 0 };
                    return (
                        <motion.div key={ci} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: colors[ci % colors.length] }}>{data.consultants[ci].split(" ").map(n => n[0]).slice(0,2).join("")}</div>
                                <h3 className="text-base font-bold text-white truncate max-w-[200px]">{data.consultants[ci]}</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><span className="text-[10px] text-slate-500 uppercase block">Conversão</span><span className="text-lg font-bold text-white">{d.conversão}%</span></div>
                                <div><span className="text-[10px] text-slate-500 uppercase block">Propostas Wons</span><span className="text-lg font-bold text-white">{d.volume}</span></div>
                                <div><span className="text-[10px] text-slate-500 uppercase block">Receita Nominal</span><span className="text-lg font-bold text-blue-400">R$ {d.receita}k</span></div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
