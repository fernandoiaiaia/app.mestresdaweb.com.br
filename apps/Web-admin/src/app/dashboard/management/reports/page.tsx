"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
    ChevronLeft, 
    BarChart3, 
    LineChart, 
    PieChart, 
    TrendingUp, 
    Target, 
    Activity, 
    Wallet,
    DollarSign,
    Briefcase,
    Users,
    MessageSquare,
    Clock,
    Magnet
} from "lucide-react";

export default function ReportsHubPage() {
    const reportCategories = [
        {
            title: "Financeiro & Controladoria",
            description: "Analise a saúde financeira, fluxo de caixa, DRE gerencial e rentabilidade por filial.",
            icon: <Wallet size={24} className="text-emerald-400" />,
            color: "emerald",
            reports: [
                { name: "DRE Gerencial", link: "/dashboard/management/reports/financial/dre", icon: <BarChart3 size={16} /> },
                { name: "Fluxo de Caixa", link: "/dashboard/management/reports/financial/cash-flow", icon: <TrendingUp size={16} /> },
                { name: "Rentabilidade por Filial", link: "/dashboard/management/reports/financial/profitability", icon: <PieChart size={16} /> },
            ]
        },
        {
            title: "Vendas & CRM",
            description: "Acompanhe a entrada de leads por canal, conversões do funil, win-rate, performance de vendedores e ROI de aquisição.",
            icon: <Target size={24} className="text-blue-400" />,
            color: "blue",
            reports: [
                { name: "Entrada de Leads por Fonte", link: "/dashboard/management/reports/sales/leads", icon: <Magnet size={16} /> },
                { name: "Funil de Conversão", link: "/dashboard/management/reports/sales/funnel", icon: <BarChart3 size={16} /> },
                { name: "Performance do Time", link: "/dashboard/management/reports/sales/performance", icon: <Users size={16} /> },
                { name: "ROI por Canal", link: "/dashboard/management/reports/sales/roi", icon: <LineChart size={16} /> },
            ]
        },
        {
            title: "Projetos & Operações",
            description: "Acompanhe a rentabilidade real dos projetos entregues e a velocidade do time de desenvolvimento.",
            icon: <Briefcase size={24} className="text-purple-400" />,
            color: "purple",
            reports: [
                { name: "Rentabilidade de Projetos", link: "/dashboard/management/reports/projects/profitability", icon: <DollarSign size={16} /> },
                { name: "Velocidade de Entrega", link: "/dashboard/management/reports/projects/velocity", icon: <Clock size={16} /> },
            ]
        },
        {
            title: "Contratos & Recorrência",
            description: "Controle as assinaturas ativas, MRR (Receita Recorrente), Churn e taxa de inadimplência.",
            icon: <Activity size={24} className="text-amber-400" />,
            color: "amber",
            reports: [
                { name: "MRR e Churn", link: "/dashboard/management/reports/contracts/mrr", icon: <LineChart size={16} /> },
                { name: "Inadimplência", link: "/dashboard/management/reports/contracts/aging", icon: <TrendingUp size={16} className="text-rose-400" /> },
            ]
        },
        {
            title: "Atendimento & IA",
            description: "Verifique o volume de contatos e a eficiência de resolução automática do Chatbot via WhatsApp.",
            icon: <MessageSquare size={24} className="text-pink-400" />,
            color: "pink",
            reports: [
                { name: "Eficiência do Chatbot", link: "/dashboard/management/reports/support/chatbot", icon: <PieChart size={16} /> },
                { name: "Volume de Contatos", link: "/dashboard/management/reports/support/volume", icon: <BarChart3 size={16} /> },
            ]
        }
    ];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/20';
            case 'blue': return 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/20';
            case 'purple': return 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/20';
            case 'amber': return 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/20';
            case 'pink': return 'bg-pink-500/10 border-pink-500/20 text-pink-400 hover:border-pink-500/50 hover:bg-pink-500/20';
            default: return 'bg-slate-500/10 border-slate-500/20 text-slate-400 hover:border-slate-500/50 hover:bg-slate-500/20';
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/management" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><span>Gestão</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Relatórios Gerenciais</span>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <BarChart3 size={28} className="text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Relatórios Gerenciais</h1>
                        <p className="text-sm text-slate-400 mt-1">Central de inteligência para acompanhamento de KPIs da sua empresa.</p>
                    </div>
                </div>
            </motion.div>

            {/* Grid de Categorias */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {reportCategories.map((category, idx) => (
                    <div 
                        key={idx} 
                        className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 flex flex-col h-full hover:bg-slate-800/60 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(category.color).split(' ')[0]} ${getColorClasses(category.color).split(' ')[1]}`}>
                                {category.icon}
                            </div>
                            <h2 className="text-lg font-bold text-white">{category.title}</h2>
                        </div>
                        
                        <p className="text-sm text-slate-400 mb-6 flex-1">
                            {category.description}
                        </p>

                        <div className="space-y-2">
                            {category.reports.map((report, ridx) => (
                                <Link 
                                    key={ridx}
                                    href={report.link}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${getColorClasses(category.color)} group`}
                                >
                                    <div className="text-current opacity-70 group-hover:opacity-100 transition-opacity">
                                        {report.icon}
                                    </div>
                                    <span className="text-sm font-medium flex-1 group-hover:text-white transition-colors">{report.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
