"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";

export function KnowledgeTab() {
    const { toast } = useToast();
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadDocs = async () => {
        try {
            const { data } = await api<any[]>("/api/chatbot/knowledge");
            if (data) setDocs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocs();
    }, []);

    const deleteDoc = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este documento?")) return;
        try {
            await api(`/api/chatbot/knowledge/${id}`, { method: "DELETE" });
            toast.success("Documento removido");
            loadDocs();
        } catch (err) {
            toast.error("Erro ao remover");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando base de conhecimento...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-violet-500" />
                    Base de Conhecimento (IA)
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-colors">
                    <Plus size={16} /> Novo Documento
                </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-600 dark:text-blue-400 mb-6">
                <strong>Dica:</strong> Adicione informações sobre seus serviços, preços, diferenciais e processos. A IA usará esses documentos como contexto para responder as dúvidas dos leads de forma inteligente.
            </div>

            {docs.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-violet-600/10 text-violet-500 flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sua base está vazia</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Ensine seu chatbot sobre a sua empresa para que ele possa responder dúvidas dos clientes.
                    </p>
                    <button className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-colors">
                        Adicionar primeiro documento
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docs.map((doc) => (
                        <div key={doc.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-5 rounded-xl flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{doc.title}</h3>
                                <div className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase shrink-0 ml-2 ${doc.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                    {doc.isActive ? 'Ativo' : 'Inativo'}
                                </div>
                            </div>
                            
                            <div className="text-xs text-slate-500 mb-4 flex-1 line-clamp-3">
                                {doc.content}
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                <span className="text-[10px] uppercase text-slate-400 font-bold bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                                    {doc.category || 'Geral'}
                                </span>
                                <div className="flex gap-2">
                                    <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => deleteDoc(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
