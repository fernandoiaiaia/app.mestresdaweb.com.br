"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Trophy, BarChart3, Target, Gift, ArrowRight } from "lucide-react";

const gamificationCards = [
    {
        id: "dashboards",
        title: "Dashboards",
        description: "Acompanhe o ranking geral, progresso dos usuários e custos de premiação.",
        icon: BarChart3,
        href: "/dashboard/settings/gamification/dashboards",
    },
    {
        id: "campaigns",
        title: "Campanhas",
        description: "Crie campanhas, defina os KPIs, participantes e os prazos.",
        icon: Target,
        href: "/dashboard/settings/gamification/campaigns",
    },
    {
        id: "rewards",
        title: "Prêmios",
        description: "Gerencie o catálogo de recompensas, valores em pontos e estoque.",
        icon: Gift,
        href: "/dashboard/settings/gamification/rewards",
    },
];

export default function GamificationSettingsPage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-10"
            >
                <div className="flex items-center gap-4 mb-2">
                    <Link 
                        href="/dashboard/settings" 
                        className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Trophy size={20} className="text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Metas e Gamificação</h1>
                        <p className="text-sm text-slate-400">Configure as regras do jogo para o seu time</p>
                    </div>
                </div>
            </motion.div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {gamificationCards.map((card, index) => {
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
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />

                                    <div className="relative z-10">
                                        <div className="w-11 h-11 mb-4 rounded-xl bg-slate-700/50 border border-slate-600/30 flex items-center justify-center group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all duration-300">
                                            <Icon size={20} className="text-slate-400 group-hover:text-amber-500 transition-colors duration-300" />
                                        </div>

                                        <h3 className="text-[15px] font-semibold text-white mb-1.5 group-hover:text-amber-50 transition-colors">
                                            {card.title}
                                        </h3>

                                        <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                                            {card.description}
                                        </p>

                                        <div className="mt-auto flex items-center gap-1.5 text-slate-600 group-hover:text-amber-500 transition-colors duration-300">
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
