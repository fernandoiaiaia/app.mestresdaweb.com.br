"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
    TrendingUp, 
    TrendingDown, 
    AlertCircle, 
    Wallet, 
    Briefcase, 
    FileSignature, 
    Headphones, 
    Loader2, 
    Plus, 
    ArrowRight,
    DollarSign,
    Target,
    Activity,
    CheckCircle2,
    Clock,
    FileText
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportsService, ExecutiveSummaryData } from "@/services/reports.service";

export default function DashboardIndexPage() {
    const [data, setData] = useState<ExecutiveSummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Mocking user for styling purposes, replace with actual auth hook if available
    const firstName = "Administrador";

    useEffect(() => {
        const load = async () => {
            try {
                const res = await reportsService.getExecutiveSummary();
                if (res.success && res.data) {
                    setData(res.data);
                } else {
                    setErrorMsg(res.message || "Failed to load dashboard data");
                }
            } catch (err: any) {
                console.error("Dashboard Load Error:", err);
                setErrorMsg(err.message);
            }
            setIsLoading(false);
        };
        load();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (isoString: string) => {
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(isoString));
    };

    const COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <h1 className="text-3xl font-medium tracking-tight text-white mb-1">
                        Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">{firstName}</span>
                    </h1>
                    <p className="text-sm text-slate-400">
                        Visão consolidada do pulso financeiro, vendas e operações.
                    </p>
                </motion.div>
                <div className="flex items-center gap-3">
                </div>
            </div>

            {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    <strong>Erro ao carregar dados:</strong> {errorMsg}
                </div>
            )}

            {data && (
                <div className="space-y-8">
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {[
                            { title: "MRR Ativo", value: formatCurrency(data.legal.activeMRR), icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
                            { title: "Caixa (Mês)", value: formatCurrency(data.finance.realizedIncome), icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
                            { title: "Vendas", value: formatCurrency(data.sales.totalValue), icon: Target, color: "text-slate-300", bg: "bg-slate-800/80 border-slate-700/50" },
                            { title: "Projetos Ativos", value: String(data.operations.activeCount), icon: Briefcase, color: "text-slate-300", bg: "bg-slate-800/80 border-slate-700/50" },
                            { title: "Gargalos Jurídicos", value: String(data.legal.stuckContractsCount), icon: AlertCircle, color: data.legal.stuckContractsCount > 0 ? "text-amber-500" : "text-slate-300", bg: data.legal.stuckContractsCount > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-slate-800/80 border-slate-700/50" },
                            { title: "Chamados", value: String(data.support.openTicketsCount), icon: Headphones, color: "text-slate-300", bg: "bg-slate-800/80 border-slate-700/50" },
                        ].map((card, i) => (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className={`p-5 rounded-xl border backdrop-blur-md cursor-pointer hover:scale-[1.02] transition-transform ${card.bg}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <card.icon size={20} className={card.color} />
                                </div>
                                <h3 className="text-xl font-medium text-white mb-1 truncate">{card.value}</h3>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{card.title}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Middle Area: Charts and Feed */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Main Chart (Cash Flow) */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={18} className="text-blue-500" />
                                    <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">
                                        Fluxo de Caixa Diário
                                    </h2>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Receitas</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Despesas</div>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.finance.dailyCashFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${(value/1000)}k`} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }}
                                            formatter={(value: any) => formatCurrency(Number(value))}
                                        />
                                        <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                                        <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Feed: Recent Activity */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-md overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-blue-500" />
                                    <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">Caixa Recente</h2>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto divide-y divide-slate-700/30">
                                {data.finance.recentTransactions.map(tx => (
                                    <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            {tx.isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-white truncate">{tx.description}</h4>
                                            <span className="text-[10px] text-slate-500">{formatDate(tx.date)} &bull; {tx.status}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-bold ${tx.isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {tx.isIncome ? '+' : '-'}{formatCurrency(tx.value).replace('R$', '').trim()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                    </div>

                    {/* Bottom Area: Donut Chart & Project Health & Deals */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Expense Category Donut */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-md flex flex-col overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-700/50 flex items-center gap-2">
                                <Target size={18} className="text-blue-500" />
                                <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">Despesas por Categoria</h2>
                            </div>
                            <div className="p-6 flex-1 flex flex-col items-center justify-center">
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={data.finance.expenseByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                                                {data.finance.expenseByCategory.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full px-2">
                                    {data.finance.expenseByCategory.slice(0, 4).map((cat, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                <span className="text-[11px] text-slate-400 truncate w-16">{cat.name}</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-white">{formatCurrency(cat.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Active Projects List */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }} className="bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-md flex flex-col overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={18} className="text-blue-500" />
                                    <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">Saúde da Operação</h2>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{data.operations.activeCount} ativos</span>
                            </div>
                            <div className="divide-y divide-slate-700/30">
                                {data.operations.activeProjectsList.slice(0, 5).map(proj => (
                                    <div key={proj.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-sm font-semibold text-white truncate pr-2">{proj.name}</h3>
                                            {proj.isAtRisk ? (
                                                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertCircle size={10}/> Risco</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={10}/> On Track</span>
                                            )}
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-full h-1.5 mb-1.5">
                                            <div className={`h-1.5 rounded-full ${proj.isAtRisk ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${proj.progress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            <span>Fase: {proj.phase.replace(/_/g, ' ')}</span>
                                            <span>{proj.progress}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Recent Deals */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-md flex flex-col overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-700/50 flex items-center gap-2">
                                <Target size={18} className="text-blue-500" />
                                <h2 className="text-sm font-bold tracking-widest uppercase text-slate-300">Fechamentos Recentes</h2>
                            </div>
                            <div className="divide-y divide-slate-700/30">
                                {data.sales.recentDeals.length > 0 ? data.sales.recentDeals.map(deal => (
                                    <div key={deal.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={16} className="text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-white truncate">{deal.title}</h4>
                                            <span className="text-[10px] text-slate-500"><Clock size={10} className="inline mr-1 -mt-0.5"/>{formatDate(deal.date)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-blue-400">
                                                {formatCurrency(deal.value).replace('R$', '').trim()}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-sm">
                                        Nenhuma venda recente no mês.
                                    </div>
                                )}
                            </div>
                        </motion.div>

                    </div>
                </div>
            )}
        </div>
    );
}
