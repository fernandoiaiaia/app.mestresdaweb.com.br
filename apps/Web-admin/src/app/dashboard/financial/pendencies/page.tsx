"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    AlertTriangle,
    Clock,
    CheckCircle2,
    ChevronRight,
    X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface Transaction {
    id: string;
    description: string;
    client: string;
    value: number;
    typeGroup: string;
    category: string;
    date: string;
    dueDate: string;
    status: string;
    pendency?: boolean;
    account: string;
    costCenter: string;
}

export default function PendenciesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const triggerReload = () => setReloadTrigger(prev => prev + 1);

    // Fetch all transactions and keep only the ones that aren't paid yet
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const response = await api<Transaction[]>(`/api/financial/transactions`);
                if (!isMounted) return;

                if (response.success && response.data) {
                    const pending = response.data.filter(t => t.pendency === true);
                    setTransactions(pending);
                } else {
                    toast.error("Erro ao carregar pendências", response.message || "Falha desconhecida.");
                }
            } catch (error) {
                if (!isMounted) return;
                console.error("[FETCH_PENDENCIES_ERROR]", error);
                toast.error("Erro de conexão", "Não foi possível conectar ao servidor da API.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [reloadTrigger]);

    const isLate = useCallback((tx: Transaction) => {
        if (tx.status === "Pago") return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(tx.dueDate);
        return due < today;
    }, []);

    const formatDate = (dateVal: string) => {
        if (!dateVal) return "";
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return dateVal;
        const day = String(d.getUTCDate()).padStart(2, "0");
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

    // Sort: overdue first, then by closest due date
    const sorted = [...transactions].sort((a, b) => {
        const lateA = isLate(a);
        const lateB = isLate(b);
        if (lateA !== lateB) return lateA ? -1 : 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    const overdue = sorted.filter(isLate);
    const upcoming = sorted.filter(t => !isLate(t));

    const totalOverdue = overdue.reduce((sum, t) => sum + (t.value || 0), 0);
    const totalUpcoming = upcoming.reduce((sum, t) => sum + (t.value || 0), 0);

    const toggleRow = (id: string) => {
        setSelectedRows(prev => (prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        if (selectedRows.length === sorted.length) setSelectedRows([]);
        else setSelectedRows(sorted.map(t => t.id));
    };

    // Resolve pendency: mark as paid AND clear the pendency flag so it returns to the forecast.
    const handleMarkAsPaid = async (ids: string[]) => {
        if (ids.length === 0) return;
        try {
            const results = await Promise.all(
                ids.map(id =>
                    api(`/api/financial/transactions/${id}`, {
                        method: "PUT",
                        body: { status: "Pago", pendency: false },
                    })
                )
            );
            const failed = results.filter(r => !r.success).length;
            if (failed === 0) {
                toast.success("Sucesso", `${ids.length} pendência(s) quitada(s).`);
            } else {
                toast.error("Atenção", `${ids.length - failed} quitada(s), ${failed} com erro.`);
            }
            setSelectedRows([]);
            triggerReload();
        } catch (error) {
            toast.error("Erro de conexão", "Falha de comunicação com o servidor.");
        }
    };

    // Remove the pendency flag without marking as paid (revenue returns to the forecast).
    const handleRemovePendency = async (id: string) => {
        try {
            const response = await api(`/api/financial/transactions/${id}`, {
                method: "PUT",
                body: { pendency: false },
            });
            if (response.success) {
                toast.success("Pendência removida", "Lançamento voltou a contar no resultado previsto.");
                setSelectedRows(prev => prev.filter(r => r !== id));
                triggerReload();
            } else {
                toast.error("Erro ao remover", response.message || "Erro desconhecido.");
            }
        } catch (error) {
            toast.error("Erro de conexão", "Falha de comunicação com o servidor.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertCircle size={24} className="text-blue-500" />
                        Pendências
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Receitas marcadas como pendência — não entram no resultado previsto do mês.
                    </p>
                </div>
                {selectedRows.length > 0 && (
                    <button
                        onClick={() => handleMarkAsPaid(selectedRows)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                    >
                        <CheckCircle2 size={18} />
                        Marcar {selectedRows.length} como pago
                    </button>
                )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-wide">
                        <AlertTriangle size={16} /> Vencidas
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{formatCurrency(totalOverdue)}</p>
                    <p className="text-slate-500 text-xs mt-1">{overdue.length} lançamento(s)</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wide">
                        <Clock size={16} /> A vencer
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{formatCurrency(totalUpcoming)}</p>
                    <p className="text-slate-500 text-xs mt-1">{upcoming.length} lançamento(s)</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wide">
                        <AlertCircle size={16} /> Total em aberto
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{formatCurrency(totalOverdue + totalUpcoming)}</p>
                    <p className="text-slate-500 text-xs mt-1">{sorted.length} lançamento(s)</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-400 text-sm">Carregando pendências...</div>
                ) : sorted.length === 0 ? (
                    <div className="p-12 text-center">
                        <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                        <p className="text-white font-medium">Nenhuma receita pendenciada</p>
                        <p className="text-slate-500 text-sm mt-1">Marque uma receita como pendência na tela de Transações para vê-la aqui.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wide">
                                    <th className="p-3 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.length === sorted.length && sorted.length > 0}
                                            onChange={toggleAll}
                                            className="accent-blue-600"
                                        />
                                    </th>
                                    <th className="p-3 text-left font-semibold">Vencimento</th>
                                    <th className="p-3 text-left font-semibold">Descrição</th>
                                    <th className="p-3 text-left font-semibold">Cliente</th>
                                    <th className="p-3 text-left font-semibold">Categoria</th>
                                    <th className="p-3 text-right font-semibold">Valor</th>
                                    <th className="p-3 text-left font-semibold">Situação</th>
                                    <th className="p-3 text-right font-semibold">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map(tx => {
                                    const late = isLate(tx);
                                    return (
                                        <tr
                                            key={tx.id}
                                            className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="p-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(tx.id)}
                                                    onChange={() => toggleRow(tx.id)}
                                                    className="accent-blue-600"
                                                />
                                            </td>
                                            <td className="p-3 text-slate-300 whitespace-nowrap">{formatDate(tx.dueDate)}</td>
                                            <td className="p-3 text-white font-medium">{tx.description}</td>
                                            <td className="p-3 text-slate-400">{tx.client || "—"}</td>
                                            <td className="p-3 text-slate-400">{tx.category || "—"}</td>
                                            <td className="p-3 text-right text-slate-200 whitespace-nowrap">{formatCurrency(tx.value)}</td>
                                            <td className="p-3">
                                                {late ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                                        <AlertTriangle size={12} /> Vencida
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                                                        <Clock size={12} /> A vencer
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleRemovePendency(tx.id)}
                                                        title="Remover pendência (volta ao resultado previsto)"
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                                    >
                                                        <X size={14} /> Remover
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkAsPaid([tx.id])}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                                    >
                                                        <CheckCircle2 size={14} /> Pagar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer link */}
            <button
                onClick={() => router.push("/dashboard/financial/transactions")}
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
                Ver todas as transações <ChevronRight size={16} />
            </button>
        </div>
    );
}
