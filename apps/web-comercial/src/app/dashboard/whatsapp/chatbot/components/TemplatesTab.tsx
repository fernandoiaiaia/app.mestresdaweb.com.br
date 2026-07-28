"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Search, Plus, X, Save, ChevronLeft, ChevronRight, Check, Loader2, RefreshCw, Trash2, ArrowLeft, Smartphone, Clock } from "lucide-react";
import { listWhatsappTemplates, createWhatsappTemplate, deleteWhatsappTemplate, syncWhatsappTemplates, type WhatsappTemplate, type Pagination } from "@/lib/chatbot-api";

export function TemplatesTab() {
    const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [syncing, setSyncing] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState("");
    const [formCategory, setFormCategory] = useState("Marketing");
    const [formBody, setFormBody] = useState("");
    const [formLanguage, setFormLanguage] = useState("pt_BR");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadTemplates(1); }, []);

    async function loadTemplates(page: number) {
        setLoading(true);
        const res = await listWhatsappTemplates(page, 10, searchQuery || undefined) as any;
        if (res.success) {
            setTemplates(res.data || []);
            if (res.pagination) setPagination(res.pagination);
        }
        setLoading(false);
    }

    async function handleSync() {
        setSyncing(true);
        await syncWhatsappTemplates();
        await loadTemplates(1);
        setSyncing(false);
    }

    async function handleDelete(id: string) {
        await deleteWhatsappTemplate(id);
        loadTemplates(pagination.page);
    }

    async function handleCreate() {
        if (!formName || !formBody) return;
        setSubmitting(true);
        const sanitizedName = formName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        await createWhatsappTemplate({ name: sanitizedName, category: formCategory, body: formBody, language: formLanguage });
        setSubmitting(false);
        setShowForm(false);
        setFormName(""); setFormBody(""); setFormCategory("Marketing");
        loadTemplates(1);
    }

    const statusColor = (s: string) => {
        if (s === 'APPROVED') return 'text-emerald-400 bg-emerald-400/10';
        if (s === 'REJECTED') return 'text-red-400 bg-red-400/10';
        return 'text-amber-400 bg-amber-400/10';
    };

    if (showForm) {
        return (
            <div className="p-6 max-w-6xl space-y-6">
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Voltar para listagem
                </button>
                <h2 className="text-lg font-bold text-white">Novo Template Meta</h2>

                <div className="grid grid-cols-2 gap-6">
                    {/* Form */}
                    <div className="space-y-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Nome do Template</label>
                                <input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="boas_vindas_mql"
                                    className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Apenas letras, números e underscores. Será sanitizado automaticamente.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Categoria</label>
                                    <select
                                        value={formCategory}
                                        onChange={(e) => setFormCategory(e.target.value)}
                                        className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                                    >
                                        <option value="Marketing">Marketing</option>
                                        <option value="Utility">Utilidade</option>
                                        <option value="Authentication">Autenticação</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Idioma</label>
                                    <select
                                        value={formLanguage}
                                        onChange={(e) => setFormLanguage(e.target.value)}
                                        className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                                    >
                                        <option value="pt_BR">Português (BR)</option>
                                        <option value="en_US">English (US)</option>
                                        <option value="es">Español</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Corpo da Mensagem</label>
                                <textarea
                                    value={formBody}
                                    onChange={(e) => setFormBody(e.target.value)}
                                    placeholder={"Olá {{1}}! 👋\n\nSomos a equipe da {{2}} e gostaríamos de conversar sobre como podemos ajudar sua empresa."}
                                    rows={6}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Use {"{{1}}"}, {"{{2}}"} para variáveis dinâmicas (nome, empresa).</p>
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={submitting || !formName || !formBody}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {submitting ? 'Enviando para Meta...' : 'Criar e Enviar para Aprovação'}
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                <Smartphone size={14} /> Preview WhatsApp
                            </h3>
                            <div className="bg-[#0b141a] rounded-xl p-4 min-h-[200px] flex items-end">
                                <div className="bg-[#005c4b] rounded-xl rounded-tr-none p-3 max-w-[85%]">
                                    <p className="text-sm text-white whitespace-pre-wrap">
                                        {formBody || "Sua mensagem aparecerá aqui..."}
                                    </p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <Clock size={10} className="text-white/40" />
                                        <span className="text-[10px] text-white/40">12:00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Templates Meta</h2>
                    <p className="text-xs text-slate-400 mt-1">Crie e gerencie templates pré-aprovados pela Meta para iniciar conversas (Outbound).</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" placeholder="Buscar templates..." 
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadTemplates(1)}
                            className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 w-56" 
                        />
                    </div>
                    <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors">
                        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                        Sincronizar
                    </button>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors">
                        <Plus size={14} /> Novo Template
                    </button>
                </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 text-xs font-medium text-slate-400 uppercase tracking-wider bg-black/20">
                            <th className="p-4 w-1/4">Nome</th>
                            <th className="p-4">Categoria</th>
                            <th className="p-4">Preview</th>
                            <th className="p-4 text-center">Status Meta</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center"><Loader2 size={20} className="text-blue-400 animate-spin mx-auto" /></td></tr>
                        ) : templates.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">Nenhum template cadastrado.</td></tr>
                        ) : templates.map(t => (
                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                            <MessageSquare size={14} className="text-green-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{t.name}</h4>
                                            <span className="text-[10px] text-slate-500">{t.language}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-xs text-slate-400">{t.category}</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-xs text-slate-400 line-clamp-2 max-w-[200px]">{t.body}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${statusColor(t.status)}`}>
                                        {t.status === 'APPROVED' ? 'Aprovado' : t.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/10">
                        <span className="text-xs text-slate-500">
                            {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                        </span>
                        <div className="flex items-center gap-1">
                            <button disabled={pagination.page === 1} onClick={() => loadTemplates(pagination.page - 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-bold text-white px-2">{pagination.page} / {pagination.totalPages}</span>
                            <button disabled={pagination.page === pagination.totalPages} onClick={() => loadTemplates(pagination.page + 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
