"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Clock,
    Hourglass,
    Send,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Calendar,
    Users,
    Crown,
    ArrowUp,
    ArrowDown,
    Target,
    AlertTriangle,
    FileText,
    BarChart3,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";

import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

const renderStatusBadge = (status: string) => {
    const config: Record<string, { color: string; bg: string }> = {
        Aprovada: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
        Enviada: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
        "Aguardando Aprovação": { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
        "Em Andamento": { color: "text-slate-300", bg: "bg-slate-500/10 border-slate-500/20" },
        Recusada: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
    };
    const c = config[status] || { color: "text-slate-300", bg: "bg-slate-500/10 border-slate-500/20" };
    const label = status === "Aguardando Aprovação" ? "Aguard. Aprovação" : status;
    return <span className={`px-2.5 py-1 ${c.bg} ${c.color} border rounded-full text-[10px] font-bold uppercase tracking-wider`}>{label}</span>;
};

export default function DashboardPage() {
    const { user } = useAuthStore();
    const isManager = user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "MANAGER";
    const currentUser = user?.name || "Usuário";
    const firstName = currentUser.split(" ")[0];

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [consultantFilter, setConsultantFilter] = useState("all");
    const [data, setData] = useState({
        stats: { emAndamento: 0, aguardando: 0, enviadas: 0, aprovadas: 0, recusadas: 0, pipeline: 0, expiradas: 0 },
        proposals: [] as any[],
        consultantRanking: [] as any[],
        pieData: [] as any[],
        chartData: [] as any[],
    });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const query = consultantFilter !== "all" ? `?consultantId=${consultantFilter}` : "";
            const response = await api(`/api/deals/dashboard${query}`);
            if (response.success) {
                setData(response.data as any);
            }
        } catch (error) {
            console.error("Failed to load dashboard stats", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load base or filtered data
    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user, consultantFilter]);

    const { stats, proposals, consultantRanking, pieData, chartData } = data;
    const consultants = [...new Set(consultantRanking.map((c: any) => c.name))];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <h1 className="text-3xl font-medium tracking-tight text-white mb-1">
                        Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">{firstName}</span>
                    </h1>
                    <p className="text-sm text-slate-400">
                        {isManager
                            ? "Visão consolidada de todas as propostas e performance da equipe."
                            : "Aqui está o resumo do seu pipeline e atividades de hoje."}
                    </p>
                </motion.div>
                {isManager && (
                    <div className="flex items-center gap-2">
                        <select
                            value={consultantFilter}
                            onChange={(e) => setConsultantFilter(e.target.value)}
                            className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 focus:outline-none focus:border-blue-500/40"
                        >
                            <option value="all">Toda a Equipe</option>
                            {consultants.map((c: any) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {isLoading && proposals.length === 0 ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { title: "Em Andamento", value: String(stats.emAndamento).padStart(2, "0"), icon: Clock, color: "text-slate-300", bg: "bg-slate-800/80" },
                            { title: isManager ? "Aguardando Revisão" : "Aguardando Gerência", value: String(stats.aguardando).padStart(2, "0"), icon: Hourglass, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
                            { title: "Enviadas", value: String(stats.enviadas).padStart(2, "0"), icon: Send, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
                            { title: "Aprovadas", value: String(stats.aprovadas).padStart(2, "0"), icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
                            { title: "Recusadas", value: String(stats.recusadas).padStart(2, "0"), icon: XCircle, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
                        ].map((card, i) => (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className={`p-5 rounded-xl border border-slate-700/50 backdrop-blur-md cursor-pointer hover:scale-[1.02] transition-transform ${card.bg}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <card.icon size={20} className={card.color} />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider border border-slate-700/50 px-2 py-0.5 rounded-full bg-slate-900/50">LTM</span>
                                </div>
                                <h3 className="text-3xl font-medium text-white mb-1">{card.value}</h3>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{card.title}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pipeline Summary */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp size={18} className="text-blue-500" />
                            <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">
                                {isManager ? "Pipeline Consolidado" : "Resumo do Pipeline (CRM)"}
                            </h2>
                        </div>

                        <div className={`grid grid-cols-1 ${isManager ? "md:grid-cols-4" : "md:grid-cols-3"} gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-700/50`}>
                            {isManager && (
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Advisors Ativos</span>
                                    <span className="text-4xl font-medium text-white">{consultants.length}</span>
                                    <span className="text-xs text-blue-400 mt-2 flex items-center gap-1"><Users size={12} /> equipe performando</span>
                                </div>
                            )}
                            <div className={`flex flex-col ${isManager ? "md:pl-8" : ""}`}>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total de Oportunidades</span>
                                <span className="text-4xl font-medium text-white">{stats.emAndamento + stats.aguardando + stats.enviadas}</span>
                                <span className="text-xs text-blue-500 mt-2 flex items-center gap-1">negociações abertas</span>
                            </div>
                            <div className="flex flex-col md:pl-8 pt-4 md:pt-0">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Valor Total em Aberto</span>
                                <span className="text-4xl font-medium text-white">R$ {(stats.pipeline / 1000).toFixed(0)}k</span>
                                <span className="text-xs text-slate-400 mt-2">Valor bruto aguardando aprovação</span>
                            </div>
                            <div className="flex flex-col md:pl-8 pt-4 md:pt-0">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                    {stats.expiradas > 0 ? "Atenção: Expiradas" : "SLA na Meta"}
                                </span>
                                <span className={`text-4xl font-medium ${stats.expiradas > 0 ? "text-red-400" : "text-white"}`}>
                                    {stats.expiradas > 0 ? String(stats.expiradas).padStart(2, "0") : "0"}
                                </span>
                                <span className={`text-xs mt-2 ${stats.expiradas > 0 ? "text-red-400 flex items-center gap-1" : "text-green-500 flex items-center gap-1"}`}>
                                    {stats.expiradas > 0 ? <><AlertTriangle size={12} /> Requer ação imediata</> : <><CheckCircle2 size={12}/> Tudo dentro do prazo</>}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* MANAGER ONLY: Consultant Ranking */}
                    {isManager && consultantRanking.length > 0 && consultantFilter === "all" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-md overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Crown size={18} className="text-amber-400" />
                                    <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">Ranking de Performance</h2>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LTM (Últimos 12 meses)</span>
                            </div>
                            <div className="divide-y divide-slate-700/30">
                                {consultantRanking.map((c: any, i: number) => (
                                    <div key={c.name} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                        <span className={`text-lg font-bold w-6 text-center ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-600"}`}>
                                            {i + 1}
                                        </span>
                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${i === 0 ? 'from-amber-500 to-yellow-300 text-black' : 'from-blue-600 to-cyan-400 text-white'} flex items-center justify-center text-[11px] font-bold shrink-0`}>
                                            {c.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                                            <span className="text-[10px] text-slate-500">{c.proposals} oportunidades · {c.approved} ganhas</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 justify-end">
                                                <span className={`text-sm font-bold ${c.conversion >= 70 ? "text-blue-400" : c.conversion >= 50 ? "text-amber-400" : "text-red-400"}`}>
                                                    {c.conversion}%
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-500">conversão</span>
                                        </div>
                                        <div className="text-right hidden md:block">
                                            <span className="text-sm font-bold text-white">R$ {(c.revenue / 1000).toFixed(0)}k</span>
                                            <span className="text-[10px] text-slate-500 block">receita gerada</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Data Tables & Activities */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Proposals Table */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-md flex flex-col overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-blue-500" />
                                    <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">
                                        Últimas Movimentações (Ativas)
                                    </h2>
                                </div>
                            </div>

                            <div className="overflow-x-auto min-h-[300px]">
                                {proposals.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                                        Nenhuma negociação encontrada para exibir no momento.
                                    </div>
                                ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-700/50 bg-slate-900/50">
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente</th>
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Proposta</th>
                                            {isManager && consultantFilter === 'all' && <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Advisor</th>}
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50 text-sm">
                                        {proposals.map((prop: any) => (
                                            <tr key={prop.id} className={`hover:bg-slate-700/20 transition-colors ${prop.expired ? "bg-red-500/5 border-l-2 border-l-red-500" : ""}`}>
                                                <td className="px-6 py-4 font-medium text-slate-200">
                                                    {prop.client}
                                                    {prop.expired && <span className="block text-[10px] text-red-400 mt-1 uppercase tracking-wider">Atenção: Expirada</span>}
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    {prop.title}
                                                    <span className="block text-[10px] text-slate-500 mt-0.5">{prop.date}</span>
                                                </td>
                                                {isManager && consultantFilter === 'all' && <td className="px-6 py-4 text-slate-400 text-xs">{prop.consultant}</td>}
                                                <td className="px-6 py-4">{renderStatusBadge(prop.status)}</td>
                                                <td className="px-6 py-4 text-slate-300 font-medium">{prop.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>)}
                            </div>
                        </motion.div>

                        {/* Right Column: Activities OR Distribution */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-md flex flex-col overflow-hidden">
                            {isManager && consultantFilter === 'all' ? (
                                /* Manager: Pie chart distribution */
                                <>
                                    <div className="px-6 py-5 border-b border-slate-700/50 flex items-center gap-2">
                                        <Target size={18} className="text-blue-500" />
                                        <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">Distribuição (LTM)</h2>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col items-center justify-center">
                                        {pieData.length > 0 ? (
                                            <>
                                                <div className="h-[200px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                                                                {pieData.map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 w-full px-2">
                                                    {pieData.map((item: any) => (
                                                        <div key={item.name} className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                            <span className="text-[11px] text-slate-400">{item.name}</span>
                                                            <span className="text-[11px] text-white font-bold ml-auto">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-slate-500 text-sm">Sem dados suficientes para o gráfico.</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Consultant: Upcoming activities */
                                <>
                                    <div className="px-6 py-5 border-b border-slate-700/50 flex items-center gap-2">
                                        <Calendar size={18} className="text-blue-500" />
                                        <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">Próximas Atividades</h2>
                                    </div>
                                    <div className="p-6 space-y-6 flex-1 flex flex-col justify-center items-center">
                                         <p className="text-slate-500 text-center text-sm">O calendário não possui atividades mapeadas para hoje.</p>
                                         <Link href="/dashboard/crm" className="w-full py-3 mt-4 border border-slate-700/50 text-center rounded-lg text-xs font-bold tracking-widest uppercase text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors">
                                            Ir para o CRM Completo
                                        </Link>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>

                    {/* Conversion Chart */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 size={18} className="text-blue-500" />
                            <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">
                                Fluxo de Ganhos x Tentativas (Últimos 6 Meses)
                            </h2>
                        </div>

                        <div className="h-[300px] w-full">
                            {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: "#1e293b" }} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }} />
                                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                                    <Bar dataKey="enviadas" fill="#0f172a" name="Tentativas" radius={[4, 4, 0, 0]} stroke="#334155" strokeWidth={1} />
                                    <Bar dataKey="aprovadas" fill="#16a34a" name="Ganhos" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-500">
                                    Nenhum histórico disponível nos últimos 6 meses.
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Manager: Quick access to queue */}
                    {isManager && stats.aguardando > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7 }}>
                            <Link href="/dashboard/crm" className="flex items-center justify-between p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <Hourglass size={20} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Negociações Pendentes</h3>
                                        <p className="text-[11px] text-slate-400">{stats.aguardando} negociação(ções) mapeadas como aguardando aprovações ou com gargalos.</p>
                                    </div>
                                </div>
                                <span className="text-amber-400 font-bold text-sm group-hover:translate-x-1 transition-transform">Ver no CRM →</span>
                            </Link>
                        </motion.div>
                    )}
                </>
            )}

        </div>
    );
}
