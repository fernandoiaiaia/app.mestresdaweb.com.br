"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    Wallet,
    Settings,
    Building2,
    Shapes,
    Users,
    Plug,
    Building,
    Landmark,
    ArrowRight
} from "lucide-react";

const settingsCards = [
    {
        id: "users",
        title: "Usuários",
        description: "Gerencie o acesso e permissões da equipe.",
        icon: Users,
        href: "/dashboard/management/settings/users",
        badge: "Permissões",
        badgeColor: "green",
    },
    {
        id: "integrations",
        title: "Integrações",
        description: "Conecte com outras ferramentas e APIs.",
        icon: Plug,
        href: "/dashboard/management/settings/integrations",
        badge: null,
        badgeColor: null,
    },
    {
        id: "company",
        title: "Dados da Empresa",
        description: "Informações fiscais e configurações da matriz.",
        icon: Building,
        href: "/dashboard/management/settings/company",
        badge: "Matriz",
        badgeColor: "blue",
    },
    {
        id: "financial",
        title: "Cadastros Financeiros",
        description: "Contas bancárias, centros de custo e categorias.",
        icon: Landmark,
        href: "/dashboard/management/settings/financial",
        badge: "Financeiro",
        badgeColor: "emerald",
    }
];

const badgeColors: Record<string, string> = {
    green: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function SettingsPage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-10"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Settings size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Configurações Gerais</h1>
                        <p className="text-sm text-slate-400">Parâmetros financeiros e operacionais do sistema</p>
                    </div>
                </div>
            </motion.div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {settingsCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link href={card.href}>
                                <div className="group relative bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 hover:bg-slate-800/60 hover:border-white/10 transition-all duration-300 cursor-pointer h-full">
                                    {/* Hover glow */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />

                                    <div className="relative z-10">
                                        {/* Top row: icon + badge */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-11 h-11 rounded-xl bg-slate-700/50 border border-slate-600/30 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-300">
                                                <Icon size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
                                            </div>
                                            {card.badge && (
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColors[card.badgeColor || "slate"]}`}>
                                                    {card.badge}
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-[15px] font-semibold text-white mb-1.5 group-hover:text-blue-50 transition-colors">
                                            {card.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                                            {card.description}
                                        </p>

                                        {/* Arrow */}
                                        <div className="flex items-center gap-1.5 text-slate-600 group-hover:text-blue-500 transition-colors duration-300">
                                            <span className="text-[11px] font-semibold uppercase tracking-widest">Acessar</span>
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
