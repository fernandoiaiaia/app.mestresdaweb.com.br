"use client";

import { useState, useEffect } from "react";
import { Search, Plus, MoreHorizontal, MessageCircle, Clock, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

const stageColors: Record<string, { bg: string; border: string; header: string; dot: string }> = {
    blue: { bg: "bg-blue-500/5", border: "border-blue-500/10", header: "text-blue-400", dot: "bg-blue-500" },
    purple: { bg: "bg-purple-500/5", border: "border-purple-500/10", header: "text-purple-400", dot: "bg-purple-500" },
    amber: { bg: "bg-amber-500/5", border: "border-amber-500/10", header: "text-amber-400", dot: "bg-amber-500" },
    orange: { bg: "bg-orange-500/5", border: "border-orange-500/10", header: "text-orange-400", dot: "bg-orange-500" },
    green: { bg: "bg-emerald-500/5", border: "border-emerald-500/10", header: "text-emerald-400", dot: "bg-emerald-500" },
    red: { bg: "bg-red-500/5", border: "border-red-500/10", header: "text-red-400", dot: "bg-red-500" },
};

export function WhatsappKanban() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [search, setSearch] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [stages, setStages] = useState<any[]>([]);
    const [deals, setDeals] = useState<any[]>([]);

    useEffect(() => {
        const loadPipeline = async () => {
            try {
                setIsLoading(true);
                const { data: funnelsData } = await api<any[]>('/api/funnels', { method: "GET" });
                const funcs = funnelsData || [];
                
                let activeFunnel = funcs.find((f: any) => f.isDefault) || funcs[0];
                if (!activeFunnel) {
                    setIsLoading(false);
                    return;
                }

                setStages(activeFunnel.stages || []);

                // Pull deals connected to this funnel
                const { data: dealsData } = await api<any[]>(`/api/deals?funnelId=${activeFunnel.id}`, { method: "GET" });
                const openDeals = (dealsData || []).filter(d => !d.status || d.status === "open");
                setDeals(openDeals);
            } catch (error) {
                console.error("Error loading funnel for Whatsapp Kanban", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPipeline();
    }, []);

    // Filter deals globally beforehand
    const getFilteredStageDeals = (stageId: string) => {
        return deals.filter(d => {
            if (d.stageId !== stageId) return false;
            
            const q = search.toLowerCase();
            const clientName = d.client?.name?.toLowerCase() || "";
            const clientCompany = d.client?.company?.toLowerCase() || "";
            return (d.title || "").toLowerCase().includes(q) || clientCompany.includes(q) || clientName.includes(q);
        });
    };

    return (
        <div className="h-full flex flex-col flex-1 relative overflow-hidden">
            
            {/* Header */}
            <div className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-slate-900/10 backdrop-blur-md shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Pipeline de Vendas (WhatsApp)</h1>
                    <p className="text-sm text-slate-400 mt-1">Sincronizado com os Fúnis Oficiais do CRM.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Pesquisar leads..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 w-64 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => router.push("/dashboard/crm/opportunities/new")}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={16} /> Novo Lead
                    </button>
                </div>
            </div>

            {/* Kanban Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar p-6 lg:p-8">
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="w-8 h-8 rounded-full border-t-2 border-blue-500 animate-spin"></div>
                        <span className="text-sm font-medium text-slate-500 tracking-widest uppercase">Sincronizando Leads via API...</span>
                    </div>
                ) : (
                    <div className="flex items-start gap-6 h-full min-w-max pb-4">
                        {stages.map((stage) => {
                            const colors = stageColors[stage.color] || stageColors['blue'];
                            const stageDeals = getFilteredStageDeals(stage.id);
                            
                            // Group deals by client to show ONE card per contact
                            const clientMap = new Map<string, { client: any; deals: any[]; latestDeal: any }>();
                            stageDeals.forEach(deal => {
                                const key = deal.clientId || deal.id;
                                if (!clientMap.has(key)) {
                                    clientMap.set(key, { client: deal.client, deals: [], latestDeal: deal });
                                }
                                clientMap.get(key)!.deals.push(deal);
                            });
                            const contacts = Array.from(clientMap.values());

                            return (
                                <div key={stage.id} className={`w-[320px] shrink-0 flex flex-col h-full max-h-full rounded-2xl border ${colors.border} ${colors.bg}`}>
                                    
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between mx-3 mt-3 mb-4 bg-slate-800/40 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${colors.dot} shadow-sm shadow-black/50`}></div>
                                            <h3 className={`text-[15px] font-bold tracking-tight ${colors.header}`}>{stage.name}</h3>
                                            <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-[11px] font-bold rounded-full">
                                                {contacts.length}
                                            </span>
                                        </div>
                                        <button className="text-slate-500 hover:text-white transition-colors" title="Mais opções">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </div>

                                    {/* Column Cards Container */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 pb-4 px-3">
                                        {contacts.map(({ client, deals: contactDeals, latestDeal }) => {
                                            
                                            const name = client?.name || client?.company || latestDeal.title || "Contato sem nome";
                                            const totalValue = contactDeals.reduce((sum, d) => sum + (d.value || 0), 0);
                                            const time = latestDeal.daysInStage ? `${latestDeal.daysInStage} dias` : "Hoje";
                                            const dealCount = contactDeals.length;

                                            return (
                                                <div 
                                                    key={client?.id || latestDeal.id} 
                                                    onClick={() => {
                                                        const targetPhone = client?.phone;
                                                        if (targetPhone) {
                                                            const tName = client?.name || client?.company || latestDeal.title || "Novo Lead";
                                                            router.push(`/dashboard/whatsapp?phone=${targetPhone}&name=${encodeURIComponent(tName)}`);
                                                        } else {
                                                            router.push("/dashboard/whatsapp");
                                                        }
                                                    }}
                                                    className="bg-slate-800/40 backdrop-blur-md border border-white/[0.08] p-4 rounded-2xl cursor-pointer hover:border-white/20 hover:bg-slate-800/60 transition-all group relative shadow-lg shadow-black/20"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                                                                {name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors leading-tight truncate w-36">{name}</h4>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <Clock size={10} className="text-slate-500" />
                                                                    <span className="text-[10px] text-slate-500 font-medium">{time}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Deal titles preview */}
                                                    <div className="mb-3 space-y-0.5">
                                                        {contactDeals.slice(0, 2).map(d => (
                                                            <p key={d.id} className="text-[10px] text-slate-500 truncate">• {d.title}</p>
                                                        ))}
                                                        {contactDeals.length > 2 && (
                                                            <p className="text-[10px] text-slate-600">+{contactDeals.length - 2} mais...</p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between mt-auto">
                                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                                            {dealCount} {dealCount === 1 ? "Oportunidade" : "Oportunidades"}
                                                        </span>
                                                        
                                                        <div className="flex items-center gap-2 text-slate-500">
                                                            <span className="text-[10px] font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded mr-1">
                                                                R$ {(totalValue / 1000).toFixed(0)}k
                                                            </span>
                                                            <MessageCircle size={14} className="hover:text-blue-400 transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {stageDeals.length === 0 && (
                                            <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                                                <AlertCircle size={24} className="mb-2 opacity-50" />
                                                <p className="text-xs font-medium">Nenhum lead nesta etapa</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
