"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Plus, Wallet, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { investmentsService, Investment } from "@/services/investments.service";
import { useToast } from "@/components/ui/toast";

export default function InvestmentsPage() {
    const { toast } = useToast();
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadInvestments = async () => {
        setIsLoading(true);
        try {
            const res = await investmentsService.list();
            if (res.success && res.data) {
                setInvestments(res.data);
            }
        } catch (error) {
            toast.error("Erro", "Falha ao carregar investimentos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInvestments();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };

    const totalInvested = investments.reduce((acc, inv) => acc + inv.initialAmount, 0);
    const totalCurrentBalance = investments.reduce((acc, inv) => acc + inv.currentBalance, 0);
    const totalYield = totalCurrentBalance - totalInvested;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/financial" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Wallet size={14} /><span>Financeiro</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Investimentos</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <TrendingUp size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Rastreador de Investimentos</h1>
                            <p className="text-sm text-slate-400">Controle suas aplicações de renda fixa e acompanhe os rendimentos</p>
                        </div>
                    </div>
                    <Link 
                        href="/dashboard/financial/investments/new"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Plus size={16} /> Nova Aplicação
                    </Link>
                </div>
            </motion.div>

            {/* Resumo Geral */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800/40 border border-white/[0.06] p-6 rounded-2xl flex flex-col justify-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Aplicado</span>
                    <span className="text-3xl font-black text-white">{formatCurrency(totalInvested)}</span>
                </div>
                <div className="bg-slate-800/40 border border-white/[0.06] p-6 rounded-2xl flex flex-col justify-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Saldo Atual</span>
                    <span className="text-3xl font-black text-white">{formatCurrency(totalCurrentBalance)}</span>
                </div>
                <div className={`p-6 rounded-2xl flex flex-col justify-center ${totalYield >= 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"}`}>
                    <span className={`text-sm font-bold uppercase tracking-wider mb-2 ${totalYield >= 0 ? "text-emerald-500/80" : "text-rose-500/80"}`}>Rendimento Acumulado</span>
                    <div className="flex items-center gap-3">
                        <span className={`text-3xl font-black ${totalYield >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatCurrency(totalYield)}</span>
                        {totalYield >= 0 ? <TrendingUp size={24} className="text-emerald-400" /> : <TrendingDown size={24} className="text-rose-400" />}
                    </div>
                </div>
            </div>

            {/* Gráfico de Evolução Patrimonial (SVG Mock) */}
            <div className="bg-slate-800/40 border border-white/[0.06] p-6 md:p-8 rounded-2xl mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <TrendingUp size={16} className="text-indigo-400" /> Evolução Patrimonial
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Crescimento histórico do saldo consolidado.</p>
                    </div>
                </div>
                
                <div className="h-64 w-full relative">
                    <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="w-full h-full drop-shadow-xl">
                        {/* Grid lines */}
                        <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                        
                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id="yieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
                                <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                            </linearGradient>
                        </defs>

                        {/* Area */}
                        <path 
                            d="M0,180 L100,160 L200,165 L300,130 L400,100 L500,110 L600,70 L700,50 L800,20 L800,200 L0,200 Z" 
                            fill="url(#yieldGradient)" 
                        />
                        {/* Line */}
                        <path 
                            d="M0,180 L100,160 L200,165 L300,130 L400,100 L500,110 L600,70 L700,50 L800,20" 
                            fill="none" 
                            stroke="#818cf8" 
                            strokeWidth="3" 
                        />
                        {/* Points */}
                        <circle cx="100" cy="160" r="4" fill="#818cf8" className="hover:r-[6px] transition-all cursor-pointer" />
                        <circle cx="200" cy="165" r="4" fill="#818cf8" className="hover:r-[6px] transition-all cursor-pointer" />
                        <circle cx="300" cy="130" r="4" fill="#818cf8" className="hover:r-[6px] transition-all cursor-pointer" />
                        <circle cx="400" cy="100" r="4" fill="#818cf8" className="hover:r-[6px] transition-all cursor-pointer" />
                        <circle cx="500" cy="110" r="4" fill="#818cf8" className="hover:r-[6px] transition-all cursor-pointer" />
                        <circle cx="600" cy="70" r="4" fill="#818cf8" className="hover:r-[6px] transition-all cursor-pointer" />
                        <circle cx="700" cy="50" r="4" fill="#818cf8" className="hover:r-[6px] transition-all cursor-pointer" />
                        <circle cx="800" cy="20" r="4" fill="#818cf8" className="hover:r-[6px] transition-all cursor-pointer" />
                    </svg>
                    
                    {/* Y Axis labels */}
                    <div className="absolute top-0 left-0 h-full flex flex-col justify-between py-2 text-[10px] text-slate-500 font-mono pointer-events-none">
                        <span>R$ 150k</span>
                        <span>R$ 100k</span>
                        <span>R$ 50k</span>
                        <span>R$ 0</span>
                    </div>

                    {/* X Axis labels */}
                    <div className="absolute bottom-0 w-full flex justify-between px-4 text-[10px] text-slate-500 font-mono pt-2 border-t border-white/[0.05]">
                        <span>Jan</span>
                        <span>Fev</span>
                        <span>Mar</span>
                        <span>Abr</span>
                        <span>Mai</span>
                        <span>Jun</span>
                        <span>Jul</span>
                        <span>Ago</span>
                    </div>
                </div>
            </div>

            {/* Lista de Investimentos */}
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <span className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            ) : investments.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/40 border border-dashed border-white/10 rounded-3xl">
                    <TrendingUp size={48} className="text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Nenhum investimento cadastrado</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">Comece agora mesmo a acompanhar suas aplicações de Renda Fixa ou Variável criando o seu primeiro registro.</p>
                    <Link href="/dashboard/financial/investments/new" className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">Criar Primeiro Investimento &rarr;</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {investments.map(inv => {
                        const invYield = inv.currentBalance - inv.initialAmount;
                        const isPositive = invYield >= 0;

                        return (
                            <Link key={inv.id} href={`/dashboard/financial/investments/${inv.id}`}>
                                <motion.div 
                                    whileHover={{ y: -4 }}
                                    className="bg-slate-800/60 border border-white/[0.08] hover:border-indigo-500/30 p-6 rounded-2xl cursor-pointer transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight size={20} className="text-indigo-400" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                                            {inv.type.substring(0, 3)}
                                        </div>
                                        <div className="flex-1 truncate">
                                            <h3 className="text-base font-bold text-white truncate">{inv.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{inv.institution}</span>
                                                <p className="text-xs text-slate-400 truncate">{inv.type}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-white/[0.04] pb-3">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor Inicial</span>
                                            <span className="text-sm font-medium text-slate-300">{formatCurrency(inv.initialAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-white/[0.04] pb-3">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saldo Atual</span>
                                            <span className="text-base font-bold text-white">{formatCurrency(inv.currentBalance)}</span>
                                        </div>
                                        <div className="flex justify-between items-end pt-1">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rendimento</span>
                                            <span className={`text-sm font-bold flex items-center gap-1 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                                                {isPositive ? "+" : ""}{formatCurrency(invYield)}
                                                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
