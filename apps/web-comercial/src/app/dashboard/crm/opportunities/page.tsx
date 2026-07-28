"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Target,
    Plus,
    Search,
    Building2,
    User,
    DollarSign,
    TrendingUp,
    BarChart3,
    Zap,
    Calendar,
} from "lucide-react";

/* ═══════════════════════════════════════ */
/* TYPES & CONFIGURATIONS                 */
/* ═══════════════════════════════════════ */
interface Opportunity {
    id: string;
    title: string;
    value: number;
    probability: number;
    priority: "high" | "medium" | "low";
    source: string;
    expectedClose: string | null;
    temperature: "hot" | "warm" | "cold";
    nextAction: string | null;
    lastActivity: string | null;
    tags: string[];
    createdAt: string;
    status: "open" | "won" | "lost";
    client: {
        id: string;
        name: string;
        company: string | null;
        email: string | null;
    } | null;
    consultant: {
        id: string;
        name: string;
        avatar: string | null;
    } | null;
    stage: {
        id: string;
        name: string;
        color: string;
    } | null;
}

const priorityConfig: Record<string, { label: string; color: string }> = {
    high: { label: "Alta", color: "text-red-400 bg-red-500/10 border-red-500/20" },
    medium: { label: "Média", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    low: { label: "Baixa", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
};

const temperatureConfig: Record<string, { label: string; color: string; icon: string }> = {
    hot: { label: "Quente", color: "text-red-400", icon: "🔥" },
    warm: { label: "Morna", color: "text-amber-400", icon: "☀️" },
    cold: { label: "Fria", color: "text-blue-400", icon: "❄️" },
};

import { api } from "@/lib/api";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ═══════════════════════════════════════ */
/* COMPONENT                               */
/* ═══════════════════════════════════════ */
export default function OpportunitiesPage() {
    const router = useRouter();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterTemperature, setFilterTemperature] = useState("all");
    const [sortBy, setSortBy] = useState<"value" | "probability" | "expectedClose">("value");
    const [activeTab, setActiveTab] = useState<"abertos" | "fechados" | "perdidos">("abertos");

    useEffect(() => {
        loadDeals();
    }, []);

    const loadDeals = async () => {
        try {
            setLoading(true);
            const response = await api<{
                id: string;
                title: string;
                value: number;
                probability: number;
                priority: "high" | "medium" | "low";
                source: string;
                expectedClose: string | null;
                temperature: "hot" | "warm" | "cold";
                nextAction: string | null;
                lastActivity: string | null;
                tags: string[];
                createdAt: string;
                status: "open" | "won" | "lost";
                client: {
                    id: string;
                    name: string;
                    company: string;
                    email: string;
                };
                consultant: {
                    id: string;
                    name: string;
                    avatar: string | null;
                };
                stage: {
                    id: string;
                    name: string;
                    color: string;
                };
            }[]>("/api/deals", { method: 'GET' });
            setOpportunities(response.data || []);
        } catch (error) {
            console.error("Erro ao carregar opportunities:", error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = opportunities
        .filter((o) => {
            if (activeTab === "abertos") return o.status === "open";
            if (activeTab === "fechados") return o.status === "won";
            if (activeTab === "perdidos") return o.status === "lost";
            return true;
        })
        .filter((o) => {
            const q = searchQuery.toLowerCase();
            return o.title.toLowerCase().includes(q) ||
                (o.client?.company || "").toLowerCase().includes(q) ||
                (o.client?.name || "").toLowerCase().includes(q);
        })
        .filter((o) => filterPriority === "all" || o.priority === filterPriority)
        .filter((o) => filterTemperature === "all" || o.temperature === filterTemperature)
        .sort((a, b) => {
            if (sortBy === "value") return b.value - a.value;
            if (sortBy === "probability") return b.probability - a.probability;
            return 0;
        });

    const totalValue = filtered.reduce((s, o) => s + (o.value || 0), 0);
    const weightedValue = filtered.reduce((s, o) => s + ((o.value || 0) * (o.probability || 0) / 100), 0);
    const avgProbability = filtered.length > 0
        ? Math.round(filtered.reduce((s, o) => s + (o.probability || 0), 0) / filtered.length)
        : 0;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Target size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Oportunidades</h1>
                            <p className="text-sm text-slate-400">Acompanhe e gerencie todas as oportunidades de negócio</p>
                        </div>
                    </div>
                    <button onClick={() => router.push('/dashboard/crm/opportunities/new')} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Nova Oportunidade
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Oportunidades", value: filtered.length, icon: Target, color: "text-blue-400" },
                    { label: "Valor Total", value: `R$ ${(totalValue / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-blue-400" },
                    { label: "Valor Ponderado", value: `R$ ${(weightedValue / 1000).toFixed(0)}k`, icon: TrendingUp, color: "text-purple-400" },
                    { label: "Probabilidade Média", value: `${avgProbability}%`, icon: BarChart3, color: "text-amber-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-xl font-bold text-white block">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.08] mb-6 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab("abertos")}
                    className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === "abertos" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                >
                    Em Aberto ({opportunities.filter(o => o.status === "open" || !o.status).length})
                </button>
                <button
                    onClick={() => setActiveTab("fechados")}
                    className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === "fechados" ? "border-green-500 text-green-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                >
                    Ganhos ({opportunities.filter(o => o.status === "won").length})
                </button>
                <button
                    onClick={() => setActiveTab("perdidos")}
                    className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === "perdidos" ? "border-red-500 text-red-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                >
                    Perdidos ({opportunities.filter(o => o.status === "lost").length})
                </button>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar oportunidade..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40" />
                </div>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none">
                    <option value="all">Todas prioridades</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                </select>
                <select value={filterTemperature} onChange={(e) => setFilterTemperature(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none">
                    <option value="all">Todas temperaturas</option>
                    <option value="hot">🔥 Quente</option>
                    <option value="warm">☀️ Morna</option>
                    <option value="cold">❄️ Fria</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none">
                    <option value="value">Ordenar: Valor</option>
                    <option value="probability">Ordenar: Probabilidade</option>
                </select>
            </div>

            {/* Opportunity Cards */}
            <div className="space-y-3">
                {filtered.map((opp, i) => (
                    <motion.div
                        key={opp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => router.push(`/dashboard/crm/pipeline/${opp.id}`)}
                        className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.02] hover:border-white/10 transition-all cursor-pointer group"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-bold text-white">{opp.title}</h3>
                                    {priorityConfig[opp.priority] && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${priorityConfig[opp.priority].color}`}>{priorityConfig[opp.priority].label}</span>
                                    )}
                                    {temperatureConfig[opp.temperature] && (
                                        <span className="text-sm">{temperatureConfig[opp.temperature].icon}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3">
                                    {opp.client?.company && <span className="flex items-center gap-1"><Building2 size={10} /> {opp.client.company}</span>}
                                    {opp.client?.name && <span className="flex items-center gap-1"><User size={10} /> {opp.client.name}</span>}
                                    {opp.consultant?.name && <span className="flex items-center gap-1"><User size={10} /> {opp.consultant.name}</span>}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {opp.tags.map((t) => (
                                        <span key={t} className="px-2 py-0.5 bg-slate-800 text-[8px] font-bold uppercase tracking-wider text-slate-500 rounded">{t}</span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 text-[10px] text-slate-600">
                                    {opp.stage && (
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opp.stage.color }}></div>
                                        Estágio: <span className="text-slate-400 font-medium">{opp.stage.name}</span>
                                    </span>
                                    )}
                                    <span>Fecha em: <span className="text-slate-400">{opp.expectedClose ? format(new Date(opp.expectedClose), "dd MMM yyyy", { locale: ptBR }) : "Não definido"}</span></span>
                                    <span>Origem: <span className="text-slate-400">{opp.source}</span></span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-lg font-bold text-blue-400 block">R$ {(opp.value / 1000).toFixed(0)}k</span>
                                <div className="flex items-center gap-1 justify-end mb-2">
                                    <div className="w-16 bg-slate-800 rounded-full h-1.5 opacity-40">
                                        <div className={`h-1.5 rounded-full ${opp.probability >= 70 ? "bg-blue-500" : opp.probability >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${opp.probability}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 opacity-60">{opp.probability}%</span>
                                </div>
                                <span className="text-[10px] text-slate-600">Ponderado: R$ {((opp.value * opp.probability / 100) / 1000).toFixed(0)}k</span>
                            </div>
                        </div>

                        {/* Next Action */}
                        {(opp.nextAction || opp.lastActivity) && (
                            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2">
                                <Zap size={12} className="text-amber-400 shrink-0" />
                                <span className="text-[11px] text-slate-400">Próxima ação: <span className="text-white">{opp.nextAction || "Nenhuma ação definida"}</span></span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-slate-600">
                    <Target size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nenhuma oportunidade encontrada</p>
                </div>
            )}

        </div>
    );
}
