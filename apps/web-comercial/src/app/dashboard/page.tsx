"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    PlusCircle,
    Clock,
    Hourglass,
    Send,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Calendar,
    Briefcase,
    MoreHorizontal,
    FileText,
    BarChart3,
    Users,
    Crown,
    ArrowUp,
    ArrowDown,
    Filter,
    DollarSign,
    Target,
    AlertTriangle,
    ChevronDown,
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
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";

import { useAuthStore } from "@/stores/auth";

/* ═══════════════════════════════════════ */
/* MOCK DATA                               */
/* ═══════════════════════════════════════ */
const chartData = [
    { name: "Jan", enviadas: 12, aprovadas: 8 },
    { name: "Fev", enviadas: 19, aprovadas: 15 },
    { name: "Mar", enviadas: 15, aprovadas: 10 },
    { name: "Abr", enviadas: 22, aprovadas: 18 },
    { name: "Mai", enviadas: 28, aprovadas: 20 },
    { name: "Jun", enviadas: 35, aprovadas: 25 },
];

// All proposals (gestor sees all, consultor sees only their own)
const allProposals = [
    { id: "1", client: "TechCorp Solutions", title: "Implementação de IA", status: "Aprovada", value: "R$ 45.000", numValue: 45000, date: "03 Mar 2026", consultant: "João Silva", expired: false },
    { id: "2", client: "Global Logistics", title: "Consultoria de Processos", status: "Enviada", value: "R$ 28.500", numValue: 28500, date: "01 Mar 2026", consultant: "Maria Santos", expired: false },
    { id: "3", client: "Retail Plus", title: "Migração de Dados", status: "Aguardando Aprovação", value: "R$ 15.000", numValue: 15000, date: "28 Fev 2026", consultant: "João Silva", expired: false },
    { id: "4", client: "Banco Safra", title: "Auditoria de Segurança", status: "Em Andamento", value: "R$ 80.000", numValue: 80000, date: "25 Fev 2026", consultant: "Carlos Oliveira", expired: false },
    { id: "5", client: "Construtora Apex", title: "ERP Customizado", status: "Enviada", value: "R$ 120.000", numValue: 120000, date: "15 Fev 2026", consultant: "João Silva", expired: true },
    { id: "6", client: "FoodTech Brasil", title: "App Delivery", status: "Aprovada", value: "R$ 92.000", numValue: 92000, date: "10 Fev 2026", consultant: "Maria Santos", expired: false },
    { id: "7", client: "Indústria Apex", title: "Sistema IoT", status: "Em Andamento", value: "R$ 320.000", numValue: 320000, date: "05 Fev 2026", consultant: "Carlos Oliveira", expired: false },
    { id: "8", client: "MedTech", title: "Portal Pacientes", status: "Recusada", value: "R$ 38.000", numValue: 38000, date: "01 Fev 2026", consultant: "Roberta Alves", expired: false },
];

const consultantRanking = [
    { name: "Maria Santos", proposals: 18, approved: 14, conversion: 78, revenue: 485000, avatar: "MS", gradient: "from-blue-600 to-cyan-400", trend: "up" },
    { name: "João Silva", proposals: 22, approved: 15, conversion: 68, revenue: 620000, avatar: "JS", gradient: "from-blue-600 to-blue-400", trend: "up" },
    { name: "Carlos Oliveira", proposals: 14, approved: 8, conversion: 57, revenue: 312000, avatar: "CO", gradient: "from-purple-600 to-violet-400", trend: "down" },
    { name: "Roberta Alves", proposals: 9, approved: 5, conversion: 56, revenue: 189000, avatar: "RA", gradient: "from-teal-600 to-blue-400", trend: "up" },
];

const pieData = [
    { name: "Aprovadas", value: 42, color: "#22c55e" },
    { name: "Enviadas", value: 18, color: "#3b82f6" },
    { name: "Em Andamento", value: 15, color: "#64748b" },
    { name: "Aguardando", value: 8, color: "#f59e0b" },
    { name: "Recusadas", value: 5, color: "#ef4444" },
];

const renderStatusBadge = (status: string) => {
    const config: Record<string, { color: string; bg: string }> = {
        Aprovada: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
        Enviada: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
        "Aguardando Aprovação": { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
        "Em Andamento": { color: "text-slate-300", bg: "bg-slate-500/10 border-slate-500/20" },
        Recusada: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
    };
    const c = config[status];
    if (!c) return null;
    const label = status === "Aguardando Aprovação" ? "Aguard. Aprovação" : status;
    return <span className={`px-2.5 py-1 ${c.bg} ${c.color} border rounded-full text-[10px] font-bold uppercase tracking-wider`}>{label}</span>;
};

/* ═══════════════════════════════════════ */
/* COMPONENT                               */
/* ═══════════════════════════════════════ */
export default function DashboardPage() {
    const { user } = useAuthStore();

    // Determine dashboard mode from user role
    // OWNER, ADMIN, MANAGER → Gestor view (all data)
    // USER → Vendedor view (own data only)
    const isManager = user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "MANAGER";
    const currentUser = user?.name || "Usuário";
    const firstName = currentUser.split(" ")[0];

    const [consultantFilter, setConsultantFilter] = useState("all");
    const [periodFilter, setPeriodFilter] = useState("month");

    const consultants = [...new Set(allProposals.map((p) => p.consultant))];
    const filteredProposals = allProposals
        .filter((p) => isManager ? (consultantFilter === "all" || p.consultant === consultantFilter) : p.consultant === currentUser)
        .slice(0, 6);

    // Stats computed from data
    const visibleProposals = isManager ? allProposals : allProposals.filter((p) => p.consultant === currentUser);
    const stats = {
        emAndamento: visibleProposals.filter((p) => p.status === "Em Andamento").length,
        aguardando: visibleProposals.filter((p) => p.status === "Aguardando Aprovação").length,
        enviadas: visibleProposals.filter((p) => p.status === "Enviada").length,
        aprovadas: visibleProposals.filter((p) => p.status === "Aprovada").length,
        recusadas: visibleProposals.filter((p) => p.status === "Recusada").length,
        pipeline: visibleProposals.reduce((s, p) => s + p.numValue, 0),
        expiradas: visibleProposals.filter((p) => p.expired).length,
    };

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

            </div>

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
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider border border-slate-700/50 px-2 py-0.5 rounded-full bg-slate-900/50">Mês</span>
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
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Consultores Ativos</span>
                            <span className="text-4xl font-medium text-white">{consultants.length}</span>
                            <span className="text-xs text-blue-400 mt-2 flex items-center gap-1"><Users size={12} /> equipe completa</span>
                        </div>
                    )}
                    <div className={`flex flex-col ${isManager ? "md:pl-8" : ""}`}>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total de Oportunidades</span>
                        <span className="text-4xl font-medium text-white">{visibleProposals.length}</span>
                        <span className="text-xs text-blue-500 mt-2 flex items-center gap-1">+12% este mês</span>
                    </div>
                    <div className="flex flex-col md:pl-8 pt-4 md:pt-0">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Valor Total em Aberto</span>
                        <span className="text-4xl font-medium text-white">R$ {(stats.pipeline / 1000).toFixed(0)}k</span>
                        <span className="text-xs text-slate-400 mt-2">Baseado em propostas enviadas</span>
                    </div>
                    <div className="flex flex-col md:pl-8 pt-4 md:pt-0">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                            {stats.expiradas > 0 ? "Atenção: Expiradas" : "Próximos Fechamentos"}
                        </span>
                        <span className={`text-4xl font-medium ${stats.expiradas > 0 ? "text-red-400" : "text-white"}`}>
                            {stats.expiradas > 0 ? String(stats.expiradas).padStart(2, "0") : "03"}
                        </span>
                        <span className={`text-xs mt-2 ${stats.expiradas > 0 ? "text-red-400 flex items-center gap-1" : "text-amber-500 flex items-center gap-1"}`}>
                            {stats.expiradas > 0 ? <><AlertTriangle size={12} /> Requer ação imediata</> : "Previsão para próximos 7 dias"}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* ═══ MANAGER ONLY: Consultant Ranking ═══ */}
            {isManager && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-md overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Crown size={18} className="text-amber-400" />
                            <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">Ranking de Consultores</h2>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Este mês</span>
                    </div>
                    <div className="divide-y divide-slate-700/30">
                        {consultantRanking.map((c, i) => (
                            <div key={c.name} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                <span className={`text-lg font-bold w-6 text-center ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-600"}`}>
                                    {i + 1}
                                </span>
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${c.gradient} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                                    {c.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                                    <span className="text-[10px] text-slate-500">{c.proposals} propostas · {c.approved} aprovadas</span>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 justify-end">
                                        <span className={`text-sm font-bold ${c.conversion >= 70 ? "text-blue-400" : c.conversion >= 50 ? "text-amber-400" : "text-red-400"}`}>
                                            {c.conversion}%
                                        </span>
                                        {c.trend === "up" ? <ArrowUp size={12} className="text-blue-400" /> : <ArrowDown size={12} className="text-red-400" />}
                                    </div>
                                    <span className="text-[10px] text-slate-500">conversão</span>
                                </div>
                                <div className="text-right hidden md:block">
                                    <span className="text-sm font-bold text-white">R$ {(c.revenue / 1000).toFixed(0)}k</span>
                                    <span className="text-[10px] text-slate-500 block">receita</span>
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
                                {isManager ? "Propostas Recentes (Todas)" : "Últimas Propostas"}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Manager: filter by consultant */}
                            {isManager && (
                                <select
                                    value={consultantFilter}
                                    onChange={(e) => setConsultantFilter(e.target.value)}
                                    className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 focus:outline-none focus:border-blue-500/40"
                                >
                                    <option value="all">Todos</option>
                                    {consultants.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-900/50">
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente</th>
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Proposta</th>
                                    {isManager && <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Consultor</th>}
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor</th>
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50 text-sm">
                                {filteredProposals.map((prop) => (
                                    <tr key={prop.id} className={`hover:bg-slate-700/20 transition-colors ${prop.expired ? "bg-red-500/5 border-l-2 border-l-red-500" : ""}`}>
                                        <td className="px-6 py-4 font-medium text-slate-200">
                                            {prop.client}
                                            {prop.expired && <span className="block text-[10px] text-red-400 mt-1 uppercase tracking-wider">Atenção: Expirada</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">{prop.title}</td>
                                        {isManager && <td className="px-6 py-4 text-slate-400 text-xs">{prop.consultant}</td>}
                                        <td className="px-6 py-4">{renderStatusBadge(prop.status)}</td>
                                        <td className="px-6 py-4 text-slate-300 font-medium">{prop.value}</td>
                                        <td className="px-6 py-4 text-slate-500">{prop.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Right Column: Activities OR Distribution */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-md flex flex-col overflow-hidden">
                    {isManager ? (
                        /* Manager: Pie chart distribution */
                        <>
                            <div className="px-6 py-5 border-b border-slate-700/50 flex items-center gap-2">
                                <Target size={18} className="text-blue-500" />
                                <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">Distribuição por Status</h2>
                            </div>
                            <div className="p-6 flex-1 flex flex-col items-center justify-center">
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 w-full px-2">
                                    {pieData.map((item) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                            <span className="text-[11px] text-slate-400">{item.name}</span>
                                            <span className="text-[11px] text-white font-bold ml-auto">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Consultant: Upcoming activities */
                        <>
                            <div className="px-6 py-5 border-b border-slate-700/50 flex items-center gap-2">
                                <Calendar size={18} className="text-blue-500" />
                                <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">Próximas Atividades</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                {[
                                    { title: "Apresentação de Proposta", client: "TechCorp Solutions", time: "Hoje, 14:30", type: "Reunião" },
                                    { title: "Follow-up de Negociação", client: "Global Logistics", time: "Amanhã, 10:00", type: "Call" },
                                    { title: "Aprovação de Layouts", client: "Retail Plus", time: "05 Mar, 16:00", type: "Tarefa" },
                                ].map((activity, i) => (
                                    <div key={i} className="flex gap-4 group cursor-pointer">
                                        <div className="mt-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-150 transition-transform"></div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1 block">
                                                {activity.type} • {activity.time}
                                            </span>
                                            <h4 className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{activity.title}</h4>
                                            <p className="text-xs text-slate-400 mt-1">{activity.client}</p>
                                        </div>
                                    </div>
                                ))}
                                <button className="w-full py-3 mt-4 border border-slate-700/50 rounded-lg text-xs font-bold tracking-widest uppercase text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors">
                                    Abrir Calendário Completo
                                </button>
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
                        {isManager ? "Conversão Consolidada (Últimos 6 Meses)" : "Conversão de Propostas (Últimos 6 Meses)"}
                    </h2>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: "#1e293b" }} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }} />
                            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                            <Bar dataKey="enviadas" fill="#0f172a" name="Enviadas" radius={[4, 4, 0, 0]} stroke="#334155" strokeWidth={1} />
                            <Bar dataKey="aprovadas" fill="#16a34a" name="Aprovadas" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Manager: Quick access to queue */}
            {isManager && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7 }}>
                    <Link href="/dashboard/manager/queue" className="flex items-center justify-between p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Hourglass size={20} className="text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Fila de Aprovação</h3>
                                <p className="text-[11px] text-slate-400">{stats.aguardando} proposta(s) aguardando sua revisão</p>
                            </div>
                        </div>
                        <span className="text-amber-400 font-bold text-sm group-hover:translate-x-1 transition-transform">Revisar →</span>
                    </Link>
                </motion.div>
            )}

        </div>
    );
}
