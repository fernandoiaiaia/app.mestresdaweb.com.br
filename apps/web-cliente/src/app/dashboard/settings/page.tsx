"use client";

import { motion } from "framer-motion";
import { User, Bell } from "lucide-react";
import Link from "next/link";

const settingsCards = [
    { title: "Meu Perfil", description: "Atualize seus dados pessoais, foto e informações de contato.", icon: User, href: "/dashboard/profile", color: "blue" },
    { title: "Notificações", description: "Configure quais notificações deseja receber e como.", icon: Bell, href: "/dashboard/notifications", color: "blue" },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
};

export default function SettingsPage() {
    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-slate-400 mt-1">Gerencie suas preferências e configurações da conta.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {settingsCards.map((card, i) => {
                    const colors = colorMap[card.color];
                    const Icon = card.icon;
                    return (
                        <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Link href={card.href}
                                className="block p-6 bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl hover:border-white/[0.12] transition-all group">
                                <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-4`}>
                                    <Icon size={22} className={colors.text} />
                                </div>
                                <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{card.title}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
