"use client";

import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Gauge,
    Workflow,
    BookOpen,
    UserCircle,
    KeyRound,
    Rocket,
    MessageSquare,
    BarChart3,
    Zap,
    ShieldCheck,
} from "lucide-react";

export default function SDRHubPage() {
    const { cadences, playbooks, personas, identities, leads, conversations, optOuts } = useSDRStore();

    const activeCadences = cadences.filter(c => c.status === "active").length;
    const leadsInCadence = leads.filter(l => l.cadenceId).length;
    const availableLeads = leads.filter(l => !l.cadenceId && l.status === "new").length;
    const unreadConversations = conversations.filter(c => c.unreadCount > 0).length;

    const cards = [
        { title: "Cockpit SDR", description: "Visão em tempo real da prospecção", href: "/dashboard/sdr/cockpit", icon: Gauge, badge: `${leadsInCadence} em cadência`, color: "from-blue-600 to-cyan-500", bgAccent: "bg-blue-500/10 border-blue-500/20", featured: true },
        { title: "Minhas Cadências", description: "Criar e gerenciar fluxos de prospecção", href: "/dashboard/sdr/cadences", icon: Workflow, badge: `${activeCadences} ativas`, color: "from-blue-600 to-blue-500", bgAccent: "bg-blue-500/10 border-blue-500/20" },
        { title: "Playbooks", description: "O que vender — produtos, diferenciais, objeções", href: "/dashboard/sdr/playbooks", icon: BookOpen, badge: `${playbooks.filter(p => p.status === "active").length} ativos`, color: "from-purple-600 to-violet-500", bgAccent: "bg-purple-500/10 border-purple-500/20" },
        { title: "Personas", description: "Para quem vender — perfis de cliente ideal", href: "/dashboard/sdr/personas", icon: UserCircle, badge: `${personas.filter(p => p.status === "active").length} ativas`, color: "from-orange-600 to-amber-500", bgAccent: "bg-orange-500/10 border-orange-500/20" },
        { title: "Identidades", description: "E-mail, WhatsApp e telefone conectados", href: "/dashboard/sdr/identities", icon: KeyRound, badge: `${identities.length} conectadas`, color: "from-teal-600 to-cyan-500", bgAccent: "bg-teal-500/10 border-teal-500/20" },
        { title: "Ativar Leads", description: "Mover leads do CRM para cadências", href: "/dashboard/sdr/activation", icon: Rocket, badge: `${availableLeads} disponíveis`, color: "from-rose-600 to-pink-500", bgAccent: "bg-rose-500/10 border-rose-500/20" },
        { title: "Inbox", description: "Conversas unificadas com leads em todos os canais", href: "/dashboard/sdr/inbox", icon: MessageSquare, badge: unreadConversations > 0 ? `${unreadConversations} não lidas` : "0 novas", color: "from-indigo-600 to-blue-500", bgAccent: "bg-indigo-500/10 border-indigo-500/20" },
        { title: "Performance", description: "Métricas e analytics das cadências", href: "/dashboard/sdr/performance", icon: BarChart3, badge: "", color: "from-blue-600 to-blue-500", bgAccent: "bg-blue-500/10 border-blue-500/20" },
        { title: "Qualificação & Score", description: "Critérios, pesos e temperaturas de lead", href: "/dashboard/sdr/qualification", icon: Zap, badge: "", color: "from-amber-600 to-yellow-500", bgAccent: "bg-amber-500/10 border-amber-500/20" },
        { title: "Compliance", description: "Opt-outs, supressão e LGPD", href: "/dashboard/sdr/compliance", icon: ShieldCheck, badge: `${optOuts.length} opt-outs`, color: "from-slate-600 to-gray-500", bgAccent: "bg-slate-500/10 border-slate-500/20" },
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-40 min-h-full">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h1 className="text-3xl font-medium tracking-tight text-white mb-1">
                    SDR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500">Automático</span>
                </h1>
                <p className="text-sm text-slate-400 max-w-xl">
                    Prospecção inteligente com IA — e-mail, WhatsApp e ligação automática. Configure o que vender, para quem, e como prospectar.
                </p>
            </motion.div>

            {/* Featured Card — Cockpit */}
            {(() => {
                const cockpit = cards[0];
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                        <Link href={cockpit.href} className="block">
                            <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900 p-8 hover:border-blue-500/30 transition-all group cursor-pointer">
                                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-blue-600/10 to-cyan-500/5 blur-3xl group-hover:from-blue-600/20 transition-all" />
                                <div className="relative flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cockpit.color} flex items-center justify-center shadow-lg shadow-blue-500/20`}>
                                        <cockpit.icon size={28} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{cockpit.title}</h2>
                                        <p className="text-sm text-slate-400 mt-1">{cockpit.description}</p>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end gap-2">
                                        <span className="text-3xl font-bold text-white">{leadsInCadence}</span>
                                        <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">leads em cadência</span>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end gap-2 pl-8 border-l border-slate-700/50">
                                        <span className="text-3xl font-bold text-white">{leads.filter(l => l.needsIntervention).length}</span>
                                        <span className="text-xs text-amber-400 uppercase tracking-wider font-bold">intervenções</span>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end gap-2 pl-8 border-l border-slate-700/50">
                                        <span className="text-3xl font-bold text-white">{leads.filter(l => l.status === "meeting_scheduled").length}</span>
                                        <span className="text-xs text-blue-400 uppercase tracking-wider font-bold">reuniões</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                );
            })()}

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.slice(1).map((card, i) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                    >
                        <Link href={card.href} className="block h-full">
                            <div className="relative h-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-md p-6 hover:border-slate-600 hover:bg-slate-800/60 transition-all group cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0 shadow-md`}>
                                        <card.icon size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{card.title}</h3>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{card.description}</p>
                                    </div>
                                </div>
                                {card.badge && (
                                    <div className="mt-4 flex">
                                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${card.bgAccent} text-slate-300`}>
                                            {card.badge}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
