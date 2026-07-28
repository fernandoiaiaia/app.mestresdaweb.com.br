"use client";

import { useState, useEffect } from "react";
import { Database, Upload, Link as LinkIcon, FileText, Trash2, Search, Plus, X, Save, ChevronLeft, ChevronRight, Check, Loader2, RefreshCw } from "lucide-react";
import { listChatbotKnowledge, addChatbotKnowledge, deleteChatbotKnowledge, type ChatbotKnowledgeDoc, type Pagination } from "@/lib/chatbot-api";

export function KnowledgeBaseTab() {
    const [documents, setDocuments] = useState<ChatbotKnowledgeDoc[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"text" | "file" | "url">("text");
    const [inputName, setInputName] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDocuments(1);
    }, []);

    async function loadDocuments(page: number) {
        setLoading(true);
        const res = await listChatbotKnowledge(page, 10, searchQuery || undefined) as any;
        if (res.success) {
            setDocuments(res.data || []);
            if (res.pagination) setPagination(res.pagination);
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        await deleteChatbotKnowledge(id);
        loadDocuments(pagination.page);
    }

    async function handleSave() {
        if (!inputValue && modalType !== 'file') return;
        setSubmitting(true);

        const name = inputName || (modalType === 'url' ? inputValue : modalType === 'file' ? 'documento.pdf' : 'Texto');
        
        await addChatbotKnowledge({
            name,
            type: modalType,
            content: modalType === 'url' ? inputValue : modalType === 'text' ? inputValue : undefined,
        });

        setIsModalOpen(false);
        setInputValue("");
        setInputName("");
        setModalType("text");
        setSubmitting(false);
        loadDocuments(1);
    }

    function handleSearch() {
        loadDocuments(1);
    }

    const getIcon = (type: string, size = 16) => {
        if (type === 'text') return <FileText size={size} className="text-purple-400" />;
        if (type === 'file') return <Upload size={size} className="text-blue-400" />;
        return <LinkIcon size={size} className="text-emerald-400" />;
    };

    return (
        <div className="p-6 max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Base de Conhecimento (RAG)</h2>
                    <p className="text-xs text-slate-400 mt-1">Forneça o contexto da empresa para que a IA atue como um especialista e não invente informações.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Buscar no contexto..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 w-64" 
                        />
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                        <Plus size={14} />
                        Adicionar Conteúdo
                    </button>
                </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 text-xs font-medium text-slate-400 uppercase tracking-wider bg-black/20">
                            <th className="p-4 w-1/3">Nome / Referência</th>
                            <th className="p-4 text-center">Tipo</th>
                            <th className="p-4 text-center">Info</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center">
                                    <Loader2 size={20} className="text-blue-400 animate-spin mx-auto" />
                                </td>
                            </tr>
                        ) : documents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-sm text-slate-400">Nenhum conteúdo na base.</td>
                            </tr>
                        ) : documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            doc.type === 'text' ? 'bg-purple-500/10' : 
                                            doc.type === 'file' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
                                        }`}>
                                            {getIcon(doc.type, 14)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white max-w-[250px] truncate" title={doc.name}>{doc.name}</h4>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-xs text-slate-400 capitalize">
                                        {doc.type === 'url' ? 'Web Scrape' : doc.type === 'file' ? 'Arquivo' : 'Texto Direto'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-xs text-slate-400">{doc.info || '-'}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        {doc.status === 'PROCESSED' ? (
                                            <Check size={14} className="text-emerald-400" />
                                        ) : doc.status === 'ERROR' ? (
                                            <X size={14} className="text-red-400" />
                                        ) : (
                                            <RefreshCw size={14} className="text-amber-400 animate-spin" />
                                        )}
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                            doc.status === 'PROCESSED' ? 'text-emerald-400' : 
                                            doc.status === 'ERROR' ? 'text-red-400' : 'text-amber-400'
                                        }`}>
                                            {doc.status === 'PROCESSED' ? 'Processado' : doc.status === 'ERROR' ? 'Erro' : 'Processando...'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(doc.id)} 
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
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
                            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                        </span>
                        <div className="flex items-center gap-1">
                            <button 
                                disabled={pagination.page === 1}
                                onClick={() => loadDocuments(pagination.page - 1)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-bold text-white px-2">{pagination.page} / {pagination.totalPages}</span>
                            <button 
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => loadDocuments(pagination.page + 1)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Database size={16} className="text-blue-400" />
                                Adicionar Contexto à IA
                            </h3>
                            <button onClick={() => { setIsModalOpen(false); setInputValue(""); setInputName(""); }} className="text-slate-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-3 gap-3">
                                {(["text", "file", "url"] as const).map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => { setModalType(t); setInputValue(""); }}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                                            modalType === t ? 
                                            (t === 'text' ? 'bg-purple-500/10 border-purple-500/30' : t === 'file' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-emerald-500/10 border-emerald-500/30') 
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        {getIcon(t, 20)}
                                        <span className={`text-xs font-bold ${modalType === t ? (t === 'text' ? 'text-purple-400' : t === 'file' ? 'text-blue-400' : 'text-emerald-400') : 'text-slate-400'}`}>
                                            {t === 'text' ? 'Texto Livre' : t === 'file' ? 'Upload (PDF)' : 'Link (Scrape)'}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-4">
                                <div>
                                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Nome do Documento</label>
                                    <input 
                                        value={inputName}
                                        onChange={(e) => setInputName(e.target.value)}
                                        placeholder="Ex: FAQ Comercial, Tabela de Preços..."
                                        className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                {modalType === 'text' && (
                                    <div>
                                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Conteúdo</label>
                                        <textarea 
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Cole aqui informações sobre serviços, valores, objeções, FAQ..."
                                            rows={6}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                                        />
                                    </div>
                                )}
                                {modalType === 'url' && (
                                    <div>
                                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">URL do Site</label>
                                        <input 
                                            type="url" 
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="https://suaempresa.com.br/sobre"
                                            className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500" 
                                        />
                                        <p className="text-[10px] text-slate-500 mt-2">Nosso Crawler vai visitar o link e extrair os textos da página.</p>
                                    </div>
                                )}
                                {modalType === 'file' && (
                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
                                        <Upload size={24} className="text-slate-500 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-white">Upload disponível após deploy</p>
                                        <p className="text-xs text-slate-400 mt-1">PDF, DOCX, CSV até 10MB</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                            <button onClick={() => { setIsModalOpen(false); setInputValue(""); setInputName(""); }} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSave} 
                                disabled={submitting || (!inputValue && modalType !== 'file')}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {submitting ? 'Salvando...' : 'Ingerir Contexto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
