"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ArrowDownCircle, Plus, Calendar, DollarSign, Wallet, ChevronRight } from "lucide-react";
import { profitDistributionService, ProfitDistribution } from "@/services/profit-distribution.service";

export default function ProfitDistributionPage() {
    const [distributions, setDistributions] = useState<ProfitDistribution[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(30);

    useEffect(() => {
        profitDistributionService.list().then(res => {
            if (res.success && res.data) {
                setDistributions(res.data);
            }
        }).catch(() => {}).finally(() => setIsLoading(false));
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    };

    // Pagination logic
    const totalPages = Math.ceil(distributions.length / itemsPerPage);
    const paginatedDistributions = distributions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <span className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/financial" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><span>Financeiro</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Distribuição de Lucros</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <ArrowDownCircle size={24} className="text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Histórico de Distribuições</h1>
                            <p className="text-sm text-slate-400">Acompanhe as divisões de lucro realizadas entre os sócios.</p>
                        </div>
                    </div>
                    <Link 
                        href="/dashboard/financial/profit-distribution/new"
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-600/20"
                    >
                        <Plus size={18} />
                        Nova Distribuição
                    </Link>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {distributions.length === 0 ? (
                    <div className="bg-slate-800/20 border border-dashed border-white/[0.06] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                        <ArrowDownCircle size={48} className="text-slate-600 mb-4" />
                        <h3 className="text-sm font-bold text-slate-400 mb-2">Nenhuma distribuição realizada</h3>
                        <p className="text-xs text-slate-500 max-w-[300px]">Você ainda não registrou nenhum repasse de lucros no sistema. Clique no botão acima para iniciar.</p>
                    </div>
                ) : (
                    <>
                        {paginatedDistributions.map(dist => (
                        <div key={dist.id} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-800/60 transition-colors">
                            {/* General Info */}
                            <div className="md:w-1/3 space-y-4 pr-6 md:border-r border-white/10">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1"><Calendar size={12}/> Referência</span>
                                    <h4 className="text-lg font-black text-white">{dist.referencePeriod}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Executado em {formatDate(dist.date || dist.createdAt)}</p>
                                </div>
                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Lucro Total do Período</span>
                                        <span className="text-sm font-bold text-slate-300">{formatCurrency(dist.totalProfit)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Montante Distribuído</span>
                                        <span className="text-sm font-bold text-amber-400">{formatCurrency(dist.distributedAmount)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Partners Break down */}
                            <div className="flex-1 space-y-3">
                                <h5 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2"><Wallet size={12}/> Detalhamento dos Repasses</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {dist.items && dist.items.map((item, idx) => (
                                        <div key={idx} className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.name}</p>
                                                <p className="text-[10px] text-slate-500">Cota: {item.share}%</p>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-400">{formatCurrency(item.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <div className="flex flex-col md:flex-row items-center justify-between pt-6 gap-4 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest">Itens por página:</label>
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1); // Reset to first page
                                }}
                                className="bg-slate-900/80 border border-white/10 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50"
                            >
                                <option value={10}>10</option>
                                <option value={30}>30</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-xs text-slate-500 ml-2">
                                Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, distributions.length)} a {Math.min(currentPage * itemsPerPage, distributions.length)} de {distributions.length}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm text-slate-300 font-bold px-2">
                                Página {currentPage} de {Math.max(1, totalPages)}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </>
                )}
            </motion.div>
        </div>
    );
}
