"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Settings,
    UserPlus,
    TrendingUp,
    Code2,
    Users,
    Kanban,
    Target,
    FileText,
    FolderKanban,
    ListTodo,
    Package,
    BarChart3,
    ArrowRight,
} from "lucide-react";

/* ═══════════════════════════════════════ */
/* TEAM SELECTOR PAGE                      */
/* ═══════════════════════════════════════ */

const TEAMS = [
    {
        id: "growth",
        name: "Time Growth",
        subtitle: "Equipe Comercial",
        description: "CRM, Pipeline, Propostas e gestão de vendas. Configure acessos para a plataforma comercial.",
        href: "/dashboard/settings/users/new/growth",
        icon: TrendingUp,
        color: "green",
        gradient: "from-blue-600 to-blue-500",
        border: "border-blue-500/20 hover:border-blue-500/40",
        bg: "bg-blue-500/5 hover:bg-blue-500/10",
        iconBg: "bg-blue-500/10",
        features: [
            { icon: Users, label: "Clientes" },
            { icon: Kanban, label: "Pipeline" },
            { icon: Target, label: "Oportunidades" },
            { icon: FileText, label: "Propostas" },
        ],
        port: "localhost:1100",
    },
    {
        id: "dev",
        name: "Time Dev",
        subtitle: "Equipe de Desenvolvimento",
        description: "Projetos, Backlog, Documentos e entregas. Configure acessos para a plataforma de desenvolvimento.",
        href: "/dashboard/settings/users/new/dev",
        icon: Code2,
        color: "blue",
        gradient: "from-blue-600 to-cyan-500",
        border: "border-blue-500/20 hover:border-blue-500/40",
        bg: "bg-blue-500/5 hover:bg-blue-500/10",
        iconBg: "bg-blue-500/10",
        features: [
            { icon: FolderKanban, label: "Projetos" },
            { icon: ListTodo, label: "Backlog" },
            { icon: Package, label: "Entregas" },
            { icon: BarChart3, label: "Relatórios" },
        ],
        port: "localhost:1200",
    },
];

export default function NewUserTeamSelectorPage() {
    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-12"
            >
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} />
                        <Settings size={14} />
                        <span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <Link href="/dashboard/settings/users" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        Usuários
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Novo Usuário</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <UserPlus size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Novo Usuário</h1>
                        <p className="text-sm text-slate-400">Selecione o time para configurar as permissões adequadas</p>
                    </div>
                </div>
            </motion.div>

            {/* Team Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TEAMS.map((team, idx) => (
                    <motion.div
                        key={team.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 + idx * 0.1 }}
                    >
                        <Link
                            href={team.href}
                            className={`block group relative rounded-2xl border backdrop-blur-sm transition-all duration-500 ${team.border} ${team.bg} overflow-hidden`}
                        >
                            {/* Gradient shimmer top */}
                            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${team.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="p-8">
                                {/* Icon + Title */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div className={`w-14 h-14 rounded-2xl ${team.iconBg} border border-${team.color}-500/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                                        <team.icon size={28} className={`text-${team.color}-400`} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{team.name}</h2>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{team.subtitle}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                    {team.description}
                                </p>

                                {/* Feature chips */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {team.features.map((feat) => (
                                        <div key={feat.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-white/[0.06] text-[11px] text-slate-400 font-medium">
                                            <feat.icon size={12} className="text-slate-500" />
                                            {feat.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Bottom bar */}
                                <div className="flex items-center justify-between pt-5 border-t border-white/[0.04]">
                                    <span className="text-[10px] font-mono text-slate-600">{team.port}</span>
                                    <div className={`flex items-center gap-1.5 text-sm font-semibold text-${team.color}-400 group-hover:gap-2.5 transition-all duration-300`}>
                                        Configurar
                                        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
