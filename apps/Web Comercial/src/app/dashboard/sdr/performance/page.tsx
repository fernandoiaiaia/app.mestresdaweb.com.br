"use client";

import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    BarChart3,
    ArrowLeft,
    TrendingUp,
    Mail,
    MessageSquare,
    Phone,
    Clock,
    Users,
    CalendarCheck,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    FunnelChart,
} from "recharts";

export default function PerformancePage() {
    const { cadences, leads } = useSDRStore();
    const activeCadences = cadences.filter(c => c.status === "active");

    const funnelData = [
        { name: "Ativados", value: leads.filter(l => l.cadenceId).length, fill: "#64748b" },
        { name: "Contactados", value: leads.filter(l => ["contacted", "replied", "qualified", "meeting_scheduled"].includes(l.status)).length, fill: "#3b82f6" },
        { name: "Responderam", value: leads.filter(l => ["replied", "qualified", "meeting_scheduled"].includes(l.status)).length, fill: "#06b6d4" },
        { name: "Qualificados", value: leads.filter(l => ["qualified", "meeting_scheduled"].includes(l.status)).length, fill: "#22c55e" },
        { name: "Agendados", value: leads.filter(l => l.status === "meeting_scheduled").length, fill: "#a855f7" },
    ];

    const channelData = [
        { channel: "E-mail", sent: 45, responses: 12, qualified: 5, rate: "27%", icon: Mail, color: "text-blue-400" },
        { channel: "WhatsApp", sent: 28, responses: 8, qualified: 4, rate: "29%", icon: MessageSquare, color: "text-blue-400" },
        { channel: "Ligação", sent: 15, responses: 9, qualified: 3, rate: "60%", icon: Phone, color: "text-blue-400" },
    ];

    const abTestData = [
        { test: "Assunto E-mail — Cadência SaaS", variantA: { name: "Pergunta direta", opens: 42, responses: 8 }, variantB: { name: "Dado impactante", opens: 56, responses: 14 }, winner: "B" },
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Hub SDR</Link>
                <span>/</span><span className="text-white font-medium">Performance</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><BarChart3 size={24} className="text-blue-500" /> Performance</h1>
                <p className="text-sm text-slate-400 mt-1">Métricas e analytics das cadências</p>
            </motion.div>

            {/* Funnel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><TrendingUp size={14} /> Funil de Conversão Geral</h3>
                <div className="flex items-end gap-2">
                    {funnelData.map((step, i) => {
                        const maxVal = Math.max(...funnelData.map(d => d.value), 1);
                        const height = Math.max((step.value / maxVal) * 160, 30);
                        const pct = i > 0 ? Math.round((step.value / (funnelData[i - 1].value || 1)) * 100) : 100;
                        return (
                            <div key={step.name} className="flex-1 text-center">
                                <div className="text-lg font-bold text-white mb-1">{step.value}</div>
                                <div className="mx-auto rounded-t-lg transition-all" style={{ height, backgroundColor: step.fill, width: "80%" }} />
                                <div className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">{step.name}</div>
                                {i > 0 && <div className="text-[10px] text-slate-600 mt-0.5">{pct}%</div>}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Tempo até 1ª Resposta", value: "18h", icon: Clock },
                    { label: "Tempo até Qualificação", value: "4.2 dias", icon: TrendingUp },
                    { label: "Tempo até Agendamento", value: "6.8 dias", icon: CalendarCheck },
                    { label: "Cadências Ativas", value: String(activeCadences.length), icon: Users },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                        <s.icon size={16} className="text-blue-400 mb-2" />
                        <div className="text-xl font-bold text-white">{s.value}</div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">{s.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Channel Performance */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50"><h3 className="text-sm font-bold text-white uppercase tracking-wider">Performance por Canal</h3></div>
                <div className="divide-y divide-slate-700/30">
                    {channelData.map(ch => {
                        const Icon = ch.icon;
                        return (
                            <div key={ch.channel} className="flex items-center gap-6 px-6 py-4">
                                <div className="flex items-center gap-2 w-32">
                                    <Icon size={16} className={ch.color} />
                                    <span className="text-sm font-semibold text-white">{ch.channel}</span>
                                </div>
                                <div className="flex-1 grid grid-cols-4 gap-4">
                                    <div><div className="text-lg font-bold text-white">{ch.sent}</div><div className="text-[10px] text-slate-500">Enviados</div></div>
                                    <div><div className="text-lg font-bold text-white">{ch.responses}</div><div className="text-[10px] text-slate-500">Respostas</div></div>
                                    <div><div className="text-lg font-bold text-white">{ch.qualified}</div><div className="text-[10px] text-slate-500">Qualificados</div></div>
                                    <div><div className="text-lg font-bold text-blue-400">{ch.rate}</div><div className="text-[10px] text-slate-500">Taxa Resposta</div></div>
                                </div>
                                {/* Visual bar */}
                                <div className="w-40 hidden md:block">
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" style={{ width: ch.rate }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* A/B Tests */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50"><h3 className="text-sm font-bold text-white uppercase tracking-wider">Resultados A/B Tests</h3></div>
                {abTestData.map((test, i) => (
                    <div key={i} className="p-6">
                        <h4 className="text-sm text-slate-300 font-medium mb-4">{test.test}</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {[test.variantA, test.variantB].map((v, j) => {
                                const label = j === 0 ? "A" : "B";
                                const isWinner = test.winner === label;
                                return (
                                    <div key={label} className={`p-4 rounded-xl border ${isWinner ? "border-blue-500/30 bg-blue-500/5" : "border-slate-700 bg-slate-800/50"}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isWinner ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-400"}`}>{label}</span>
                                            <span className="text-sm text-white font-medium">{v.name}</span>
                                            {isWinner && <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">VENCEDOR</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div><div className="text-lg font-bold text-white">{v.opens}%</div><div className="text-[10px] text-slate-500">Aberturas</div></div>
                                            <div><div className="text-lg font-bold text-white">{v.responses}%</div><div className="text-[10px] text-slate-500">Respostas</div></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Cadence Comparison */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50"><h3 className="text-sm font-bold text-white uppercase tracking-wider">Comparação entre Cadências</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/50">
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cadência</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Leads</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conversão</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nível</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {cadences.map(c => (
                                <tr key={c.id} className="hover:bg-slate-700/10">
                                    <td className="px-6 py-3 text-sm text-white font-medium">{c.name}</td>
                                    <td className="px-6 py-3 text-sm text-slate-300">{c.leadsActive}</td>
                                    <td className="px-6 py-3 text-sm text-blue-400 font-bold">{c.conversionRate}%</td>
                                    <td className="px-6 py-3 text-xs text-slate-400">{c.automationLevel === "autopilot" ? "Piloto Auto" : c.automationLevel === "semi" ? "Semi" : "Assistido"}</td>
                                    <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === "active" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-slate-700 text-slate-400"}`}>{c.status === "active" ? "Ativa" : c.status === "paused" ? "Pausada" : c.status === "draft" ? "Rascunho" : "Arquivada"}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
