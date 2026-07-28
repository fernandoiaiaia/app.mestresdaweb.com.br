"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Clock, Layout, CheckCircle2, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import MatrixRain from "@/components/shared/MatrixRain";

type ClientFeedback = {
    id: string;
    screenId: string;
    screenTitle: string;
    moduleName: string;
    text: string;
    author?: string;
    date: string;
    read: boolean;
};

export default function ProposalFeedbackHistoryPage({ params }: { params: Promise<{ proposalId: string }> }) {
    const router = useRouter();
    const unwrappedParams = React.use(params);
    const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (screenId: string) => {
        setCollapsedGroups(prev => ({ ...prev, [screenId]: !prev[screenId] }));
    };

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api<ClientFeedback[]>(`/api/assembler/proposals/${unwrappedParams.proposalId}/feedback`);
                if (res.success && res.data) {
                    // Ordenar do mais novo para o mais antigo
                    setFeedbacks(res.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                }
            } catch (e) {
                console.error("Failed to load feedbacks:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [unwrappedParams.proposalId]);

    return (
        <div className="relative min-h-screen bg-slate-900 text-white selection:bg-blue-500/30 pb-32">
            <MatrixRain />

            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-3xl border-b border-slate-700/50">
                <div className="relative z-10 max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push(`/dashboard/crm/assembler/new/editor?id=${unwrappedParams.proposalId}`)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50" title="Voltar para o Editor">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                                <MessageCircle size={20} className="text-red-500" />
                                Histórico de Feedbacks
                            </h2>
                            <p className="text-[11px] font-medium tracking-widest text-slate-500 uppercase">Proposta: {unwrappedParams.proposalId}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-[11px] font-bold text-slate-400">
                            Total: {feedbacks.length} Mensagens
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-[800px] mx-auto px-6 pt-12 space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-500 gap-3">
                        <Clock className="animate-spin text-red-500" />
                        <span>Carregando histórico...</span>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                        <MessageCircle size={48} className="mb-4 opacity-20" />
                        <p>Nenhum feedback registrado pelo cliente até o momento.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.values(feedbacks.reduce((acc, fb) => {
                            const key = fb.screenId || fb.screenTitle;
                            if (!acc[key]) acc[key] = { screenId: fb.screenId, screenTitle: fb.screenTitle, moduleName: fb.moduleName, comments: [] };
                            acc[key].comments.push(fb);
                            return acc;
                        }, {} as Record<string, { screenId: string; screenTitle: string; moduleName: string; comments: typeof feedbacks }>))
                        .map(group => (
                            <div key={group.screenId} className="bg-slate-800/20 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-md transition-all">
                                <div onClick={() => toggleGroup(group.screenId)} className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-transparent hover:bg-slate-800 transition-colors cursor-pointer group/header">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center border border-slate-600/30 group-hover/header:border-red-500/30 transition-colors">
                                            <Layout size={18} className="text-slate-400 group-hover/header:text-red-400 transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{group.screenTitle}</h3>
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{group.moduleName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1 bg-slate-900/50 rounded-full text-xs font-bold text-slate-400 border border-slate-700/30">
                                            {group.comments.length} Mensagen{group.comments.length !== 1 ? 's' : ''}
                                        </div>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-600/30 text-slate-400 bg-slate-800 group-hover/header:bg-slate-700 transition-colors">
                                            <ChevronDown size={14} className={`transition-transform duration-300 ${collapsedGroups[group.screenId] ? '' : 'rotate-180'}`} />
                                        </div>
                                    </div>
                                </div>
                                {!collapsedGroups[group.screenId] && (
                                    <div className="p-6 space-y-6 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-2">
                                        {group.comments.map((fb, idx) => (
                                            <div key={fb.id} className={`relative flex gap-4 ${idx !== group.comments.length - 1 ? 'pb-6 border-b border-slate-700/30' : ''}`}>
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${fb.read ? 'bg-green-500/5 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]'}`}>
                                                        {fb.author ? fb.author.charAt(0).toUpperCase() : "?"}
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{fb.author || "Cliente"}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                    <Clock size={10} />
                                                                    {new Date(fb.date).toLocaleString("pt-BR")}
                                                                </span>
                                                                {fb.read ? (
                                                                    <span className="text-[9px] text-green-500 border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                        <CheckCircle2 size={8} /> Lida
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] text-red-400 border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 rounded">Não Lida</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-black/20 p-4 rounded-xl border border-slate-800">
                                                        <p className="text-[13px] text-slate-300 leading-relaxed">
                                                            &quot;{fb.text}&quot;
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
