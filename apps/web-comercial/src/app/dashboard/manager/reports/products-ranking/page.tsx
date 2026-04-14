"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Layers, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "@/lib/api";

const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function ProductsRankingPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        rankingData: Array<{ product: string; vendas: number; revenue: number; ticket: number }>;
        shareData: Array<{ name: string; value: number; color: string }>;
        ticketData: Array<{ product: string; ticket: number }>;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api<any>("/api/deals/reports/products-ranking");
                if (result.success && result.data) setData(result.data);
            } catch (err) {
                console.error("Falha ao carregar ranking de funis", err);
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
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><Layers size={20} className="text-violet-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Ranking de Funis Gerenciais</h1><p className="text-sm text-slate-400">Módulos mais vendidos, ticket médio e participação de receita</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Participação por Módulo / Funil (Receita)</h3>
                    {isLoading || !data ? (
                        <div className="h-[220px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : data.shareData.length === 0 ? (
                        <div className="h-[220px] flex items-center justify-center text-xs text-slate-500">Sem histórico financeiro recente.</div>
                    ) : (
                        <div className="flex items-center gap-6">
                            <div className="h-[220px] w-[220px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.shareData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">{data.shareData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={ts} /></PieChart></ResponsiveContainer></div>
                            <div className="flex-1 space-y-3">{data.shareData.map(s => (<div key={s.name} className="flex flex-wrap md:flex-nowrap items-center gap-2 text-[11px]"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} /><span className="text-slate-400 flex-1 truncate" title={s.name}>{s.name}</span><span className="text-white font-bold">{s.value}%</span></div>))}</div>
                        </div>
                    )}
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Ticket Médio por Funil (LTV Base)</h3>
                    <div className="h-[260px]">
                        {isLoading || !data ? (
                            <div className="h-[220px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data.ticketData.length === 0 ? (
                            <div className="h-[220px] flex items-center justify-center text-xs text-slate-500">Sem histórico de ticket médio.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={data.ticketData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} /><YAxis type="category" dataKey="product" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={100} /><Tooltip contentStyle={ts} formatter={(v: any) => [`R$ ${Number(v).toLocaleString("pt-BR")}`]} /><Bar dataKey="ticket" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Ticket Médio" /></BarChart></ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.04]"><h3 className="text-sm font-bold text-white">Ranking Detalhado</h3></div>
                
                {isLoading || !data ? (
                    <div className="p-8 flex items-center justify-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : data.rankingData.length === 0 ? (
                    <div className="p-8 flex items-center justify-center text-sm text-slate-400">Nenhum histórico comercial detectado na conta.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left"><thead><tr className="border-b border-white/[0.04] bg-slate-900/50">
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">#</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Módulo / Funil</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Vendas (Deals)</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Receita Bruta</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ticket Médio</th>
                        </tr></thead><tbody className="divide-y divide-white/[0.03]">{data.rankingData.map((p, i) => (
                            <tr key={p.product} className="hover:bg-white/[0.02]">
                                <td className="px-6 py-3 text-sm text-slate-500 font-bold">{i + 1}º</td>
                                <td className="px-6 py-3 text-sm text-white font-medium">{p.product}</td>
                                <td className="px-6 py-3 text-sm text-slate-300">{p.vendas}</td>
                                <td className="px-6 py-3 text-sm text-blue-400 font-medium">
                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.revenue)}
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-300">
                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.ticket)}
                                </td>
                            </tr>
                        ))}</tbody></table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
