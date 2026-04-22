"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, Clock, Users, ArrowRight, Trash2, Search, Layers, Loader2, CheckCircle, X, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { CompleteScope, getSavedProposals, deleteProposalFromList } from "./_shared";
import Link from "next/link";
import { toast } from "sonner"; // If sonner or react-hot-toast is used. I'll stick to native alert if not available, but let's use standard. I'll use standard window.confirm and generic UI toast if missing, actually let's just do a simple state or simple alert just in case.
import { useConfirm } from "@/providers/confirm-provider";
import { useAuthStore } from "@/stores/auth";

export default function AssemblerListingPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    
    // Check if user has permission to mark proposals as paid
    const canMarkPaid = user?.role === "OWNER" || user?.role === "ADMIN" || 
        user?.permissions?.some((p: any) => p.module === "crm.proposals" && p.action === "mark_paid") || false;
    const [proposals, setProposals] = useState<CompleteScope[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [paidProposalIds, setPaidProposalIds] = useState<Set<string>>(new Set());
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [sendingId, setSendingId] = useState<string | null>(null);

    useEffect(() => {
        getSavedProposals().then(data => {
            const scopes = data.map(d => {
                let sData = d.scopeData as any;
                if (sData && sData.scopeData) sData = sData.scopeData; // fallback retrocompatível para bug antigo onde era salvo em dobro
                return { ...sData, id: d.id, createdAt: d.createdAt, rawMeta: d } as CompleteScope;
            });
            setProposals(scopes);
            setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }, []);

    const confirm = useConfirm();

    const handleMarkPaid = async (proposalId: string) => {
        setSendingId(proposalId);
        try {
            const res = await api(`/api/dev-projects/from-assembled/${proposalId}`, { method: "POST" });
            if (res.success) {
                setPaidProposalIds(prev => new Set(prev).add(proposalId));
                toast.success("Proposta enviada para o Web Dev com sucesso!");
            } else {
                toast.error(res.error?.message || "Erro ao enviar proposta.");
            }
        } catch {
            toast.error("Falha na comunicação com o servidor.");
        } finally {
            setSendingId(null);
            setConfirmingId(null);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const isOk = await confirm({
            title: "Excluir proposta",
            message: "Deseja realmente excluir esta proposta da listagem? Esta ação é irreversível.",
            confirmText: "Sim, excluir",
        });
        
        if (isOk) {
            await deleteProposalFromList(id);
            const data = await getSavedProposals();
            const scopes = data.map(d => {
                let sData = d.scopeData as any;
                if (sData && sData.scopeData) sData = sData.scopeData;
                return { ...sData, id: d.id, createdAt: d.createdAt, rawMeta: d } as CompleteScope;
            });
            setProposals(scopes);
        }
    };

    const handleOpen = (scope: CompleteScope) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("proposals_assembler_current_scope", JSON.stringify(scope));
            router.push("/dashboard/crm/assembler/new/editor");
        }
    };

    const filtered = proposals.filter(p => {
        const term = search.toLowerCase();
        const clientMatch = p.projectSummary?.toLowerCase().includes(term) || false;
        const idMatch = p.id?.toLowerCase().includes(term) || false;
        return clientMatch || idMatch;
    });

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="text-blue-400 animate-spin" /></div>;
    }

    return (
        <>
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
                        <Package className="text-blue-500" /> Montador de Proposta (IA)
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gerencie e visualize todas as estimativas e escopos gerados.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => window.open('/presentation-mestres', '_blank')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all border border-slate-700/50 shadow-lg whitespace-nowrap"
                    >
                        <Sparkles size={18} className="text-[#2997ff]" /> Mestres
                    </button>
                    <button onClick={() => {
                            if (typeof window !== "undefined") {
                                localStorage.removeItem("proposals_assembler_current_scope");
                                localStorage.removeItem("proposals_assembler_current_users");
                                localStorage.removeItem("proposals_assembler_summary");
                            }
                            router.push('/dashboard/crm/assembler/new');
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap"
                    >
                        <Plus size={18} /> Nova Proposta (IA)
                    </button>
                </div>
            </motion.div>

            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-4 sm:p-5 mb-8">
               <div className="flex gap-4">
                   <div className="flex-1 relative">
                       <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                           type="text" 
                           placeholder="Buscar propostas por resumo ou ID..." 
                           value={search}
                           onChange={e => setSearch(e.target.value)}
                           className="w-full bg-slate-900/50 border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 transition-colors"
                       />
                   </div>
               </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/20 border border-white/[0.04] rounded-2xl">
                    <Layers size={48} className="mx-auto text-slate-600 mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-white mb-2">Nenhuma proposta encontrada</h3>
                    <p className="text-slate-400 text-sm">Clique em "Nova Proposta (IA)" para começar a criar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filtered.map((p, idx) => {
                            let totalHours = 0;
                            let screensCount = 0;
                            let modsCount = 0;
                            (p.users || []).forEach(u => (u.platforms || []).forEach(plat => {
                                modsCount += (plat.modules || []).length;
                                (plat.modules || []).forEach(m => {
                                    screensCount += (m.screens || []).length;
                                    (m.screens || []).forEach(s => (s.functionalities || []).forEach(f => {
                                        totalHours += (f.estimatedHours || 0);
                                    }));
                                });
                            }));

                            if (p.integrations) {
                                p.integrations.forEach((i: any) => {
                                    totalHours += (i.estimatedHours || 0);
                                });
                            }
                            
                            const raw = (p as any).rawMeta;
                            let clientNameText = "Sem cliente vinculado";
                            if (raw?.client) {
                                clientNameText = raw.client.name || raw.client.user?.name || "Sem Nome";
                                if (raw.client.companyRef) clientNameText += ` (${raw.client.companyRef.name})`;
                            }

                            return (
                                <motion.div 
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                                    onClick={() => handleOpen(p)}
                                    className="bg-slate-800/40 hover:bg-slate-800/70 cursor-pointer border border-white/[0.06] hover:border-blue-500/30 transition-all rounded-2xl p-6 group relative overflow-hidden flex flex-col min-h-[220px]"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                                    
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="flex-1 pr-4">
                                            <h3 className="font-bold text-white text-lg tracking-tight mb-1 truncate">{p.title || p.projectSummary ? (p.title || p.projectSummary) : "Sem título"}</h3>
                                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide truncate">{clientNameText}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {canMarkPaid && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setConfirmingId(p.id); }}
                                                    disabled={paidProposalIds.has(p.id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        paidProposalIds.has(p.id)
                                                            ? 'bg-green-500/15 text-green-400 border border-green-500/20 cursor-default'
                                                            : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30 hover:border-emerald-400/40'
                                                    }`}
                                                >
                                                    <CheckCircle size={13} />
                                                    {paidProposalIds.has(p.id) ? 'Enviado' : 'Pago'}
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => handleDelete(p.id, e)}
                                                title="Excluir proposta"
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6 relative z-10 flex-1">
                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                            <Users size={16} className="text-slate-500" />
                                            <span>{p.users?.length || 0} Plataformas base</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                            <Layers size={16} className="text-slate-500" />
                                            <span>{screensCount} Telas ({modsCount} módulos)</span>
                                        </div>
                                        {totalHours > 0 && (
                                            <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
                                                <Clock size={16} />
                                                <span>{totalHours} Horas estimadas ad-hoc</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs relative z-10">
                                        <span className="text-slate-500">{new Date(p.createdAt).toLocaleDateString('pt-BR')} às {new Date(p.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span className="flex items-center gap-1 text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
                                            Abrir IA <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>

        {/* Confirm 'Pago' Modal */}
        <AnimatePresence>
            {confirmingId && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setConfirmingId(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/50"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                                <CheckCircle size={22} className="text-emerald-400" />
                            </div>
                            <button onClick={() => setConfirmingId(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Cliente realmente pagou?</h3>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Confirmar o pagamento irá criar automaticamente o projeto no <span className="text-white font-semibold">Web Dev</span> com todas as tarefas e módulos da proposta.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmingId(null)}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 font-medium text-sm transition-all"
                            >
                                Não
                            </button>
                            <button
                                onClick={() => handleMarkPaid(confirmingId)}
                                disabled={sendingId === confirmingId}
                                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                            >
                                {sendingId === confirmingId ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                Sim, confirmar
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
}
