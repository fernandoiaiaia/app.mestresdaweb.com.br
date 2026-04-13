"use client";

import { motion } from "framer-motion";
import { FolderKanban, ChevronRight, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

const SETTINGS_CARDS = [
    {
        key: "project",
        title: "Configurações de Projeto",
        description: "Configurar fases do projeto, papéis e permissões por perfil, e limiares de alertas da IA.",
        icon: <FolderKanban size={28} />,
        href: "/dashboard/settings/project",
        stats: "6 fases · 6 perfis · 4 regras de IA",
    },
];

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="p-6 md:p-8 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-slate-400 mt-1">Configurações gerais do sistema.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {SETTINGS_CARDS.map((card, i) => (
                    <motion.div
                        key={card.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => (card as any).external ? window.open(card.href, "_blank") : router.push(card.href)}
                        className="group p-6 rounded-2xl bg-slate-800/40 border border-white/[0.06] hover:border-blue-600/40 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-600/5"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-600/20 text-blue-400 group-hover:bg-blue-500/15 transition-colors">
                                {card.icon}
                            </div>
                            <ChevronRight size={20} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h2 className="text-lg font-bold text-white mb-1.5 group-hover:text-blue-400 transition-colors">{card.title}</h2>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4">{card.description}</p>
                        <div className="pt-3 border-t border-slate-700/30">
                            <span className="text-[11px] font-medium text-slate-500">{card.stats}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
