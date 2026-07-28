"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    List,
    Plus,
    X,
    CheckCircle2,
    Clock,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

interface Transaction {
    id: string;
    description: string;
    value: number;
    typeGroup: string;
    date: string;
    status: string;
}

const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const shortMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<"mensal" | "anual">("mensal");
    
    // Date states
    const [currentMonthIdx, setCurrentMonthIdx] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    
    // Transactions
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal state
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const isReceita = (typeGroup: string) => ["Recebimentos", "MRR", "Entregas"].includes(typeGroup);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsLoading(true);
            try {
                // If mensal, load just the month. If anual, load the whole year.
                const params = new URLSearchParams();
                params.append("year", String(currentYear));
                if (viewMode === "mensal") {
                    params.append("month", String(currentMonthIdx + 1));
                }
                
                const response = await api<Transaction[]>(`/api/financial/transactions?${params.toString()}`);
                if (!isMounted) return;
                
                if (response.success && response.data) {
                    setTransactions(response.data);
                } else {
                    toast.error("Erro ao carregar", "Não foi possível carregar as transações.");
                }
            } catch (error) {
                if (isMounted) toast.error("Erro", "Falha de conexão ao carregar transações.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [currentMonthIdx, currentYear, viewMode]);

    const handlePrev = () => {
        if (viewMode === "mensal") {
            if (currentMonthIdx === 0) {
                setCurrentMonthIdx(11);
                setCurrentYear(prev => prev - 1);
            } else {
                setCurrentMonthIdx(prev => prev - 1);
            }
        } else {
            setCurrentYear(prev => prev - 1);
        }
    };
    
    const handleNext = () => {
        if (viewMode === "mensal") {
            if (currentMonthIdx === 11) {
                setCurrentMonthIdx(0);
                setCurrentYear(prev => prev + 1);
            } else {
                setCurrentMonthIdx(prev => prev + 1);
            }
        } else {
            setCurrentYear(prev => prev + 1);
        }
    };

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Helpers for Monthly View
    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
    
    const calendarDays = useMemo(() => {
        if (viewMode !== "mensal") return [];
        
        const daysInMonth = getDaysInMonth(currentMonthIdx, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonthIdx, currentYear);
        
        const days = [];
        // Previous month padding
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: 0, isCurrentMonth: false, date: null });
        }
        
        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonthIdx, i);
            const dateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            const dayTxs = transactions.filter(t => t.date.startsWith(dateStr));
            
            let receitas = 0;
            let despesas = 0;
            
            dayTxs.forEach(t => {
                if (isReceita(t.typeGroup)) receitas += t.value;
                else despesas += t.value;
            });
            
            days.push({ 
                day: i, 
                isCurrentMonth: true, 
                date, 
                dateStr, 
                txs: dayTxs, 
                receitas, 
                despesas,
                saldo: receitas - despesas
            });
        }
        
        // Next month padding
        const remainingCells = 42 - days.length; // 6 rows of 7
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: 0, isCurrentMonth: false, date: null });
        }
        
        return days;
    }, [currentMonthIdx, currentYear, viewMode, transactions]);

    // Helpers for Yearly View
    const yearMonths = useMemo(() => {
        if (viewMode !== "anual") return [];
        return months.map((monthName, idx) => {
            const monthTxs = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getUTCMonth() === idx;
            });
            
            let receitas = 0;
            let despesas = 0;
            let saldoPago = 0;
            
            monthTxs.forEach(t => {
                if (isReceita(t.typeGroup)) {
                    receitas += t.value;
                    if(t.status === "Pago") saldoPago += t.value;
                } else {
                    despesas += t.value;
                    if(t.status === "Pago") saldoPago -= t.value;
                }
            });
            
            return {
                idx,
                name: monthName,
                receitas,
                despesas,
                saldoPrevisto: receitas - despesas,
                saldoPago,
                count: monthTxs.length
            };
        });
    }, [transactions, viewMode]);

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto pb-32 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-slate-800/40 border border-white/[0.06] p-4 rounded-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Calendário Financeiro</h1>
                        <p className="text-sm text-slate-400">Visão consolidada de suas transações</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/[0.04]">
                        <button 
                            onClick={() => setViewMode("mensal")}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === "mensal" ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Mensal
                        </button>
                        <button 
                            onClick={() => setViewMode("anual")}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === "anual" ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Anual
                        </button>
                    </div>
                    
                    {/* Date Navigation */}
                    <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/[0.04]">
                        <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="w-32 text-center font-bold text-white tracking-wider text-sm">
                            {viewMode === "mensal" ? `${months[currentMonthIdx]} ${currentYear}` : currentYear}
                        </div>
                        <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <Link href="/dashboard/financial/transactions" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-all border border-slate-700">
                        <List size={16} />
                        Lista
                    </Link>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Carregando dados financeiros...</span>
                </div>
            ) : viewMode === "mensal" ? (
                /* MONTHLY GRID VIEW */
                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-7 border-b border-white/[0.06] bg-slate-900/40">
                        {daysOfWeek.map(day => (
                            <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {calendarDays.map((cell, i) => (
                            <div 
                                key={i} 
                                onClick={() => {
                                    if (cell.isCurrentMonth && (cell.txs?.length ?? 0) > 0) {
                                        setSelectedDate(cell.date);
                                    }
                                }}
                                className={`
                                    min-h-[100px] border-r border-b border-white/[0.02] p-2 flex flex-col gap-1 transition-all
                                    ${!cell.isCurrentMonth ? 'bg-slate-900/20 opacity-30 cursor-default' : 'hover:bg-white/[0.02] cursor-pointer'}
                                    ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}
                                `}
                            >
                                {cell.isCurrentMonth && (
                                    <>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                                                cell.date?.toDateString() === new Date().toDateString() 
                                                ? 'bg-blue-600 text-white' 
                                                : 'text-slate-400'
                                            }`}>
                                                {cell.day}
                                            </span>
                                            {cell.txs && cell.txs.length > 0 && (
                                                <span className="text-[10px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">
                                                    {cell.txs.length} txs
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Financial Summary for the day */}
                                        {(cell.receitas ?? 0) > 0 && (
                                            <div className="flex justify-between items-center text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                <span className="truncate mr-1">+R$</span>
                                                <span className="font-bold">{(cell.receitas ?? 0).toLocaleString('pt-BR')}</span>
                                            </div>
                                        )}
                                        {(cell.despesas ?? 0) > 0 && (
                                            <div className="flex justify-between items-center text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20">
                                                <span className="truncate mr-1">-R$</span>
                                                <span className="font-bold">{(cell.despesas ?? 0).toLocaleString('pt-BR')}</span>
                                            </div>
                                        )}
                                        {(cell.saldo ?? 0) !== 0 && (
                                            <div className={`mt-auto text-right text-[11px] font-bold ${(cell.saldo ?? 0) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                ={formatBRL(cell.saldo ?? 0)}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* YEARLY GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {yearMonths.map((m) => (
                        <div 
                            key={m.name} 
                            onClick={() => {
                                setCurrentMonthIdx(m.idx);
                                setViewMode("mensal");
                            }}
                            className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5 hover:bg-slate-800/60 hover:border-blue-500/30 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-center mb-4 border-b border-white/[0.04] pb-3">
                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{m.name}</h3>
                                <div className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded-lg">
                                    {m.count} txs
                                </div>
                            </div>
                            
                            <div className="space-y-3 mb-5">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <TrendingUp size={14} className="text-emerald-400" />
                                        <span className="text-xs">Receitas</span>
                                    </div>
                                    <span className="text-sm font-medium text-emerald-400">{formatBRL(m.receitas)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <TrendingDown size={14} className="text-red-400" />
                                        <span className="text-xs">Despesas</span>
                                    </div>
                                    <span className="text-sm font-medium text-red-400">{formatBRL(m.despesas)}</span>
                                </div>
                            </div>
                            
                            <div className="pt-3 border-t border-white/[0.04] flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Saldo Previsto</span>
                                    <span className={`text-sm font-bold ${m.saldoPrevisto >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                                        {formatBRL(m.saldoPrevisto)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Saldo Efetivado</span>
                                    <span className={`text-sm font-bold ${m.saldoPago >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatBRL(m.saldoPago)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Detalhes do Dia */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" 
                        onClick={() => setSelectedDate(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                            onClick={e => e.stopPropagation()} 
                            className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-slate-800/40">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                        <CalendarDays size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white tracking-tight">Transações do Dia</h2>
                                        <p className="text-sm text-slate-400">{selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedDate(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="space-y-3">
                                    {transactions
                                        .filter(t => t.date.startsWith(`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`))
                                        .map(tx => (
                                            <div key={tx.id} className="bg-slate-800/40 border border-white/[0.04] p-4 rounded-xl flex items-center justify-between hover:bg-slate-800/60 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                                        isReceita(tx.typeGroup) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                                    }`}>
                                                        <DollarSign size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-white">{tx.description}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-slate-400">{tx.typeGroup}</span>
                                                            <span className="text-[10px] text-slate-600">•</span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                                                tx.status === 'Pago' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-700 text-slate-300 border border-slate-600'
                                                            }`}>
                                                                {tx.status === 'Pago' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                                                {tx.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-bold ${isReceita(tx.typeGroup) ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {isReceita(tx.typeGroup) ? '+' : '-'}{formatBRL(tx.value)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                            
                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-white/[0.06] bg-slate-900 flex justify-between items-center">
                                <Link href="/dashboard/financial/transactions" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                    Ver todas <ArrowRight size={14} />
                                </Link>
                                <button onClick={() => setSelectedDate(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors border border-white/[0.04]">
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
