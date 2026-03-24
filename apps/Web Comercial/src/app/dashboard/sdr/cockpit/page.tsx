"use client";

import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Gauge,
    ArrowLeft,
    Users,
    AlertTriangle,
    CheckCircle2,
    CalendarCheck,
    Workflow,
    TrendingUp,
    Mail,
    MessageSquare,
    Phone,
    Clock,
    Rocket,
    MessageCircle,
} from "lucide-react";

const statusLabels: Record<string, string> = {
    new: "Novo", contacted: "Contactado", replied: "Respondeu", qualified: "Qualificado",
    meeting_scheduled: "Agendado", unresponsive: "Sem Resposta", opt_out: "Opt-out",
};
const statusColors: Record<string, string> = {
    new: "bg-slate-500 text-white", contacted: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    replied: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30", qualified: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    meeting_scheduled: "bg-purple-500/20 text-purple-400 border border-purple-500/30", unresponsive: "bg-slate-700 text-slate-400",
    opt_out: "bg-red-500/20 text-red-400 border border-red-500/30",
};
const tempColors: Record<string, { text: string; bg: string }> = {
    hot: { text: "text-red-400", bg: "bg-red-500/10" }, warm: { text: "text-amber-400", bg: "bg-amber-500/10" },
    cold: { text: "text-blue-400", bg: "bg-blue-500/10" },
};

export default function CockpitPage() {
    const { leads, cadences, conversations } = useSDRStore();
    const inCadence = leads.filter(l => l.cadenceId);
    const funnel = {
        new: leads.filter(l => l.status === "new").length,
        contacted: leads.filter(l => l.status === "contacted").length,
        replied: leads.filter(l => l.status === "replied").length,
        qualified: leads.filter(l => l.status === "qualified").length,
        scheduled: leads.filter(l => l.status === "meeting_scheduled").length,
    };
    const needsIntervention = leads.filter(l => l.needsIntervention);
    const totalInCadence = inCadence.length;
    const activeCadences = cadences.filter(c => c.status === "active").length;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Hub SDR</Link>
                <span>/</span><span className="text-white font-medium">Cockpit</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><Gauge size={24} className="text-blue-500" /> Cockpit SDR</h1>
                <p className="text-sm text-slate-400 mt-1">Visão em tempo real da prospecção</p>
            </motion.div>

            {/* Funnel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><TrendingUp size={14} /> Funil de Prospecção</h3>
                <div className="flex items-center gap-0">
                    {[
                        { label: "Novo Lead", value: funnel.new, color: "bg-slate-600" },
                        { label: "Contactado", value: funnel.contacted, color: "bg-blue-600" },
                        { label: "Respondeu", value: funnel.replied, color: "bg-cyan-600" },
                        { label: "Qualificado", value: funnel.qualified, color: "bg-blue-600" },
                        { label: "Agendado", value: funnel.scheduled, color: "bg-purple-600" },
                    ].map((step, i, arr) => {
                        const total = leads.length || 1;
                        const pct = Math.round((step.value / total) * 100);
                        return (
                            <div key={step.label} className="flex-1 text-center relative">
                                <div className={`${step.color} py-4 ${i === 0 ? "rounded-l-xl" : ""} ${i === arr.length - 1 ? "rounded-r-xl" : ""} border-r border-slate-900/50`}>
                                    <div className="text-2xl font-bold text-white">{step.value}</div>
                                    <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold mt-1">{step.label}</div>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-[10px] font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                                        {pct}%
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { title: "Em Cadência", value: totalInCadence, icon: Users, color: "text-blue-400" },
                    { title: "Intervenção", value: needsIntervention.length, icon: AlertTriangle, color: "text-amber-400" },
                    { title: "Qualificados (Mês)", value: funnel.qualified, icon: CheckCircle2, color: "text-blue-400" },
                    { title: "Reuniões Agendadas", value: funnel.scheduled, icon: CalendarCheck, color: "text-purple-400" },
                ].map((stat, i) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                        className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                        <stat.icon size={18} className={`${stat.color} mb-2`} />
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">{stat.title}</div>
                    </motion.div>
                ))}
            </div>

            {/* Intervention Alerts */}
            {needsIntervention.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Intervenção Humana Necessária</h3>
                    <div className="space-y-2">
                        {needsIntervention.map(lead => (
                            <Link key={lead.id} href="/dashboard/sdr/inbox" className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-amber-500/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-500 flex items-center justify-center text-white text-xs font-bold">{lead.name.split(" ").map(n => n[0]).join("")}</div>
                                    <div>
                                        <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">{lead.name}</div>
                                        <div className="text-[10px] text-slate-400">{lead.company} · {lead.interventionReason}</div>
                                    </div>
                                </div>
                                <span className="text-amber-400 text-xs font-bold">Abrir →</span>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Leads in Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Leads em Andamento</h3>
                    <span className="text-xs text-slate-500">{inCadence.length} leads</span>
                </div>
                <div className="divide-y divide-slate-700/30">
                    {inCadence.slice(0, 8).map(lead => {
                        const cad = cadences.find(c => c.id === lead.cadenceId);
                        const tc = tempColors[lead.temperature];
                        return (
                            <div key={lead.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-700/10 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{lead.name.split(" ").map(n => n[0]).join("")}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{lead.name}</div>
                                    <div className="text-[10px] text-slate-500">{lead.company} · {lead.role}</div>
                                </div>
                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tc.bg} ${tc.text}`}>{lead.score}%</div>
                                <div className="text-xs text-slate-400 truncate max-w-[120px] hidden md:block">{cad?.name}</div>
                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[lead.status]}`}>{statusLabels[lead.status]}</div>
                                <div className="text-xs text-slate-500 hidden lg:block whitespace-nowrap">{lead.nextAction}</div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                    { label: "Ativar Leads", href: "/dashboard/sdr/activation", icon: Rocket, color: "text-rose-400" },
                    { label: "Nova Cadência", href: "/dashboard/sdr/cadences", icon: Workflow, color: "text-blue-400" },
                    { label: "Abrir Inbox", href: "/dashboard/sdr/inbox", icon: MessageCircle, color: "text-indigo-400" },
                ].map(link => (
                    <Link key={link.label} href={link.href} className="flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-800/60 hover:border-slate-600 transition-all group">
                        <link.icon size={18} className={link.color} />
                        <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{link.label}</span>
                        <span className="ml-auto text-slate-500 group-hover:text-white text-xs transition-colors">→</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
