"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Target, Rocket, Terminal, ArrowRight } from "lucide-react";

const teamCards = [
    {
        id: "growth",
        title: "Time Growth",
        description: "Campanhas focadas em vendas, aquisição de leads e conversão.",
        icon: Rocket,
        href: "/dashboard/settings/gamification/campaigns/growth",
        color: "blue",
    },
    {
        id: "dev",
        title: "Time Dev",
        description: "Campanhas focadas em entregas, redução de bugs e NPS.",
        icon: Terminal,
        href: "/dashboard/settings/gamification/campaigns/dev",
        color: "green",
    },
];

const colorClasses: Record<string, { bg: string, text: string, glow: string, border: string }> = {
    blue: {
        bg: "bg-blue-500/10",
        text: "text-blue-500",
        glow: "from-blue-500/5",
        border: "group-hover:border-blue-500/30"
    },
    green: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        glow: "from-emerald-500/5",
        border: "group-hover:border-emerald-500/30"
    }
};

export default function CampaignsSettingsPage() {
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
                        href="/dashboard/settings/gamification" 
                        className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Target size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Campanhas de Gamificação</h1>
                        <p className="text-sm text-slate-400">Selecione o time para gerenciar as campanhas ativas</p>
                    </div>
                </div>
            </motion.div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {teamCards.map((card, index) => {
                    const Icon = card.icon;
                    const colors = colorClasses[card.color];
                    
                    return (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link href={card.href}>
                                <div className={`group relative bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 hover:bg-slate-800/60 ${colors.border} transition-all duration-300 cursor-pointer h-full`}>
                                    {/* Hover glow */}
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-gradient-to-br ${colors.glow} via-transparent to-transparent pointer-events-none`} />

                                    <div className="relative z-10">
                                        <div className={`w-11 h-11 mb-4 rounded-xl bg-slate-700/50 border border-slate-600/30 flex items-center justify-center group-hover:${colors.bg} transition-all duration-300`}>
                                            <Icon size={20} className={`text-slate-400 group-hover:${colors.text} transition-colors duration-300`} />
                                        </div>

                                        <h3 className={`text-[15px] font-semibold text-white mb-1.5 group-hover:${colors.text} transition-colors`}>
                                            {card.title}
                                        </h3>

                                        <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                                            {card.description}
                                        </p>

                                        <div className={`mt-auto flex items-center gap-1.5 text-slate-600 group-hover:${colors.text} transition-colors duration-300`}>
                                            <span className="text-[11px] font-semibold uppercase tracking-widest">Gerenciar Campanhas</span>
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
