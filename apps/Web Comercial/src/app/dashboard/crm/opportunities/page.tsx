"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Target,
    Plus,
    Search,
    Eye,
    Edit3,
    Building2,
    User,
    DollarSign,
    Calendar,
    Clock,
    TrendingUp,
    TrendingDown,
    X,
    FileText,
    ArrowUp,
    ArrowDown,
    Filter,
    BarChart3,
    Zap,
    ThermometerSun,
    Save,
    MapPin,
    Tag,
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
    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

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

    const totalValue = opportunities.reduce((s, o) => s + (o.value || 0), 0);
    const weightedValue = opportunities.reduce((s, o) => s + ((o.value || 0) * (o.probability || 0) / 100), 0);
    const avgProbability = opportunities.length > 0
        ? Math.round(opportunities.reduce((s, o) => s + (o.probability || 0), 0) / opportunities.length)
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
                    { label: "Oportunidades", value: opportunities.length, icon: Target, color: "text-blue-400" },
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
                        onClick={() => setSelectedOpp(opp)}
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
                                    <div className="w-16 bg-slate-800 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full ${opp.probability >= 70 ? "bg-blue-500" : opp.probability >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${opp.probability}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-white">{opp.probability}%</span>
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

            {/* ═══ DETAIL DRAWER ═══ */}
            <AnimatePresence>
                {selectedOpp && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setSelectedOpp(null)}>
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 shadow-2xl overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        {priorityConfig[selectedOpp.priority] && (
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${priorityConfig[selectedOpp.priority].color}`}>{priorityConfig[selectedOpp.priority].label}</span>
                                        )}
                                        {temperatureConfig[selectedOpp.temperature] && (
                                            <span className="text-sm">{temperatureConfig[selectedOpp.temperature].icon}</span>
                                        )}
                                    </div>
                                    <button onClick={() => setSelectedOpp(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                                </div>

                                <h2 className="text-lg font-bold text-white mb-1">{selectedOpp.title}</h2>
                                <p className="text-sm text-slate-400 mb-6">
                                    {[selectedOpp.client?.company, selectedOpp.client?.name].filter(Boolean).join(" · ") || "Sem cliente"}
                                </p>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-800/50 rounded-xl">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mb-1">Valor</span>
                                            <span className="text-lg font-bold text-blue-400">R$ {selectedOpp.value.toLocaleString("pt-BR")}</span>
                                        </div>
                                        <div className="p-3 bg-slate-800/50 rounded-xl">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mb-1">Probabilidade</span>
                                            <span className="text-lg font-bold text-white">{selectedOpp.probability}%</span>
                                            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                                                <div className={`h-1.5 rounded-full ${selectedOpp.probability >= 70 ? "bg-blue-500" : selectedOpp.probability >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${selectedOpp.probability}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {[
                                            { icon: Building2, label: "Empresa", value: selectedOpp.client?.company || "—" },
                                            { icon: User, label: "Contato", value: selectedOpp.client?.name || "—" },
                                            { icon: User, label: "Consultor", value: selectedOpp.consultant?.name || "—" },
                                            { icon: Target, label: "Estágio", value: selectedOpp.stage?.name || "—" },
                                            { icon: Calendar, label: "Fech. Previsto", value: selectedOpp.expectedClose ? format(new Date(selectedOpp.expectedClose), "dd MMM yyyy", { locale: ptBR }) : "Não definido" },
                                            { icon: Clock, label: "Criado em", value: format(new Date(selectedOpp.createdAt), "dd MMM yyyy", { locale: ptBR }) },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-3 p-2.5 bg-slate-800/30 rounded-lg">
                                                <item.icon size={13} className="text-slate-500 shrink-0" />
                                                <div className="flex items-center justify-between flex-1">
                                                    <span className="text-[10px] text-slate-600">{item.label}</span>
                                                    <span className="text-sm text-white">{item.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1"><Zap size={11} /> Próxima Ação</h4>
                                        <p className="text-sm text-white">{selectedOpp.nextAction || "Nenhuma próxima ação cadastrada. Defina o próximo passo para não esfriar."}</p>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-2">Última Atividade</span>
                                        <p className="text-sm text-slate-400">{selectedOpp.lastActivity || "Nenhum histórico de atividade registrado até o momento."}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedOpp.tags.map((t) => (
                                            <span key={t} className="px-2 py-1 bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 rounded-lg border border-white/[0.04]">{t}</span>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
                                        <button onClick={() => router.push(`/dashboard/crm/pipeline/${selectedOpp.id}`)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all">
                                            <FileText size={14} /> Abrir Pipeline
                                        </button>
                                        <button onClick={() => router.push(`/dashboard/crm/pipeline/${selectedOpp.id}`)} className="px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                                            <Edit3 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ NEW DEAL MODAL HAS BEEN MOVED TO A SEPARATE PAGE ═══ */}
        </div>
    );
}
