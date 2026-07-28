"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Mail, Plus, Settings, Check, Type, Variable, Trash2, Edit } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

export default function EmailTemplatesPage() {
    const { toast } = useToast();
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [isSaving, setIsSaving] = useState(false);

    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(30);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadTemplates();
    }, [currentPage, limit]);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await api<any>(`/api/contracts/email-templates?page=${currentPage}&limit=${limit}`);
            if (res.success && res.data) {
                setTemplates(res.data as any);
                if ((res as any).pagination) {
                    setTotalPages((res as any).pagination.totalPages);
                }
            }
        } catch (error) {
            toast.error("Erro", "Falha ao carregar modelos");
        } finally {
            setIsLoading(false);
        }
    };

    const [currentTemplate, setCurrentTemplate] = useState({ id: "", name: "", subject: "", content: "", type: "invite", isDefault: false });

    const openEditor = (template?: any) => {
        if (template) {
            setCurrentTemplate({ ...template });
        } else {
            setCurrentTemplate({ id: "", name: "", subject: "", content: "", type: "invite", isDefault: false });
        }
        setView('edit');
    };

    const handleSave = async () => {
        if (!currentTemplate.name || !currentTemplate.subject || !currentTemplate.content) {
            toast.error("Campos Obrigatórios", "Preencha o nome, assunto e o corpo do e-mail.");
            return;
        }

        setIsSaving(true);
        try {
            let res;
            if (!currentTemplate.id) {
                res = await api<any>('/api/contracts/email-templates', { method: 'POST', body: currentTemplate });
            } else {
                res = await api<any>(`/api/contracts/email-templates/${currentTemplate.id}`, { method: 'PUT', body: currentTemplate });
            }
            if (res.success) {
                toast.success("Sucesso", "Modelo salvo com sucesso.");
                setView('list');
                loadTemplates();
            } else {
                toast.error("Erro", res.error?.message || "Erro ao salvar modelo");
            }
        } catch (error) {
            toast.error("Erro", "Não foi possível salvar o modelo.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este modelo?")) return;
        try {
            const res = await api<any>(`/api/contracts/email-templates/${id}`, { method: 'DELETE' });
            if (res.success) {
                toast.success("Sucesso", "Modelo excluído");
                loadTemplates();
            } else {
                toast.error("Erro", res.error?.message || "Erro ao excluir modelo");
            }
        } catch (e) {
            toast.error("Erro", "Não foi possível excluir");
        }
    };

    const insertVariable = (variable: string) => {
        setCurrentTemplate({ ...currentTemplate, content: currentTemplate.content + variable });
    };

    if (view === 'edit') {
        return (
            <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setView('list')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                            <ChevronLeft size={16} /><span>Voltar para Lista</span>
                        </button>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Mail size={24} className="text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">{currentTemplate.id ? 'Editar Modelo' : 'Novo Modelo'}</h1>
                                <p className="text-sm text-slate-400">Configure o título e o corpo do e-mail transacional.</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
                        >
                            {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                            {isSaving ? "Salvando..." : "Salvar Modelo"}
                        </button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Form */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-8 space-y-6">
                        <div className="bg-slate-800/40 border border-white/[0.06] p-6 rounded-2xl space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Nome Interno do Modelo</label>
                                    <input 
                                        type="text" 
                                        value={currentTemplate.name}
                                        onChange={(e) => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                                        placeholder="Ex: Lembrete para Clientes Premium"
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Tipo de Disparo</label>
                                    <select 
                                        value={currentTemplate.type}
                                        onChange={(e) => setCurrentTemplate({...currentTemplate, type: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                                    >
                                        <option value="invite">Convite (Novo Contrato)</option>
                                        <option value="reminder">Lembrete de Assinatura</option>
                                        <option value="completed">Contrato Finalizado</option>
                                        <option value="other">Outros Avisos</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-white mb-3">
                                        <input type="checkbox" checked={currentTemplate.isDefault} onChange={(e) => setCurrentTemplate({...currentTemplate, isDefault: e.target.checked})} className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500/50" />
                                        Definir como Padrão
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/40 border border-white/[0.06] p-6 rounded-2xl space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Assunto do E-mail</label>
                                <input 
                                    type="text" 
                                    value={currentTemplate.subject}
                                    onChange={(e) => setCurrentTemplate({...currentTemplate, subject: e.target.value})}
                                    placeholder="Ex: Seu contrato está pronto para assinatura"
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" 
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Corpo do E-mail</label>
                                </div>
                                <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-slate-900/50 focus-within:border-indigo-500/50 transition-colors">
                                    <div className="flex items-center gap-1 p-2 border-b border-white/[0.06] bg-slate-800/80">
                                        <button type="button" className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Type size={16}/></button>
                                    </div>
                                    <textarea 
                                        rows={12}
                                        value={currentTemplate.content}
                                        onChange={(e) => setCurrentTemplate({...currentTemplate, content: e.target.value})}
                                        className="w-full p-4 bg-transparent text-sm text-white focus:outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Variaveis Sidebar */}
                    <div className="md:col-span-4">
                        <div className="bg-slate-800/40 border border-white/[0.06] p-6 rounded-2xl sticky top-6">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Variable size={16} className="text-amber-400" /> Variáveis Dinâmicas</h3>
                            <p className="text-xs text-slate-400 mb-6">Clique na variável para inserir no texto. O sistema substituirá automaticamente antes de enviar.</p>

                            <div className="space-y-2">
                                <button type="button" onClick={() => insertVariable('{{nome_contratante}}')} className="w-full text-left p-3 bg-slate-900/50 border border-white/[0.04] hover:bg-slate-800 hover:border-amber-500/30 rounded-xl transition-all">
                                    <span className="text-amber-400 text-xs font-mono font-bold block mb-0.5">{`{{nome_contratante}}`}</span>
                                    <span className="text-xs text-slate-400">Nome da parte principal</span>
                                </button>
                                <button type="button" onClick={() => insertVariable('{{nome_empresa}}')} className="w-full text-left p-3 bg-slate-900/50 border border-white/[0.04] hover:bg-slate-800 hover:border-amber-500/30 rounded-xl transition-all">
                                    <span className="text-amber-400 text-xs font-mono font-bold block mb-0.5">{`{{nome_empresa}}`}</span>
                                    <span className="text-xs text-slate-400">Razão Social da sua empresa</span>
                                </button>
                                <button type="button" onClick={() => insertVariable('{{link_assinatura}}')} className="w-full text-left p-3 bg-slate-900/50 border border-white/[0.04] hover:bg-slate-800 hover:border-indigo-500/30 rounded-xl transition-all">
                                    <span className="text-indigo-400 text-xs font-mono font-bold block mb-0.5">{`{{link_assinatura}}`}</span>
                                    <span className="text-xs text-slate-400">Link único da Landing Page</span>
                                </button>
                                <button type="button" onClick={() => insertVariable('{{token_acesso}}')} className="w-full text-left p-3 bg-slate-900/50 border border-white/[0.04] hover:bg-slate-800 hover:border-amber-500/30 rounded-xl transition-all">
                                    <span className="text-amber-400 text-xs font-mono font-bold block mb-0.5">{`{{token_acesso}}`}</span>
                                    <span className="text-xs text-slate-400">Código Token (SMS/2FA)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/contracts" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><span>Módulo de Contratos</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Modelos de E-mail</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Mail size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Modelos de E-mail</h1>
                            <p className="text-sm text-slate-400">Gerencie a comunicação e as mensagens enviadas aos contratantes.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => openEditor()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Plus size={16} /> Novo Modelo
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-4">
                {templates.map(template => (
                    <div key={template.id} className="bg-slate-800/40 border border-white/[0.06] hover:border-white/20 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-900 rounded-xl mt-1">
                                <Mail size={20} className="text-slate-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-base font-bold text-white">{template.name}</h3>
                                    {template.isDefault && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 rounded">Padrão</span>}
                                    {template.type === 'invite' && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 rounded">Convite</span>}
                                    {template.type === 'reminder' && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded">Lembrete</span>}
                                </div>
                                <p className="text-sm text-slate-400"><span className="text-slate-500 font-bold">Assunto:</span> {template.subject}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-white/[0.04] pt-4 md:border-0 md:pt-0">
                            <button onClick={() => openEditor(template)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-white/[0.06] rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                                <Edit size={14} /> Editar
                            </button>
                            <button onClick={() => handleDelete(template.id)} className="p-2.5 bg-slate-900 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-white/[0.06] hover:border-red-500/20 rounded-xl transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 px-4 bg-slate-800/20 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Linhas por página:</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-slate-950 border border-white/5 rounded-lg text-sm text-white px-2 py-1 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    {totalPages > 0 && (
                        <div className="flex items-center gap-4">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all border border-white/5"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-slate-400">
                                Página <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded-lg ml-1 mr-1">{currentPage}</span> de <span className="font-bold text-slate-300 ml-1">{totalPages}</span>
                            </span>
                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all border border-white/5"
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
