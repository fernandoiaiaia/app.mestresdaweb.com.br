"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Settings,
    UserPlus,
    Users,
    Target,
    FileText,
    FolderKanban,
    ListTodo,
    Package,
    BarChart3,
    Shield,
    Building2,
    ArrowRight,
} from "lucide-react";

// Same colors as the "Aplicativos" toggle in the creation form (green/blue/orange),
// so a platform reads the same color everywhere in the Usuários flow.
const PLATFORM_SECTIONS = [
    {
        key: "growth",
        label: "Comercial (Growth)",
        dot: "bg-green-500",
        labelColor: "text-green-400",
        badgeClass: "bg-green-500/5 border-green-500/10",
        iconColor: "text-green-400",
        features: [
            { icon: Users, label: "Clientes & Pipeline" },
            { icon: Target, label: "Oportunidades" },
            { icon: FileText, label: "Propostas" },
        ],
    },
    {
        key: "dev",
        label: "Dev",
        dot: "bg-blue-500",
        labelColor: "text-blue-400",
        badgeClass: "bg-blue-500/5 border-blue-500/10",
        iconColor: "text-blue-400",
        features: [
            { icon: FolderKanban, label: "Projetos" },
            { icon: ListTodo, label: "Backlog" },
            { icon: Package, label: "Entregas" },
        ],
    },
    {
        key: "corporate",
        label: "Hub (Corporate)",
        dot: "bg-orange-500",
        labelColor: "text-orange-400",
        badgeClass: "bg-orange-500/5 border-orange-500/10",
        iconColor: "text-orange-400",
        features: [
            { icon: Building2, label: "Contratos" },
            { icon: BarChart3, label: "Financeiro" },
            { icon: Shield, label: "Gestão" },
        ],
    },
] as const;

export default function NewUserTeamSelectorPage() {
    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-12"
            >
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
                        <p className="text-sm text-slate-400">Configure acesso, permissões e funis permitidos</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <Link
                    href="/dashboard/settings/users/new/growth"
                    className="block group relative rounded-2xl border backdrop-blur-sm transition-all duration-500 border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 overflow-hidden"
                >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <UserPlus size={28} className="text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Criar Usuário</h2>
                                    <p className="text-sm text-slate-400 mt-1">Growth, Dev, Corporate ou qualquer combinação</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <ArrowRight size={20} className="text-blue-500" />
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Defina perfil de acesso, aplicativos (Comercial, Dev, Corporate), permissões granulares de todas as áreas do sistema e funis permitidos.
                        </p>

                        <div className="space-y-5">
                            {PLATFORM_SECTIONS.map((section) => (
                                <div key={section.key}>
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${section.dot}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${section.labelColor}`}>{section.label}</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {section.features.map((feature) => (
                                            <div
                                                key={feature.label}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${section.badgeClass}`}
                                            >
                                                <feature.icon size={14} className={section.iconColor} />
                                                <span className="text-xs text-slate-300 font-medium">{feature.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Link>
            </motion.div>
        </div>
    );
}
