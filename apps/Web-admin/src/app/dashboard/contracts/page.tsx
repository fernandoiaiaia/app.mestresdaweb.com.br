"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
    FileText, Plus, Search, Filter, Settings, Mail,
    FileSignature, Archive, Trash2, Clock, CheckCircle2, XCircle, BrainCircuit, ChevronLeft, ChevronRight
} from "lucide-react";

import { contractsService, Contract, ContractStats } from "@/services/contracts.service";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ContractsDashboardPage() {
    const { toast } = useToast();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(30);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState<ContractStats>({
        total: 0, signing: 0, signedThisMonth: 0, totalValue: 0
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            if (searchTerm !== debouncedSearchTerm) {
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm, debouncedSearchTerm]);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await contractsService.list({
                page: currentPage,
                limit: limit,
                search: debouncedSearchTerm
            });
            if (res.success && res.data) {
                // @ts-ignore
                setContracts(res.data.data ? res.data.data : res.data);
                // @ts-ignore
                if (res.data.pagination) setTotalPages(res.data.pagination.pages);
                // @ts-ignore
                if (res.pagination) setTotalPages(res.pagination.pages);
            } else {
                toast.error("Erro", "Falha ao carregar contratos.");
            }
            setIsLoading(false);
        };
        load();
    }, [currentPage, limit, debouncedSearchTerm]);

    useEffect(() => {
        contractsService.stats().then(res => {
            if (res.success && res.data) {
                setStats(res.data);
            }
        });
    }, []);

    const getStatusBadge = (status: Contract['status']) => {
        switch(status) {
            case 'draft': return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-slate-800 text-slate-400 border border-white/10">Rascunho</span>;
            case 'review': return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">Em Revisão</span>;
            case 'sent': return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">Enviado</span>;
            case 'signing': return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">Em Assinatura</span>;
            case 'signed': return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Assinado</span>;
            case 'cancelled': return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelado</span>;
            case 'archived': return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-slate-800/80 text-slate-500 border border-white/5">Arquivado</span>;
            default: return null;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <FileSignature size={24} className="text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Gestão de Contratos</h1>
                        <p className="text-sm text-slate-400">Crie, gerencie e assine contratos digitalmente.</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end mt-4 md:mt-0">
                    <Link href="/dashboard/contracts/analysis" className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl text-sm font-bold transition-all shadow-lg border border-amber-500/20 flex items-center gap-2">
                        <BrainCircuit size={16} className="hidden sm:block" /> <span className="hidden sm:inline">Análise IA</span><span className="sm:hidden"><BrainCircuit size={16} /></span>
                    </Link>
                    <Link href="/dashboard/contracts/templates/emails" className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg border border-white/5 flex items-center gap-2">
                        <Mail size={16} className="hidden sm:block" /> <span className="hidden sm:inline">E-mails</span><span className="sm:hidden"><Mail size={16} /></span>
                    </Link>
                    <Link href="/dashboard/contracts/templates" className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg border border-white/5 flex items-center gap-2">
                        <FileText size={16} className="hidden sm:block" /> <span className="hidden sm:inline">Modelos</span><span className="sm:hidden"><FileText size={16} /></span>
                    </Link>
                    <Link href="/dashboard/contracts/new" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                        <Plus size={16} /> Novo
                    </Link>
                </div>
            </motion.div>

            {/* Stats/KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total de Contratos</span>
                    <span className="block text-2xl font-black text-white mt-1">{stats.total}</span>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
                    <span className="text-[10px] uppercase font-bold text-purple-400/80 tracking-wider">Aguardando Assinatura</span>
                    <span className="block text-2xl font-black text-purple-400 mt-1">{stats.signing}</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                    <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider">Assinados (Mês)</span>
                    <span className="block text-2xl font-black text-emerald-400 mt-1">{stats.signedThisMonth}</span>
                </div>
                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Valor em Contratos</span>
                    <span className="block text-2xl font-black text-white mt-1">{formatCurrency(stats.totalValue)}</span>
                </div>
            </div>

            {/* List */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-500" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente, número ou objeto..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all border border-white/5">
                        <Filter size={16} /> Filtros
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.06] bg-slate-900/20 text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold">Nº / Contratante</th>
                                <th className="p-4 font-bold">Objeto do Contrato</th>
                                <th className="p-4 font-bold">Valor</th>
                                <th className="p-4 font-bold">Prazo Limite</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center">
                                        <span className="inline-block w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        Nenhum contrato encontrado.
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((contract) => (
                                    <tr key={contract.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <Link href={`/dashboard/contracts/${contract.id}`} className="block">
                                                <span className="block text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{contract.contractorName}</span>
                                                <span className="block text-xs text-slate-500 mt-0.5">#{contract.number} • {contract.contractorDocument}</span>
                                            </Link>
                                        </td>
                                        <td className="p-4">
                                            <span className="block text-sm text-slate-300 max-w-xs truncate">{contract.objectDescription}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="block text-sm font-bold text-white">{formatCurrency(contract.value)}</span>
                                            <span className="block text-xs text-slate-500">{contract.paymentMethod}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="block text-sm text-slate-300 flex items-center gap-1.5">
                                                <Clock size={12} className="text-slate-500" />
                                                {format(new Date(contract.signingDeadline), "dd 'de' MMM", { locale: ptBR })}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(contract.status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link href={`/dashboard/contracts/${contract.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors">
                                                Ver Detalhes
                                            </Link>
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
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
