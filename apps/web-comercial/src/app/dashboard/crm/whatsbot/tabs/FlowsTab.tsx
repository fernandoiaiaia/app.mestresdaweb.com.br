"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Plus, Edit, Trash2, GitMerge } from "lucide-react";

export function FlowsTab() {
    const { toast } = useToast();
    const [flows, setFlows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFlows = async () => {
        try {
            const { data } = await api<any[]>("/api/chatbot/flows");
            if (data) setFlows(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFlows();
    }, []);

    const deleteFlow = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este fluxo?")) return;
        try {
            await api(`/api/chatbot/flows/${id}`, { method: "DELETE" });
            toast.success("Fluxo removido");
            loadFlows();
        } catch (err) {
            toast.error("Erro ao remover");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando fluxos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GitMerge size={20} className="text-violet-500" />
                    Fluxos do Chatbot
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-colors">
                    <Plus size={16} /> Novo Fluxo
                </button>
            </div>

            {flows.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-violet-600/10 text-violet-500 flex items-center justify-center mx-auto mb-4">
                        <GitMerge size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum fluxo criado</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Crie fluxos de conversa vinculados às etapas do seu funil para qualificar leads automaticamente.
                    </p>
                    <button className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-colors">
                        Criar meu primeiro fluxo
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flows.map((flow) => (
                        <div key={flow.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-5 rounded-xl flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-slate-900 dark:text-white">{flow.name}</h3>
                                <div className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${flow.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                    {flow.isActive ? 'Ativo' : 'Inativo'}
                                </div>
                            </div>
                            
                            <div className="text-xs text-slate-500 mb-4 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">Funil:</span> {flow.funnel?.name}
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">Etapa:</span> {flow.stage?.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Modo:</span> <span className="uppercase">{flow.mode}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => deleteFlow(flow.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
