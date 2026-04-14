"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Zap, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from "recharts";
import { api } from "@/lib/api";

const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function SDRPerformancePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        metrics: {
            leadsGerados: number;
            qualificados: number;
            taxaQualificacao: string;
            cadenciasAtivas: number;
            taxaResposta: string;
        };
        leadsTrend: Array<{ month: string; gerados: number; qualificados: number }>;
        cadenceMetrics: Array<{ cadence: string; sends: number; opens: number; replies: number; rate: string }>;
        responseTrend: Array<{ month: string; taxa: number }>;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api<any>("/api/deals/reports/sdr-performance");
                if (result.success && result.data) setData(result.data);
            } catch (err) {
                console.error("Falha ao carregar Metricas de Outbound", err);
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
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"><Zap size={20} className="text-cyan-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Performance SDR</h1><p className="text-sm text-slate-400">Leads, cadências, taxas de resposta e qualificação</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {isLoading || !data ? (
                    Array.from({length: 5}).map((_, i) => <div key={i} className="h-[88px] bg-slate-800/60 rounded-xl animate-pulse"></div>)
                ) : (
                    [{ label: "Oportunidades Cadastradas", value: data.metrics.leadsGerados, color: "text-cyan-400" }, { label: "Estágio Avançado", value: data.metrics.qualificados, color: "text-blue-400" }, { label: "Tax. Qualificação", value: data.metrics.taxaQualificacao, color: "text-blue-400" }, { label: "Canais Operados", value: data.metrics.cadenciasAtivas, color: "text-purple-400" }, { label: "Respostas Proxy", value: data.metrics.taxaResposta, color: "text-amber-400" }].map((k, i) => (
                        <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl"><span className={`text-xl font-bold block ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span></motion.div>
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Leads Gerados vs Qualificados</h3>
                    <div className="h-[280px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data.leadsTrend.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-slate-400">Sem negócios gerados na janela.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={data.leadsTrend.slice().reverse()}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="gerados" fill="#1e293b" stroke="#334155" strokeWidth={1} name="Qtd Oportunidades Criadas" radius={[3, 3, 0, 0]} /><Bar dataKey="qualificados" fill="#06b6d4" name="Avançaram Além do Crivo 1" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Evolução do Engajamento % (Proxy Resposta)</h3>
                    <div className="h-[280px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : data.responseTrend.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-slate-400">Nenhum rastro de touchpoints.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.responseTrend.slice().reverse()}><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} unit="%" /><Tooltip contentStyle={ts} /><Area type="monotone" dataKey="taxa" stroke="#06b6d4" fill="url(#sg)" strokeWidth={2} name="Taxa de Conclusão %" /></AreaChart></ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Engajamento por Categoria de Contato (Proxy de Cadência)</h3>
                    <div className="text-[10px] text-cyan-400 border border-cyan-500/20 px-2 py-1 bg-cyan-500/10 rounded">Aberturas Preditas (~ 52%)</div>
                </div>
                {isLoading || !data ? (
                     <div className="p-8 flex items-center justify-center"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : data.cadenceMetrics.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">Nenhum TouchPoint catalogado no histórico de Tarefas do CRM.</div>
                ) : (
                    <table className="w-full text-left"><thead><tr className="border-b border-white/[0.04] bg-slate-900/50">
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Canal de Disparo</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Envios / Base</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Aberturas Preditas</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Respostas (Proxy Conclusão)</th><th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Taxa</th>
                    </tr></thead><tbody className="divide-y divide-white/[0.03]">{data.cadenceMetrics.map(c => (
                        <tr key={c.cadence} className="hover:bg-white/[0.02]"><td className="px-6 py-3 text-sm text-white font-medium capitalize">{c.cadence}</td><td className="px-6 py-3 text-sm text-slate-300">{c.sends}</td><td className="px-6 py-3 text-sm text-blue-400">{c.opens}</td><td className="px-6 py-3 text-sm text-blue-400 font-medium">{c.replies}</td><td className="px-6 py-3 text-sm text-amber-400 font-bold">{c.rate}</td></tr>
                    ))}</tbody></table>
                )}
            </motion.div>
        </div>
    );
}
