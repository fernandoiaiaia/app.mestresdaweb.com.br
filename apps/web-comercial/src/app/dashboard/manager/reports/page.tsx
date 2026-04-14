"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    BarChart3, TrendingUp, Users, DollarSign, Clock, Target,
    FileText, ArrowRight, XCircle, Briefcase, UserCheck,
    Activity, Layers, CalendarDays, Handshake, PieChart,
    Gauge, Zap,
} from "lucide-react";

interface ReportCard {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
    href: string;
    category: "consultant" | "manager";
    tags: string[];
}

const reports: ReportCard[] = [
    // ═══ CONSULTANT (Gestão de Clientes) ═══
    {
        id: "pipeline-analysis", title: "Análise de Pipeline", description: "Funil de vendas, tempo médio por etapa, deals estagnados e distribuição por fase.",
        icon: Target, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20",
        href: "/dashboard/manager/reports/pipeline-analysis", category: "consultant", tags: ["Pipeline", "Funil"],
    },
    {
        id: "revenue-forecast", title: "Receita & Forecast", description: "Receita mensal realizada, forecast baseado no pipeline e tendência de crescimento.",
        icon: DollarSign, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20",
        href: "/dashboard/manager/reports/revenue-forecast", category: "consultant", tags: ["Receita", "Forecast"],
    },
    {
        id: "sales-cycle", title: "Ciclo de Vendas", description: "Tempo médio do primeiro contato à aprovação, por período, segmento e produto.",
        icon: Clock, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20",
        href: "/dashboard/manager/reports/sales-cycle", category: "consultant", tags: ["Ciclo", "Velocidade"],
    },
    {
        id: "clients-portfolio", title: "Carteira de Clientes", description: "Distribuição de clientes por segmento, origem, valor e frequência de interação.",
        icon: Briefcase, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20",
        href: "/dashboard/manager/reports/clients-portfolio", category: "consultant", tags: ["Clientes", "Carteira"],
    },
    {
        id: "loss-analysis", title: "Análise de Perdas", description: "Motivos de recusa, concorrência, objeções mais comuns e padrões de rejeição.",
        icon: XCircle, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20",
        href: "/dashboard/manager/reports/loss-analysis", category: "consultant", tags: ["Perdas", "Objeções"],
    },
    {
        id: "activities-report", title: "Atividades & Tarefas", description: "Volume de atividades, tarefas concluídas, atrasadas e produtividade por dia.",
        icon: Activity, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20",
        href: "/dashboard/manager/reports/activities-report", category: "consultant", tags: ["Tarefas", "Produtividade"],
    },
    {
        id: "products-ranking", title: "Ranking de Produtos", description: "Produtos/serviços mais vendidos, ticket médio por produto e margem.",
        icon: Layers, color: "text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20",
        href: "/dashboard/manager/reports/products-ranking", category: "consultant", tags: ["Produtos", "Ticket"],
    },

    // ═══ MANAGER (Gestão de Equipe) ═══
    {
        id: "team-performance", title: "Performance da Equipe", description: "Ranking de advisors, conversão individual, volume de propostas e tendências.",
        icon: Users, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20",
        href: "/dashboard/manager/reports/team-performance", category: "manager", tags: ["Equipe", "Ranking"],
    },
    {
        id: "consultant-comparison", title: "Comparativo de Advisors", description: "Comparação side-by-side entre advisors em todas as métricas-chave.",
        icon: UserCheck, color: "text-indigo-400", bgColor: "bg-indigo-500/10", borderColor: "border-indigo-500/20",
        href: "/dashboard/manager/reports/consultant-comparison", category: "manager", tags: ["Comparativo", "Advisors"],
    },
    {
        id: "goals-tracking", title: "Metas & Objetivos", description: "Acompanhamento de metas individuais e coletivas, atingimento e gap.",
        icon: Gauge, color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20",
        href: "/dashboard/manager/reports/goals-tracking", category: "manager", tags: ["Metas", "OKR"],
    },
    {
        id: "sdr-performance", title: "Performance SDR", description: "Leads gerados, cadências executadas, taxas de resposta e qualificação.",
        icon: Zap, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20",
        href: "/dashboard/manager/reports/sdr-performance", category: "manager", tags: ["SDR", "Prospecção"],
    },
    {
        id: "conversion-funnel", title: "Funil de Conversão Geral", description: "Conversão end-to-end: lead → oportunidade → proposta → negócio fechado.",
        icon: PieChart, color: "text-pink-400", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/20",
        href: "/dashboard/manager/reports/conversion-funnel", category: "manager", tags: ["Funil", "End-to-end"],
    },
    {
        id: "period-summary", title: "Resumo por Período", description: "Dashboard executivo mensal/semanal com todos os KPIs consolidados.",
        icon: CalendarDays, color: "text-teal-400", bgColor: "bg-teal-500/10", borderColor: "border-teal-500/20",
        href: "/dashboard/manager/reports/period-summary", category: "manager", tags: ["Executivo", "Dashboard"],
    },
];

export default function ReportsHubPage() {
    const consultantReports = reports.filter(r => r.category === "consultant");
    const managerReports = reports.filter(r => r.category === "manager");

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <BarChart3 size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Relatórios Gerenciais</h1>
                        <p className="text-sm text-slate-400">{reports.length} relatórios disponíveis para análise de desempenho</p>
                    </div>
                </div>
            </motion.div>

            {/* ═══ SECTION: Consultant ═══ */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                    <Briefcase size={18} className="text-blue-400" />
                    <h2 className="text-lg font-bold text-white">Gestão de Clientes & Vendas</h2>
                    <span className="text-[10px] text-slate-500 ml-2 uppercase tracking-widest">{consultantReports.length} relatórios</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {consultantReports.map((r, i) => (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                            <Link href={r.href} className="block group">
                                <div className="p-5 bg-slate-800/40 border border-white/[0.06] rounded-2xl hover:border-white/[0.12] hover:bg-slate-800/60 transition-all h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2.5 rounded-xl border ${r.bgColor} ${r.borderColor}`}>
                                            <r.icon size={20} className={r.color} />
                                        </div>
                                        <ArrowRight size={16} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all mt-1" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-blue-400 transition-colors">{r.title}</h3>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{r.description}</p>
                                    <div className="flex gap-1.5">
                                        {r.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-slate-700/50 text-[9px] text-slate-400 rounded-md font-medium">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ═══ SECTION: Manager ═══ */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center gap-2 mb-5">
                    <Handshake size={18} className="text-purple-400" />
                    <h2 className="text-lg font-bold text-white">Gestão da Equipe Comercial</h2>
                    <span className="text-[10px] text-slate-500 ml-2 uppercase tracking-widest">{managerReports.length} relatórios</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {managerReports.map((r, i) => (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + 0.05 * i }}>
                            <Link href={r.href} className="block group">
                                <div className="p-5 bg-slate-800/40 border border-white/[0.06] rounded-2xl hover:border-white/[0.12] hover:bg-slate-800/60 transition-all h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2.5 rounded-xl border ${r.bgColor} ${r.borderColor}`}>
                                            <r.icon size={20} className={r.color} />
                                        </div>
                                        <ArrowRight size={16} className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all mt-1" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-purple-400 transition-colors">{r.title}</h3>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{r.description}</p>
                                    <div className="flex gap-1.5">
                                        {r.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-slate-700/50 text-[9px] text-slate-400 rounded-md font-medium">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
