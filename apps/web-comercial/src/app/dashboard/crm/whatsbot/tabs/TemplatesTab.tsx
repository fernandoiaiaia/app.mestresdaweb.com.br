"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Plus, LayoutTemplate, RefreshCw, Trash2, ExternalLink } from "lucide-react";

export function TemplatesTab() {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const loadTemplates = async () => {
        try {
            const { data } = await api<any[]>("/api/chatbot/templates");
            if (data) setTemplates(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const syncTemplates = async () => {
        setSyncing(true);
        try {
            await api("/api/chatbot/templates/sync", { method: "POST" });
            toast.success("Status sincronizados com a Meta");
            await loadTemplates();
        } catch (err) {
            toast.error("Erro ao sincronizar");
        } finally {
            setSyncing(false);
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm("Remover template? (Isto removerá apenas do ProposalAI, não do WhatsApp Manager)")) return;
        try {
            await api(`/api/chatbot/templates/${id}`, { method: "DELETE" });
            toast.success("Template removido do painel");
            loadTemplates();
        } catch (err) {
            toast.error("Erro ao remover");
        }
    };

    const getStatusBadge = (status: string, reason?: string) => {
        switch (status) {
            case 'APPROVED': 
                return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded uppercase">Aprovado</span>;
            case 'PENDING': 
                return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded uppercase">Em Análise</span>;
            case 'REJECTED': 
                return (
                    <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded uppercase">Rejeitado</span>
                        {reason && <span className="text-[9px] text-red-400 max-w-[150px] truncate" title={reason}>{reason}</span>}
                    </div>
                );
            case 'PAUSED': 
            case 'DISABLED':
                return <span className="px-2 py-1 bg-slate-500/10 text-slate-500 text-[10px] font-bold rounded uppercase">Pausado</span>;
            default: 
                return <span className="px-2 py-1 bg-slate-500/10 text-slate-500 text-[10px] font-bold rounded uppercase">{status}</span>;
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando templates...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <LayoutTemplate size={20} className="text-violet-500" />
                    Templates do WhatsApp (Meta)
                </h2>
                <div className="flex gap-2">
                    <button 
                        onClick={syncTemplates}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={syncing ? "animate-spin" : ""} /> 
                        {syncing ? 'Sincronizando...' : 'Sincronizar Status'}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-colors">
                        <Plus size={16} /> Novo Template
                    </button>
                </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-600 dark:text-blue-400 mb-6 flex items-start gap-3">
                <LayoutTemplate size={20} className="shrink-0 mt-0.5" />
                <div>
                    <strong>Atenção:</strong> Templates criados aqui são enviados para aprovação da Meta. O envio de mensagens OUTBOUND (iniciadas por você) só é permitido usando um template <strong>APROVADO</strong>. 
                    <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold ml-1 hover:underline">
                        Acessar WhatsApp Manager <ExternalLink size={12} />
                    </a>
                </div>
            </div>

            {templates.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-violet-600/10 text-violet-500 flex items-center justify-center mx-auto mb-4">
                        <LayoutTemplate size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum template local</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        Você precisa de templates para iniciar conversas com leads (Fluxo Outbound). Crie seu primeiro template e aguarde a aprovação da Meta.
                    </p>
                    <button className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-colors">
                        Criar Template Outbound
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                        <div key={template.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-5 rounded-xl flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{template.name}</h3>
                                    <span className="text-[10px] uppercase text-slate-400 font-bold">{template.category} • {template.language}</span>
                                </div>
                                {getStatusBadge(template.status, template.rejectionReason)}
                            </div>
                            
                            <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                                {template.headerText && <div className="font-bold mb-2">{template.headerText}</div>}
                                <div className="whitespace-pre-wrap">{template.bodyText}</div>
                                {template.footerText && <div className="text-xs text-slate-400 mt-2">{template.footerText}</div>}
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                <span className="text-xs text-slate-500 font-mono" title="Meta ID">{template.metaTemplateId || 'Sem ID'}</span>
                                <button onClick={() => deleteTemplate(template.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
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
