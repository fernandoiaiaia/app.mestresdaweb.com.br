"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import {
    Kanban,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    User,
    DollarSign,
    Calendar,
    Clock,
    ArrowRight,
    Eye,
    Edit3,
    Trash2,
    ChevronDown,
    Phone,
    Mail,
    Building2,
    GripVertical,
    X,
    MessageSquare,
    Send,
    FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════ */
/* MOCK DATA                               */
/* ═══════════════════════════════════════ */
interface Deal {
    id: string;
    title: string;
    value: number;
    probability: number;
    stageId: string;
    tags: string[];
    client?: { company: string; name: string };
    consultant?: { name: string };
    daysInStage?: number;
    lastActivity?: string;
}

interface Stage {
    id: string;
    name: string;
    color: string;
}

const stageColors: Record<string, { bg: string; border: string; header: string; dot: string }> = {
    blue: { bg: "bg-blue-500/5", border: "border-blue-500/10", header: "text-blue-400", dot: "bg-blue-500" },
    purple: { bg: "bg-purple-500/5", border: "border-purple-500/10", header: "text-purple-400", dot: "bg-purple-500" },
    amber: { bg: "bg-amber-500/5", border: "border-amber-500/10", header: "text-amber-400", dot: "bg-amber-500" },
    orange: { bg: "bg-orange-500/5", border: "border-orange-500/10", header: "text-orange-400", dot: "bg-orange-500" },
    green: { bg: "bg-blue-500/5", border: "border-blue-500/10", header: "text-blue-400", dot: "bg-blue-500" },
    red: { bg: "bg-red-500/5", border: "border-red-500/10", header: "text-red-400", dot: "bg-red-500" },
};

/* ═══════════════════════════════════════ */
/* COMPONENT                               */
/* ═══════════════════════════════════════ */
export default function PipelinePage() {
    const [funnels, setFunnels] = useState<any[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [draggedDeal, setDraggedDeal] = useState<{ dealId: string; fromStage: string } | null>(null);
    const router = useRouter();

    const loadPipeline = async () => {
        try {
            setIsLoading(true);
            const { data: funnelsData } = await api<any[]>('/api/funnels', { method: "GET" });
            const funcs = funnelsData || [];
            setFunnels(funcs);

            let activeFunnel = funcs.find((f: any) => f.isDefault) || funcs[0];
            if (!activeFunnel) return;

            setSelectedFunnel(activeFunnel.id);
            setStages(activeFunnel.stages || []);

            const { data: dealsData } = await api<Deal[]>(`/api/deals?funnelId=${activeFunnel.id}`, { method: "GET" });
            setDeals(dealsData || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPipeline();
    }, []);

    const pipelineStages = stages.map(stage => ({
        ...stage,
        deals: deals.filter(d => d.stageId === stage.id)
    }));

    const totalPipeline = deals.reduce((s, d) => s + (d.value || 0), 0);
    const totalDeals = deals.length;
    const weightedPipeline = deals.reduce((s, d) => s + ((d.value || 0) * (d.probability || 0) / 100), 0);

    const handleDragStart = (dealId: string, stageId: string) => {
        setDraggedDeal({ dealId, fromStage: stageId });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (toStageId: string) => {
        if (!draggedDeal) return;
        if (draggedDeal.fromStage === toStageId) { setDraggedDeal(null); return; }

        const dealId = draggedDeal.dealId;

        // Optimistic UI update
        setDeals((prev) => prev.map(d => d.id === dealId ? { ...d, stageId: toStageId, daysInStage: 0 } : d));
        setDraggedDeal(null);

        try {
            await api(`/api/deals/${dealId}/stage`, {
                method: "PUT", body: { stageId: toStageId }
            });
        } catch (e) {
            console.error(e);
            loadPipeline(); // Rollback
        }
    };

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Kanban size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Pipeline de Vendas</h1>
                            <p className="text-sm text-slate-400">Gerencie oportunidades e acompanhe o funil de vendas</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input type="text" placeholder="Buscar deal..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 w-56" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-6 mb-6 px-1">
                {[
                    { label: "Pipeline Total", value: `R$ ${(totalPipeline / 1000).toFixed(0)}k` },
                    { label: "Pipeline Ponderado", value: `R$ ${(weightedPipeline / 1000).toFixed(0)}k` },
                    { label: "Deals Ativos", value: totalDeals },
                ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{s.label}:</span>
                        <span className="text-sm font-bold text-white">{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar" style={{ minHeight: "calc(100vh - 250px)" }}>
                {pipelineStages.map((stage) => {
                    const colors = stageColors[stage.color] || stageColors['blue'];
                    const stageTotal = stage.deals.reduce((s, d) => s + (d.value || 0), 0);
                    const filteredDeals = stage.deals.filter((d) => {
                        const q = searchQuery.toLowerCase();
                        const clientName = d.client?.name?.toLowerCase() || "";
                        const clientCompany = d.client?.company?.toLowerCase() || "";
                        return d.title.toLowerCase().includes(q) || clientCompany.includes(q) || clientName.includes(q);
                    });

                    return (
                        <div
                            key={stage.id}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(stage.id)}
                            className={`flex-shrink-0 w-[300px] rounded-2xl border ${colors.border} ${colors.bg} flex flex-col`}
                        >
                            {/* Stage Header */}
                            <div className="px-4 py-3 border-b border-white/[0.04]">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                        <span className={`text-xs font-bold uppercase tracking-widest ${colors.header}`}>{stage.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded">{stage.deals.length}</span>
                                </div>
                                <span className="text-[10px] text-slate-600">R$ {(stageTotal / 1000).toFixed(0)}k</span>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
                                {filteredDeals.map((deal) => (
                                    <div
                                        key={deal.id}
                                        draggable
                                        onDragStart={() => handleDragStart(deal.id, stage.id)}
                                        onClick={() => router.push(`/dashboard/crm/pipeline/${deal.id}`)}
                                        className="bg-slate-900/70 border border-white/[0.06] rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-white/10 transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-white leading-snug">{deal.title}</h4>
                                            <button className="p-0.5 text-slate-700 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><MoreHorizontal size={14} /></button>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Building2 size={11} className="text-slate-600" />
                                            <span className="text-[11px] text-slate-400">{deal.client?.company || "Sem empresa"}</span>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-blue-400">R$ {((deal.value || 0) / 1000).toFixed(0)}k</span>
                                            <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{deal.probability || 0}%</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {(deal.tags || []).map((t) => (
                                                <span key={t} className="px-1.5 py-0.5 bg-slate-800/80 text-[8px] font-bold uppercase tracking-wider text-slate-500 rounded">{t}</span>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-600">
                                            <span className="flex items-center gap-1"><User size={10} /> {deal.consultant?.name?.split(" ")[0] || "Sistema"}</span>
                                            <span className="flex items-center gap-1"><Clock size={10} /> {deal.daysInStage || 0}d</span>
                                        </div>
                                    </div>
                                ))}

                                {filteredDeals.length === 0 && (
                                    <div className="text-center py-8">
                                        <span className="text-[10px] text-slate-700 uppercase tracking-widest">Vazio</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══ DEAL DETAIL DRAWER ═══ */}
            <AnimatePresence>
                {selectedDeal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setSelectedDeal(null)}>
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 shadow-2xl overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-white">{selectedDeal.title}</h2>
                                    <button onClick={() => setSelectedDeal(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-800/50 rounded-xl">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-1">Valor</span>
                                            <span className="text-lg font-bold text-blue-400">R$ {selectedDeal.value.toLocaleString("pt-BR")}</span>
                                        </div>
                                        <div className="p-3 bg-slate-800/50 rounded-xl">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-1">Probabilidade</span>
                                            <span className="text-lg font-bold text-white">{selectedDeal.probability}%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { icon: Building2, label: "Empresa", value: selectedDeal.client?.company || "N/A" },
                                            { icon: User, label: "Contato", value: selectedDeal.client?.name || "N/A" },
                                            { icon: User, label: "Consultor", value: selectedDeal.consultant?.name || "N/A" },
                                            { icon: Clock, label: "Dias no Estágio", value: `${selectedDeal.daysInStage || 0} dias` },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
                                                <item.icon size={14} className="text-slate-500 shrink-0" />
                                                <div>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block">{item.label}</span>
                                                    <span className="text-sm text-white">{item.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-2">Última Atividade</span>
                                        <p className="text-sm text-slate-400">{selectedDeal.lastActivity}</p>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-2">Tags</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(selectedDeal.tags || []).map((t) => (
                                                <span key={t} className="px-2 py-1 bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 rounded-lg border border-white/[0.04]">{t}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
                                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all">
                                            <FileText size={14} /> Criar Proposta
                                        </button>
                                        <button className="px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                                            <Edit3 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
