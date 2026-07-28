"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
    FileText, Plus, Search, ChevronLeft,
    Copy, Edit3, Trash2, CheckCircle2, XCircle, FileArchive, ChevronRight, Eye
} from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export interface ContractTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export default function ContractTemplatesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(30);
    const [totalPages, setTotalPages] = useState(1);
    const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            if (searchTerm !== debouncedSearchTerm) {
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm, debouncedSearchTerm]);

    const load = async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString()
            });
            if (debouncedSearchTerm) {
                queryParams.append("search", debouncedSearchTerm);
            }
            const res = await api<any>(`/api/contracts/templates?${queryParams.toString()}`);
            if (res.success && res.data) {
                setTemplates(res.data as any);
                if ((res as any).pagination) {
                    setTotalPages((res as any).pagination.totalPages);
                }
            } else {
                toast.error("Erro", "Falha ao carregar modelos.");
            }
        } catch (e) {
            toast.error("Erro", "Falha na requisição.");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        load();
    }, [currentPage, debouncedSearchTerm, limit]);

    const toggleStatus = async (tpl: ContractTemplate) => {
        const newStatus = tpl.status === 'active' ? 'inactive' : 'active';
        await api(`/api/contracts/templates/${tpl.id}`, { 
            method: 'PUT', 
            body: { ...tpl, status: newStatus } 
        });
        load();
        toast.success("Sucesso", `Modelo ${newStatus === 'active' ? 'ativado' : 'inativado'} com sucesso.`);
    };

    const duplicateTemplate = async (tpl: ContractTemplate) => {
        await api('/api/contracts/templates', {
            method: 'POST',
            body: { 
                name: `${tpl.name} (Cópia)`,
                description: tpl.description,
                content: tpl.content
            }
        });
        load();
        toast.success("Sucesso", "Modelo duplicado com sucesso.");
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este modelo?")) return;
        try {
            await api(`/api/contracts/templates/${id}`, { method: 'DELETE' });
            toast.success("Sucesso", "Modelo excluído com sucesso.");
            load();
        } catch (e) {
            toast.error("Erro", "Falha ao excluir modelo.");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/contracts" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><span>Voltar para Contratos</span>
                    </Link>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center">
                            <FileArchive size={24} className="text-slate-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Modelos de Contrato</h1>
                            <p className="text-sm text-slate-400">Crie modelos para padronizar seus contratos.</p>
                        </div>
                    </div>
                    <Link href="/dashboard/contracts/templates/new" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
                        <Plus size={16} /> Criar Modelo
                    </Link>
                </div>
            </motion.div>

            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/[0.06] bg-slate-900/50">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-500" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar modelos..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.06] bg-slate-900/20 text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold">Nome do Modelo</th>
                                <th className="p-4 font-bold">Última Atualização</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <span className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : templates.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        Nenhum modelo encontrado.
                                    </td>
                                </tr>
                            ) : (
                                templates.map((tpl) => (
                                    <tr key={tpl.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <span className="block text-sm font-bold text-white">{tpl.name}</span>
                                            <span className="block text-xs text-slate-500 truncate max-w-md mt-0.5">{tpl.description || 'Sem descrição'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-slate-300">
                                                {format(new Date(tpl.updatedAt), "dd/MM/yyyy 'às' HH:mm")}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {tpl.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 size={12} /> Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-slate-800 text-slate-400 border border-white/10">
                                                    <XCircle size={12} /> Inativo
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => toggleStatus(tpl)}
                                                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors tooltip"
                                                    title={tpl.status === 'active' ? 'Inativar' : 'Ativar'}
                                                >
                                                    {tpl.status === 'active' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                </button>
                                                <button 
                                                    onClick={() => duplicateTemplate(tpl)}
                                                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Duplicar"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setPreviewTemplate(tpl)}
                                                    className="p-2 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                                                    title="Visualizar"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <Link 
                                                    href={`/dashboard/contracts/templates/${tpl.id}`}
                                                    className="p-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit3 size={16} />
                                                </Link>
                                                <button 
                                                    onClick={() => deleteTemplate(tpl.id)}
                                                    className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && (
                    <div className="flex items-center justify-between p-4 border-t border-white/[0.06] bg-slate-900/50">
                        <div className="flex items-center gap-4">
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
                            <span className="text-sm text-slate-400">
                                Página {currentPage} de {totalPages || 1}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/50">
                            <h2 className="text-lg font-bold text-white">Visualização: {previewTemplate.name}</h2>
                            <button 
                                onClick={() => setPreviewTemplate(null)}
                                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950/80 custom-scrollbar">
                            <div className="bg-white w-full max-w-[800px] mx-auto min-h-[1131px] shadow-2xl rounded-sm p-12 md:p-16 text-slate-900 font-serif text-base leading-relaxed">
                                <div 
                                    className="tiptap-editor-content text-slate-900"
                                    dangerouslySetInnerHTML={{ __html: previewTemplate.content || "<p class='text-slate-400 italic text-center'>O modelo está vazio.</p>" }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
