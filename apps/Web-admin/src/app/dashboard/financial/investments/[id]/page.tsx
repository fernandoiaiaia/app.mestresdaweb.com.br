"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Wallet, TrendingUp, TrendingDown, Calendar, ArrowRightLeft, DollarSign, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { investmentsService, Investment } from "@/services/investments.service";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function InvestmentDetailsPage() {
    const params = useParams();
    const { toast } = useToast();
    const [investment, setInvestment] = useState<Investment | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBalance, setNewBalance] = useState("");
    const [notes, setNotes] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await investmentsService.getById(params.id as string);
            if (res.success && res.data) {
                setInvestment(res.data);
            }
        } catch (error) {
            toast.error("Erro", "Falha ao carregar os dados.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [params.id]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };

    const handleUpdateBalance = async () => {
        const balanceNum = parseFloat(newBalance.replace(/\./g, '').replace(',', '.'));
        if (isNaN(balanceNum) || balanceNum < 0) {
            toast.error("Atenção", "Informe um saldo válido.");
            return;
        }

        setIsUpdating(true);
        try {
            const res = await investmentsService.updateBalance(investment!.id, balanceNum, notes);
            if (res.success) {
                toast.success("Sucesso", "Saldo atualizado com sucesso!");
                setIsModalOpen(false);
                setNewBalance("");
                setNotes("");
                loadData(); // recarrega para pegar o histórico novo
            } else {
                toast.error("Erro", "Falha ao atualizar o saldo.");
            }
        } catch (error) {
            toast.error("Erro", "Erro ao conectar com servidor.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!investment) return null;

    const totalYield = investment.currentBalance - investment.initialAmount;
    const isTotalPositive = totalYield >= 0;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/financial/investments" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><TrendingUp size={14} /><span>Investimentos</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Detalhes</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                            {investment.type.substring(0, 3)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-white tracking-tight">{investment.name}</h1>
                                <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-xs font-bold text-indigo-400 uppercase tracking-wider">{investment.institution}</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{investment.type} • Criado em {format(new Date(investment.createdAt), 'dd/MM/yyyy')}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20"
                    >
                        <ArrowRightLeft size={16} /> Atualizar Saldo
                    </button>
                </div>
            </motion.div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800/40 border border-white/[0.06] p-6 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Valor Inicial</span>
                    <span className="text-2xl font-bold text-white">{formatCurrency(investment.initialAmount)}</span>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <Calendar size={14} /> Início: {format(new Date(investment.startDate), 'dd/MM/yyyy')}
                    </div>
                </div>
                
                <div className="bg-slate-800/40 border border-white/[0.06] p-6 rounded-2xl border-l-4 border-l-indigo-500">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Saldo Atual</span>
                    <span className="text-2xl font-bold text-white">{formatCurrency(investment.currentBalance)}</span>
                    {investment.account && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                            <Wallet size={14} /> Origem: {investment.account.name}
                        </div>
                    )}
                </div>

                <div className={`p-6 rounded-2xl ${isTotalPositive ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"}`}>
                    <span className={`text-xs font-bold uppercase tracking-widest mb-1 block ${isTotalPositive ? "text-emerald-500/80" : "text-rose-500/80"}`}>Rendimento Acumulado</span>
                    <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${isTotalPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isTotalPositive ? "+" : ""}{formatCurrency(totalYield)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Histórico */}
            <h3 className="text-lg font-bold text-white mb-4">Histórico de Atualizações</h3>
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-white/[0.06]">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Anterior</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Novo Saldo</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rendimento</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Observação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {investment.history?.map((h) => {
                                const isPos = h.yield >= 0;
                                return (
                                    <tr key={h.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 text-sm text-slate-300">{format(new Date(h.date), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="p-4 text-sm text-slate-400">{formatCurrency(h.previousBalance)}</td>
                                        <td className="p-4 text-sm font-bold text-white">{formatCurrency(h.newBalance)}</td>
                                        <td className={`p-4 text-sm font-bold flex items-center gap-1 ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                                            {isPos ? "+" : ""}{formatCurrency(h.yield)}
                                            {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">{h.notes || "-"}</td>
                                    </tr>
                                );
                            })}
                            {(!investment.history || investment.history.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                                        Nenhum histórico registrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Atualizar Saldo */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-white/10 p-6 md:p-8 rounded-2xl w-full max-w-md relative shadow-2xl"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            
                            <h2 className="text-xl font-bold text-white mb-2">Atualizar Saldo</h2>
                            <p className="text-sm text-slate-400 mb-6">Insira o saldo atualizado da aplicação. O rendimento será calculado automaticamente.</p>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-800/50 border border-white/5 rounded-xl flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Saldo Anterior</span>
                                    <span className="text-sm font-bold text-slate-300">{formatCurrency(investment.currentBalance)}</span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Novo Saldo Total (R$)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <DollarSign size={16} className="text-slate-500" />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: 10500,00"
                                            value={newBalance} 
                                            onChange={e => setNewBalance(e.target.value)} 
                                            className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-emerald-500/30 rounded-xl text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/80" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Observações (Opcional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Rendimento do mês de Maio"
                                        value={notes} 
                                        onChange={e => setNotes(e.target.value)} 
                                        className="w-full px-4 py-3 bg-slate-950 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" 
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors">
                                        Cancelar
                                    </button>
                                    <button onClick={handleUpdateBalance} disabled={isUpdating} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                                        {isUpdating ? "Salvando..." : "Confirmar Saldo"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
