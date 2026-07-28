"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ChevronLeft, Save, Sparkles, BookOpen, Clock, 
    Bold, Italic, Underline, List, FileText, Bot, AlertTriangle, Eye, Edit3
} from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { TiptapEditor } from "@/components/ui/TiptapEditor";
import { api } from "@/lib/api";

export default function ContractTemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const isNew = resolvedParams.id === "new";
    const router = useRouter();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(!isNew);
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    
    // Form data
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("<p>Escreva seu contrato aqui...</p>");
    
    // Sidebar State
    const [activeTab, setActiveTab] = useState<'ai' | 'clauses' | 'history'>('ai');
    
    // AI State
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    useEffect(() => {
        if (!isNew) {
            const load = async () => {
                try {
                    const res = await api<any>(`/api/contracts/templates/${resolvedParams.id}`);
                    if (res.success && res.data) {
                        setName(res.data.name);
                        setDescription(res.data.description || "");
                        setContent(res.data.content);
                    } else {
                        toast.error("Erro", "Falha ao carregar modelo.");
                        router.push("/dashboard/contracts/templates");
                    }
                } catch (e) {
                    toast.error("Erro", "Falha na requisição.");
                    router.push("/dashboard/contracts/templates");
                }
                setIsLoading(false);
            };
            load();
        }
    }, [resolvedParams.id, isNew]);

    const handleSave = async () => {
        if (!name) {
            toast.error("Atenção", "Dê um nome ao modelo antes de salvar.");
            return;
        }

        setIsSaving(true);
        const dataToSave = {
            name,
            description,
            content
        };

        try {
            let res;
            if (isNew) {
                res = await api('/api/contracts/templates', { method: 'POST', body: dataToSave });
            } else {
                res = await api(`/api/contracts/templates/${resolvedParams.id}`, { method: 'PUT', body: dataToSave });
            }

            if (res.success) {
                toast.success("Sucesso", "Modelo salvo com sucesso!");
                if (isNew) {
                    router.push("/dashboard/contracts/templates");
                }
            } else {
                toast.error("Erro", "Falha ao salvar.");
            }
        } catch (e) {
            toast.error("Erro", "Não foi possível salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAIGenerate = async () => {
        if (!aiPrompt) return;
        setIsGeneratingAI(true);
        try {
            const res = await api<any>('/api/contracts/templates/generate-ai', {
                method: 'POST',
                body: { prompt: aiPrompt }
            });
            
            if (res.success && res.data) {
                setContent(content + "<br/><br/>" + res.data);
                setAiPrompt("");
                toast.success("Sucesso", "Conteúdo gerado por IA anexado ao editor!");
            } else {
                toast.error("Erro da IA", res.error?.message || "Falha ao gerar conteúdo.");
            }
        } catch (e) {
            toast.error("Erro", "Falha de comunicação com a IA.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const insertClause = (html: string) => {
        setContent(content + "<br/>" + html);
        toast.success("Info", "Cláusula inserida com sucesso.");
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/contracts/templates" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome do Modelo"
                            className="bg-transparent text-xl font-bold text-white focus:outline-none placeholder:text-slate-600"
                        />
                        <input 
                            type="text" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descrição breve..."
                            className="bg-transparent text-sm text-slate-400 focus:outline-none placeholder:text-slate-600 w-full block mt-1"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                            isPreviewMode 
                            ? 'bg-slate-700 text-white border-slate-600 shadow-inner' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5 shadow-md'
                        }`}
                    >
                        {isPreviewMode ? <Edit3 size={16} /> : <Eye size={16} />}
                        {isPreviewMode ? "Voltar ao Editor" : "Visualizar (A4)"}
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                        {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                        {isSaving ? "Salvando..." : "Salvar Modelo"}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Editor Area (Left) */}
                <div className={`flex-1 flex flex-col ${isPreviewMode ? 'bg-slate-800/50' : 'bg-slate-900'} border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl`}>
                    {isPreviewMode ? (
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950/80 custom-scrollbar">
                            {/* A4 Sheet Preview */}
                            <div className="bg-white w-full max-w-[800px] mx-auto min-h-[1131px] shadow-2xl rounded-sm p-12 md:p-16 text-slate-900 font-serif text-base leading-relaxed">
                                <div 
                                    className="tiptap-editor-content text-slate-900"
                                    dangerouslySetInnerHTML={{ __html: content || "<p class='text-slate-400 italic text-center'>O modelo está vazio.</p>" }}
                                />
                            </div>
                        </div>
                    ) : (
                        <TiptapEditor value={content} onChange={setContent} />
                    )}
                </div>

                {/* Sidebar Tools (Right) */}
                <div className="w-80 flex flex-col bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-white/[0.06]">
                        <button 
                            onClick={() => setActiveTab('ai')}
                            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 transition-colors ${activeTab === 'ai' ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-400/5' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Sparkles size={14} /> IA
                        </button>
                        <button 
                            onClick={() => setActiveTab('clauses')}
                            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 transition-colors ${activeTab === 'clauses' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <BookOpen size={14} /> Cláusulas
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 transition-colors ${activeTab === 'history' ? 'text-slate-300 border-b-2 border-slate-300 bg-slate-300/5' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Clock size={14} /> Versões
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeTab === 'ai' && (
                                <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                                        <Bot size={20} className="text-amber-400 shrink-0" />
                                        <p className="text-xs text-amber-500/90 leading-relaxed">
                                            Descreva o tipo de contrato, tom jurídico e cláusulas que você precisa. Nossa IA gerará o modelo instantaneamente.
                                        </p>
                                    </div>
                                    <textarea 
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Ex: Gere um contrato de prestação de serviços de marketing digital, tom formal, com foro na cidade de São Paulo..."
                                        className="w-full h-32 p-3 bg-slate-900 border border-white/10 rounded-xl text-sm text-white resize-none focus:outline-none focus:border-amber-500/50"
                                    />
                                    <button 
                                        onClick={handleAIGenerate}
                                        disabled={isGeneratingAI || !aiPrompt}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-amber-950 rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        {isGeneratingAI ? <span className="w-4 h-4 border-2 border-amber-950/30 border-t-amber-950 rounded-full animate-spin" /> : <Sparkles size={16} />}
                                        {isGeneratingAI ? "Gerando Modelo..." : "Gerar com IA"}
                                    </button>
                                </motion.div>
                            )}

                            {activeTab === 'clauses' && (
                                <motion.div key="clauses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                    <p className="text-xs text-slate-400 mb-4">Clique para inserir no documento:</p>
                                    
                                    <div className="p-3 bg-slate-900/50 border border-white/5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group"
                                         onClick={() => insertClause("<p><b>Cláusula de Confidencialidade:</b> As partes se comprometem a manter sigilo absoluto sobre os dados...</p>")}>
                                        <h5 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Confidencialidade (NDA)</h5>
                                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Padrão rigoroso de sigilo para prestadores de serviço.</p>
                                    </div>

                                    <div className="p-3 bg-slate-900/50 border border-white/5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group"
                                         onClick={() => insertClause("<p><b>Rescisão:</b> O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 dias...</p>")}>
                                        <h5 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Rescisão (Aviso 30 dias)</h5>
                                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Permite encerramento sem multa com 30 dias de aviso.</p>
                                    </div>
                                    
                                    <div className="p-3 bg-slate-900/50 border border-white/5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group"
                                         onClick={() => insertClause("<p><b>Foro:</b> Fica eleito o foro da comarca de {{cidade}} para dirimir quaisquer dúvidas...</p>")}>
                                        <h5 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Foro Genérico</h5>
                                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Cláusula padrão de foro para eleição de comarca.</p>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'history' && (
                                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <div className="relative pl-4 border-l-2 border-white/10 space-y-6 mt-2">
                                        <div className="relative">
                                            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[23px] top-1" />
                                            <p className="text-xs font-bold text-white">Versão Atual</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Editando agora</p>
                                        </div>
                                        <div className="relative opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                                            <div className="absolute w-3 h-3 bg-slate-600 rounded-full -left-[23px] top-1" />
                                            <p className="text-xs font-bold text-slate-300">Versão 1.1</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">20/05/2026 às 14:00</p>
                                            <p className="text-[10px] text-slate-400 mt-1 italic">"Adicionada cláusula de foro"</p>
                                        </div>
                                        <div className="relative opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                                            <div className="absolute w-3 h-3 bg-slate-600 rounded-full -left-[23px] top-1" />
                                            <p className="text-xs font-bold text-slate-300">Versão 1.0 (Criação)</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">10/05/2026 às 10:00</p>
                                            <p className="text-[10px] text-slate-400 mt-1 italic">"Gerado pela IA"</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
