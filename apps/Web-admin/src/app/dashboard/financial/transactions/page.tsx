"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
    ChevronLeft, 
    ChevronRight, 
    Filter, 
    Plus, 
    AlertCircle, 
    ArrowRightLeft,
    ChevronDown,
    BarChart3,
    Trash2,
    CheckCircle2,
    X,
    Paperclip,
    Pencil,
    AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { transactionTypesService, TransactionType } from "@/services/transaction-types.service";

interface TransactionFile {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

interface Transaction {
    id: string;
    userId: string;
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
    paymentMethod: string;
    costCenter: string;
    notes?: string | null;
    installment?: string | null;
    parentId?: string | null;
    files?: TransactionFile[];
}

export default function TransactionsPage() {
    const router = useRouter();
    const { toast, confirm } = useToast();
    const [activeTabs, setActiveTabs] = useState<string[]>(["Todas"]);
    const toggleTab = (tab: string) => {
        if (tab === "Todas") {
            setActiveTabs(["Todas"]);
            return;
        }
        
        setActiveTabs(prev => {
            let newTabs = prev.filter(t => t !== "Todas");
            if (newTabs.includes(tab)) {
                newTabs = newTabs.filter(t => t !== tab);
            } else {
                newTabs.push(tab);
            }
            return newTabs.length === 0 ? ["Todas"] : newTabs;
        });
    };
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    
    // Date filter states
    const [currentMonthIdx, setCurrentMonthIdx] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    
    // Sort states
    const [sortColumn, setSortColumn] = useState<string>("dueDate");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // Transactions state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Transaction types (dynamic, with nature income/expense) drive the revenue/expense split
    const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
    useEffect(() => {
        transactionTypesService.list().then(res => {
            if (res.success && res.data) setTransactionTypes(res.data);
        }).catch(() => { /* fallback: hardcoded income names below */ });
    }, []);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(30);

    // Advanced filters state
    const [statusFilter, setStatusFilter] = useState<"Todos" | "Pago" | "Previsto" | "Atrasado">("Todos");
    const [accountFilter, setAccountFilter] = useState("Todas as contas");
    const [costCenterFilter, setCostCenterFilter] = useState("Todos");

    // Reset pagination when filters or sorting change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTabs, statusFilter, accountFilter, costCenterFilter, currentMonthIdx, currentYear, sortColumn, sortDirection]);

    // Reload trigger state to reload transactions without looping
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const triggerReload = () => setReloadTrigger(prev => prev + 1);

    // Fetch transactions from API
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    month: String(currentMonthIdx + 1),
                    year: String(currentYear),
                });
                
                const response = await api<Transaction[]>(`/api/financial/transactions?${params.toString()}`);
                if (!isMounted) return;
                
                if (response.success && response.data) {
                    setTransactions(response.data);
                } else {
                    toast.error("Erro ao carregar transações", response.message || "Falha desconhecida.");
                }
            } catch (error) {
                if (!isMounted) return;
                console.error("[FETCH_TRANSACTIONS_ERROR]", error);
                toast.error("Erro de conexão", "Não foi possível conectar ao servidor da API.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [currentMonthIdx, currentYear, reloadTrigger]);

    const handlePrevMonth = () => {
        if (currentMonthIdx === 0) {
            setCurrentMonthIdx(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonthIdx(prev => prev - 1);
        }
    };
    
    const handleNextMonth = () => {
        if (currentMonthIdx === 11) {
            setCurrentMonthIdx(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonthIdx(prev => prev + 1);
        }
    };

    const isTransactionLate = (tx: Transaction) => {
        if (tx.status === "Pago") return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(tx.dueDate);
        return due < today;
    };

    const getTransactionTypeLabel = (tx: Transaction) => {
        if (tx.installment) return "Parcelado";
        if (tx.parentId) return "Recorrente";
        return "À vista";
    };

    const formatDate = (dateVal: string) => {
        if (!dateVal) return "";
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return dateVal;

        // Always interpret stored dates as UTC to avoid timezone shifting the day
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
    };

    // Client-side filtering and sorting logic
    // Dimension filters (category pills, account, cost center) scope both the table and the
    // header KPIs; the status filter applies only to the table — the header compares paid vs
    // predicted, so filtering it by status would make that comparison meaningless.
    const scopedTransactions = transactions.filter(t => {
        // 1. Tab filter
        if (!activeTabs.includes("Todas") && !activeTabs.includes(t.typeGroup)) return false;

        // 2. Account filter
        if (accountFilter !== "Todas as contas" && t.account !== accountFilter) return false;

        // 3. Cost Center filter
        if (costCenterFilter !== "Todos" && t.costCenter !== costCenterFilter) return false;

        return true;
    });

    const filteredTransactions = scopedTransactions.filter(t => {
        if (statusFilter === "Pago" && t.status !== "Pago") return false;
        if (statusFilter === "Previsto" && t.status !== "Previsto") return false;
        if (statusFilter === "Atrasado" && !isTransactionLate(t)) return false;
        return true;
    }).sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        switch (sortColumn) {
            case "dueDate": valA = a.dueDate; valB = b.dueDate; break;
            case "date": valA = a.date; valB = b.date; break;
            case "description": valA = (a.description || "").toLowerCase(); valB = (b.description || "").toLowerCase(); break;
            case "client": valA = (a.client || "").toLowerCase(); valB = (b.client || "").toLowerCase(); break;
            case "category": valA = (a.category || "").toLowerCase(); valB = (b.category || "").toLowerCase(); break;
            case "value": valA = a.value || 0; valB = b.value || 0; break;
            case "typeGroup": valA = (a.typeGroup || "").toLowerCase(); valB = (b.typeGroup || "").toLowerCase(); break;
            case "paymentMethod": valA = (a.paymentMethod || "").toLowerCase(); valB = (b.paymentMethod || "").toLowerCase(); break;
            case "status": valA = (a.status || "").toLowerCase(); valB = (b.status || "").toLowerCase(); break;
            default: valA = a.date; valB = b.date;
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
    });

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    // Pagination logic
    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / rowsPerPage));
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const pills = ["Todas", "Recebimentos", "MRR", "Entregas", "Despesas fixas", "Despesas variáveis", "Pessoas", "Impostos"];

    // Selection Logic
    const toggleSelectAll = () => {
        if (selectedRows.length === paginatedTransactions.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(paginatedTransactions.map(t => t.id));
        }
    };

    const toggleRow = (id: string) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    // Toggle Paid Status. Paying also resolves an eventual pendency flag, so the
    // transaction re-enters the header calculations (same behavior as the Pendências page).
    const togglePaid = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "Pago" ? "Previsto" : "Pago";
        try {
            const response = await api(`/api/financial/transactions/${id}`, {
                method: "PUT",
                body: newStatus === "Pago" ? { status: newStatus, pendency: false } : { status: newStatus },
            });
            if (response.success) {
                toast.success("Status updated", `Transação marcada como ${newStatus === "Pago" ? "paga" : "pendente"}.`);
                triggerReload();
            } else {
                toast.error("Erro ao atualizar status", response.message || "Erro desconhecido.");
            }
        } catch (error) {
            toast.error("Erro de conexão", "Não foi possível atualizar o status da transação.");
        }
    };

    // Toggle pendency flag on a revenue. Marking removes it from "Resultado previsto" and
    // navigates to the Pendências page; unmarking keeps the user on the list.
    const togglePendency = async (id: string, currentPendency: boolean) => {
        const newPendency = !currentPendency;
        try {
            const response = await api(`/api/financial/transactions/${id}`, {
                method: "PUT",
                body: { pendency: newPendency },
            });
            if (response.success) {
                if (newPendency) {
                    toast.success("Receita pendenciada", "Removida do resultado previsto. Redirecionando para Pendências...");
                    router.push("/dashboard/financial/pendencies");
                } else {
                    toast.success("Pendência removida", "Receita voltou a contar no resultado previsto.");
                    triggerReload();
                }
            } else {
                toast.error("Erro ao atualizar pendência", response.message || "Erro desconhecido.");
            }
        } catch (error) {
            toast.error("Erro de conexão", "Não foi possível atualizar a pendência da transação.");
        }
    };

    // Batch Actions
    const handleBatchPay = async () => {
        try {
            const response = await api(`/api/financial/transactions/batch-pay`, {
                method: "POST",
                body: { ids: selectedRows },
            });
            if (response.success) {
                toast.success("Sucesso", `${selectedRows.length} transações marcadas como pagas.`);
                setSelectedRows([]);
                triggerReload();
            } else {
                toast.error("Erro ao pagar em lote", response.message || "Erro desconhecido.");
            }
        } catch (error) {
            toast.error("Erro de conexão", "Falha de comunicação com o servidor.");
        }
    };

    const handleBatchDelete = async () => {
        const confirmed = await confirm({
            title: "Excluir transações?",
            description: `Tem certeza que deseja excluir as ${selectedRows.length} transações selecionadas? Esta ação é definitiva e removerá todos os anexos físicos.`,
            confirmLabel: "Excluir",
            cancelLabel: "Cancelar",
            variant: "danger",
        });
        if (!confirmed) return;

        try {
            const response = await api(`/api/financial/transactions/batch-delete`, {
                method: "POST",
                body: { ids: selectedRows },
            });
            if (response.success) {
                toast.success("Sucesso", "Transações excluídas com sucesso.");
                setSelectedRows([]);
                triggerReload();
            } else {
                toast.error("Erro ao excluir", response.message || "Erro desconhecido.");
            }
        } catch (error) {
            toast.error("Erro de conexão", "Falha ao enviar solicitação de exclusão.");
        }
    };

    const [recurrenceDeleteModal, setRecurrenceDeleteModal] = useState<{open: boolean; txId: string; parentId?: string | null}>({ open: false, txId: "" });
    const [recurrenceDeleteScope, setRecurrenceDeleteScope] = useState<"this" | "future" | "all">("this");

    const handleDeleteSingle = async (id: string, parentId?: string | null) => {
        if (parentId) {
            setRecurrenceDeleteScope("this");
            setRecurrenceDeleteModal({ open: true, txId: id, parentId });
            return;
        }

        const confirmed = await confirm({
            title: "Excluir transação?",
            description: "Tem certeza que deseja excluir esta transação? Arquivos comprovantes anexos também serão excluídos.",
            confirmLabel: "Excluir",
            cancelLabel: "Cancelar",
            variant: "danger",
        });
        if (!confirmed) return;

        await executeDelete(id);
    };

    const executeDelete = async (id: string, scope?: "this" | "future" | "all") => {
        try {
            const query = scope && scope !== "this" ? `?scope=${scope}` : "";
            const response = await api(`/api/financial/transactions/${id}${query}`, {
                method: "DELETE",
            });
            if (response.success) {
                toast.success("Sucesso", scope === "all" ? "Transações excluídas com sucesso." : scope === "future" ? "Transação e futuras excluídas com sucesso." : "Transação excluída com sucesso.");
                triggerReload();
            } else {
                toast.error("Erro ao excluir", response.message || "Erro desconhecido.");
            }
        } catch (error) {
            toast.error("Erro de conexão", "Falha ao excluir a transação.");
        }
    };

    // Format currency helper
    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Dynamic Calculations based on loaded month data
    // Revenue vs expense follows each transaction type's registered nature; the three
    // built-in names stay as fallback for when the types list hasn't loaded (or legacy rows).
    const incomeTypeNames = useMemo(() => {
        const names = new Set(["Recebimentos", "MRR", "Entregas"]);
        for (const t of transactionTypes) {
            if (t.nature === "income") names.add(t.name);
            else names.delete(t.name);
        }
        return names;
    }, [transactionTypes]);

    const isReceita = (typeGroup: string) => incomeTypeNames.has(typeGroup);

    // Anything flagged as "pendência" stays out of every header calculation until it is
    // paid or unflagged on the Pendências page. Paying (here or there) clears the flag.
    // "Transferência" rows (e.g. aplicações em investimentos) move money between accounts
    // without being income or expense — excluded, matching the reports' behavior.
    // Sums use Math.abs because auto-generated rows (investments, distribuição de lucros)
    // store negative values, while manual entries are positive — direction comes from the
    // type's nature, not from the sign.
    const countsInKpis = (t: Transaction) => !t.pendency && t.typeGroup !== "Transferência";

    const totalRecebimentosPrevisto = scopedTransactions
        .filter(t => countsInKpis(t) && isReceita(t.typeGroup))
        .reduce((acc, curr) => acc + Math.abs(curr.value || 0), 0);

    const recebimentosPagos = scopedTransactions
        .filter(t => countsInKpis(t) && isReceita(t.typeGroup) && t.status === "Pago")
        .reduce((acc, curr) => acc + Math.abs(curr.value || 0), 0);

    const percRecebimentos = totalRecebimentosPrevisto > 0 ? (recebimentosPagos / totalRecebimentosPrevisto) * 100 : 0;

    const totalDespesasPrevisto = scopedTransactions
        .filter(t => countsInKpis(t) && !isReceita(t.typeGroup))
        .reduce((acc, curr) => acc + Math.abs(curr.value || 0), 0);

    const despesasPagas = scopedTransactions
        .filter(t => countsInKpis(t) && !isReceita(t.typeGroup) && t.status === "Pago")
        .reduce((acc, curr) => acc + Math.abs(curr.value || 0), 0);

    const percDespesas = totalDespesasPrevisto > 0 ? (despesasPagas / totalDespesasPrevisto) * 100 : 0;

    const saldoAtual = recebimentosPagos - despesasPagas;
    const resultadoPrevisto = totalRecebimentosPrevisto - totalDespesasPrevisto;

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto pb-32 animate-in fade-in duration-500">
            
            {/* Header & KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left side: Results & Progress bars */}
                <div className="lg:col-span-6 bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden transition-all">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-slate-400 font-medium">Resultado previsto no mês</h2>
                        <AlertCircle size={14} className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
                    </div>
                    <div className="text-3xl font-bold text-blue-500 mb-8 tracking-tight">{formatBRL(resultadoPrevisto)}</div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Recebimentos Progress */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-300">Recebimentos</span>
                                <span className="text-blue-500 font-bold">{percRecebimentos.toFixed(2)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(percRecebimentos, 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <div className="flex flex-col">
                                    <span className="text-blue-500 font-medium">Recebido</span>
                                    <span className="text-slate-400">Previsto</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-blue-500 font-bold transition-all">{formatBRL(recebimentosPagos)}</span>
                                    <span className="text-slate-400">{formatBRL(totalRecebimentosPrevisto)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Despesas Progress */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-300">Despesas</span>
                                <span className="text-red-400 font-bold">{percDespesas.toFixed(2)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(percDespesas, 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <div className="flex flex-col">
                                    <span className="text-red-400 font-medium">Pago</span>
                                    <span className="text-slate-400">Previsto</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-red-400 font-bold transition-all">{formatBRL(despesasPagas)}</span>
                                    <span className="text-slate-400">{formatBRL(totalDespesasPrevisto)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle: Mini Chart Mockup */}
                <div className="lg:col-span-3 bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-center items-center h-full min-h-[200px]">
                    <div className="flex items-center gap-2 text-slate-500 mb-4">
                        <BarChart3 size={16} />
                        <span className="text-sm font-medium">Fluxo de Caixa</span>
                    </div>
                    <div className="w-full flex items-end justify-between gap-2 h-24 mt-2 group cursor-pointer">
                        <div className="w-1/3 flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                            <div className="w-full bg-blue-500/20 rounded-t-sm h-12 relative border-t border-blue-500/50">
                                <div className="absolute bottom-0 w-full bg-red-500/20 h-8 border-t border-red-500/50"></div>
                            </div>
                            <span className="text-[10px] text-slate-500">anterior</span>
                        </div>
                        <div className="w-1/3 flex flex-col items-center gap-1">
                            <div className="w-full bg-blue-500/40 rounded-t-sm h-20 relative border-t border-blue-500/80">
                                <div className="absolute bottom-0 w-full bg-red-500/40 h-12 border-t border-red-500/80 transition-all duration-500" style={{ height: `${20 + (percDespesas / 2)}px` }}></div>
                            </div>
                            <span className="text-[10px] text-slate-300 font-bold">{months[currentMonthIdx]}/{currentYear}</span>
                        </div>
                        <div className="w-1/3 flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                            <div className="w-full bg-blue-500/20 rounded-t-sm h-14 relative border-t border-blue-500/50">
                                <div className="absolute bottom-0 w-full bg-red-500/20 h-6 border-t border-red-500/50"></div>
                            </div>
                            <span className="text-[10px] text-slate-500">seguinte</span>
                        </div>
                    </div>
                </div>

                {/* Right: Account Card */}
                <div className="lg:col-span-3 bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 h-full flex flex-col cursor-pointer hover:bg-slate-800/60 hover:border-white/10 transition-all group">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-blue-500 font-medium group-hover:text-blue-400 transition-colors">Conta Principal</span>
                        <ChevronDown size={16} className="text-slate-500" />
                    </div>
                    <div className="mt-auto space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-sm text-slate-400">Saldo atual:</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-blue-500 transition-all">{formatBRL(saldoAtual)}</span>
                                <span title="Reflete os pagamentos já baixados">
                                    <AlertCircle size={14} className="text-slate-500 hover:text-white transition-colors" />
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-sm text-slate-400">Previsão do mês:</span>
                            <span className="text-md font-bold text-slate-300">{formatBRL(resultadoPrevisto)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-slate-800/40 border border-white/[0.06] p-2 rounded-xl">
                
                {/* Month Selector */}
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} title="Mês anterior" aria-label="Mês anterior" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors active:scale-95 disabled:opacity-50">
                        <ChevronLeft size={16} />
                    </button>
                    <button title="Mês atual" aria-label="Mês atual" className="px-4 h-8 bg-blue-600 text-white text-xs font-bold rounded-lg tracking-wider hover:bg-blue-500 transition-colors active:scale-95">
                        {months[currentMonthIdx]}/{currentYear}
                    </button>
                    <button onClick={handleNextMonth} title="Próximo mês" aria-label="Próximo mês" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors active:scale-95 disabled:opacity-50">
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Pills */}
                <div className="flex flex-wrap gap-2">
                    {pills.map(pill => (
                        <button 
                            key={pill}
                            onClick={() => { toggleTab(pill); setSelectedRows([]); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                                activeTabs.includes(pill) 
                                ? "bg-blue-500 text-slate-900 shadow-[0_0_15px_rgba(34,255,181,0.3)]" 
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                        >
                            {pill}
                        </button>
                    ))}
                    <button onClick={() => {
                        const typeGroup = activeTabs.includes("Todas") ? "" : activeTabs[0];
                        const query = typeGroup ? `?typeGroup=${encodeURIComponent(typeGroup)}` : "";
                        router.push(`/dashboard/financial/transactions/new${query}`);
                    }} title="Nova transação" aria-label="Nova transação" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-dashed border-slate-600 active:scale-95">
                        <Plus size={14} />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsFilterOpen(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors active:scale-95 ${isFilterOpen ? 'bg-blue-500 text-slate-900 border-blue-500' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                        <Filter size={14} />
                        Filtrar
                    </button>
                </div>
            </div>

            {/* Floating Batch Actions */}
            {selectedRows.length > 0 && (
                <div className="bg-slate-800 border border-blue-500/30 p-3 rounded-xl flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-2">
                    <span className="text-sm font-medium text-white ml-2">{selectedRows.length} item(s) selecionado(s)</span>
                    <div className="flex gap-2">
                        <button onClick={handleBatchPay} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-xs font-bold active:scale-95">
                            <CheckCircle2 size={14} />
                            Marcar como Pago
                        </button>
                        <button onClick={handleBatchDelete} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-bold active:scale-95">
                            <Trash2 size={14} />
                            Excluir
                        </button>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 bg-slate-900/40 uppercase border-b border-white/[0.04] select-none">
                            <tr>
                                <th className="px-4 py-4 w-10">
                                    <input 
                                        title="Selecionar todas as transações"
                                        aria-label="Selecionar todas as transações"
                                        type="checkbox" 
                                        checked={paginatedTransactions.length > 0 && selectedRows.length === paginatedTransactions.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-700 bg-slate-800/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900 w-4 h-4 cursor-pointer transition-all" 
                                    />
                                </th>
                                <th className="px-4 py-4 font-medium tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("dueDate")}>
                                    <div className="flex items-center gap-1">Data {sortColumn === "dueDate" && (sortDirection === "asc" ? "↑" : "↓")}</div>
                                </th>
                                <th className="px-4 py-4 font-medium tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("description")}>
                                    <div className="flex items-center gap-1">Descrição {sortColumn === "description" && (sortDirection === "asc" ? "↑" : "↓")}</div>
                                </th>
                                <th className="px-4 py-4 font-medium tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("client")}>
                                    <div className="flex items-center gap-1">Recebido de / Pago a {sortColumn === "client" && (sortDirection === "asc" ? "↑" : "↓")}</div>
                                </th>
                                <th className="px-4 py-4 font-medium tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("category")}>
                                    <div className="flex items-center gap-1">Categoria {sortColumn === "category" && (sortDirection === "asc" ? "↑" : "↓")}</div>
                                </th>
                                <th className="px-4 py-4 font-medium tracking-wider text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("value")}>
                                    <div className="flex items-center justify-end gap-1">Valor {sortColumn === "value" && (sortDirection === "asc" ? "↑" : "↓")}</div>
                                </th>
                                <th className="px-4 py-4 font-medium tracking-wider text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("typeGroup")}>
                                    <div className="flex items-center justify-center gap-1">Tipo pagamento {sortColumn === "typeGroup" && (sortDirection === "asc" ? "↑" : "↓")}</div>
                                </th>
                                <th className="px-4 py-4 font-medium tracking-wider text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("paymentMethod")}>
                                    <div className="flex items-center justify-center gap-1">Modo de pagamento {sortColumn === "paymentMethod" && (sortDirection === "asc" ? "↑" : "↓")}</div>
                                </th>
                                <th className="px-4 py-4 font-medium tracking-wider text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("status")}>
                                    <div className="flex items-center justify-center gap-1">Pago? {sortColumn === "status" && (sortDirection === "asc" ? "↑" : "↓")}</div>
                                </th>
                                <th className="px-4 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {/* "Nova Transação" Row */}
                            <tr onClick={() => {
                                const typeGroup = activeTabs.includes("Todas") ? "" : activeTabs[0];
                                const query = typeGroup ? `?typeGroup=${encodeURIComponent(typeGroup)}` : "";
                                router.push(`/dashboard/financial/transactions/new${query}`);
                            }} className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer group">
                                <td colSpan={10} className="px-4 py-3">
                                    <div className="border border-dashed border-blue-500/30 rounded-lg p-2 flex items-center justify-center gap-2 text-blue-500 group-hover:border-blue-500/60 transition-colors">
                                        <Plus size={16} />
                                        <span className="font-medium text-sm">Nova transação ({activeTabs.includes("Todas") ? "Todas" : activeTabs.join(", ")})</span>
                                    </div>
                                </td>
                            </tr>

                            {/* Data Rows */}
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <span>Carregando transações do banco...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                                        Nenhuma transação encontrada para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : paginatedTransactions.map((tx) => {
                                const isLate = isTransactionLate(tx);
                                return (
                                    <tr key={tx.id} className={`hover:bg-slate-800/50 transition-colors group ${selectedRows.includes(tx.id) ? 'bg-blue-500/5' : ''}`}>
                                        <td className="px-4 py-4">
                                            <input 
                                                title="Selecionar transação"
                                                aria-label="Selecionar transação"
                                                type="checkbox" 
                                                checked={selectedRows.includes(tx.id)}
                                                onChange={() => toggleRow(tx.id)}
                                                className="rounded border-slate-700 bg-slate-800/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900 w-4 h-4 cursor-pointer transition-all" 
                                            />
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-300">{formatDate(tx.dueDate)}</span>
                                                {isLate && (
                                                    <span title="Transação em Atraso">
                                                        <AlertCircle size={14} className="text-red-400" />
                                                    </span>
                                                )}
                                                {tx.status === "Pago" && (
                                                    <span title="Pago">
                                                        <CheckCircle2 size={14} className="text-blue-500" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className={`font-medium line-clamp-1 transition-colors ${tx.status === "Pago" ? 'text-slate-400 line-through' : 'text-white'}`}>{tx.description}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <div className="w-3 h-3 bg-slate-800 rounded-sm"></div>
                                                {tx.costCenter}
                                            </div>
                                            {/* File attachments */}
                                            {tx.files && tx.files.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {tx.files.map(file => {
                                                        const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7777'}/api/financial/transactions/${tx.id}/attachments/${file.id}/download`;
                                                        return (
                                                            <a
                                                                key={file.id}
                                                                href={downloadUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white px-2 py-0.5 rounded text-[10px] border border-white/[0.04] transition-colors"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Paperclip size={10} />
                                                                <span className="max-w-[120px] truncate">{file.originalName}</span>
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-slate-300">{tx.client}</td>
                                        <td className="px-4 py-4 text-slate-400">{tx.category}</td>
                                        <td className={`px-4 py-4 font-bold text-right whitespace-nowrap transition-colors ${tx.status === "Pago" ? 'text-slate-500' : 'text-slate-200'}`}>
                                            {!isReceita(tx.typeGroup) ? `- ${formatBRL(Math.abs(tx.value))}` : formatBRL(Math.abs(tx.value))}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                {tx.installment ? (
                                                    <span className="bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full text-[10px] font-bold mb-1">
                                                        {tx.installment}
                                                    </span>
                                                ) : null}
                                                <span className="text-xs text-slate-300">{getTransactionTypeLabel(tx)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center text-slate-400">{tx.paymentMethod}</td>
                                        <td className="px-4 py-4 text-center">
                                            <button 
                                                onClick={() => togglePaid(tx.id, tx.status)}
                                                className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer active:scale-95 ${tx.status === "Pago" ? 'bg-blue-500' : 'bg-slate-700'}`}
                                                title={tx.status === "Pago" ? 'Marcar como não pago' : 'Marcar como pago'}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${tx.status === "Pago" ? 'right-1' : 'left-1'}`}></div>
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1">
                                                {isReceita(tx.typeGroup) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); togglePendency(tx.id, !!tx.pendency); }}
                                                        title={tx.pendency ? "Remover pendência (volta a contar no resultado previsto)" : "Marcar receita como pendência"}
                                                        aria-label={tx.pendency ? "Remover pendência" : "Pendenciar receita"}
                                                        className={`inline-flex items-center gap-1 px-2 h-8 rounded-lg text-[11px] font-medium border transition-all active:scale-95 ${
                                                            tx.pendency
                                                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                                                                : "text-slate-500 border-transparent hover:text-amber-400 hover:bg-slate-700/50 hover:border-slate-600"
                                                        }`}
                                                    >
                                                        <AlertTriangle size={14} />
                                                        <span className="hidden lg:inline">{tx.pendency ? "Pendência" : "Pendenciar"}</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/financial/transactions/${tx.id}/edit`); }}
                                                    title="Editar transação"
                                                    aria-label="Editar transação" 
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-slate-600 active:scale-95"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSingle(tx.id, tx.parentId); }}
                                                    title="Excluir transação" 
                                                    aria-label="Excluir transação" 
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-slate-600 active:scale-95"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-wrap items-center justify-between px-4 py-4 border-t border-white/[0.04] bg-slate-900/20 gap-4">
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                            <span>Linhas por página:</span>
                            <select 
                                title="Linhas por página"
                                value={rowsPerPage} 
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-slate-800 border border-slate-700 rounded text-slate-300 px-2 py-1 focus:outline-none focus:border-blue-500"
                            >
                                <option value={10}>10</option>
                                <option value={30}>30</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <span className="hidden sm:inline">
                            Mostrando {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, filteredTransactions.length)} de {filteredTransactions.length} registros
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            title="Página Anterior"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm text-slate-300 font-medium px-2">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button 
                            title="Próxima Página"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Recurrence Delete Scope Modal */}
            {recurrenceDeleteModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <div>
                                <h3 className="font-bold text-xl text-white">Excluir recorrência</h3>
                                <p className="text-sm text-slate-400 mt-1">Escolha o alcance da exclusão.</p>
                            </div>
                            <button onClick={() => setRecurrenceDeleteModal({ open: false, txId: "" })} title="Fechar" aria-label="Fechar" className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            {[
                                { value: "this", label: "Apagar somente esta transação", desc: "Remove apenas a parcela selecionada." },
                                { value: "future", label: "Apagar esta e as futuras transações", desc: "Remove a partir desta parcela em diante." },
                                { value: "all", label: "Apagar essa e todas as transações", desc: "Remove toda a recorrência vinculada." },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                                        recurrenceDeleteScope === option.value
                                            ? "bg-blue-500/10 border-blue-500/40"
                                            : "bg-slate-800/50 border-white/[0.04] hover:bg-slate-800"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="delete-scope"
                                        value={option.value}
                                        checked={recurrenceDeleteScope === option.value}
                                        onChange={(e) => setRecurrenceDeleteScope(e.target.value as "this" | "future" | "all")}
                                        className="mt-1 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/50"
                                    />
                                    <div>
                                        <div className="text-sm font-semibold text-white">{option.label}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{option.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setRecurrenceDeleteModal({ open: false, txId: "" })}
                                className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    setRecurrenceDeleteModal({ open: false, txId: "" });
                                    executeDelete(recurrenceDeleteModal.txId, recurrenceDeleteScope);
                                }}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Transferência */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <div>
                                <h3 className="font-bold text-xl text-white">Transferência entre Contas</h3>
                                <p className="text-sm text-slate-400 mt-1">Mova saldo internamente sem afetar o resultado.</p>
                            </div>
                            <button onClick={() => setIsTransferModalOpen(false)} title="Fechar" aria-label="Fechar" className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">De (Conta Origem)</label>
                                <select title="De (Conta Origem)" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                    <option>Conta Principal Itaú</option>
                                    <option>Nubank</option>
                                </select>
                            </div>
                            <div className="flex justify-center -my-2 relative z-10">
                                <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400">
                                    <ArrowRightLeft size={14} className="rotate-90" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">Para (Conta Destino)</label>
                                <select title="Para (Conta Destino)" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                    <option>Reserva de Emergência</option>
                                    <option>Caixa Físico</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Valor (R$)</label>
                                    <input type="number" step="0.01" placeholder="0,00" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Data</label>
                                    <input title="Data" type="date" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                            <button onClick={() => setIsTransferModalOpen(false)} className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">Cancelar</button>
                            <button onClick={() => setIsTransferModalOpen(false)} className="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors">Realizar Transferência</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Drawer */}
            {isFilterOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsFilterOpen(false)}></div>
                    <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-slate-900 border-l border-slate-800 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <Filter size={18} />
                                <h2 className="font-bold text-lg">Filtros Avançados</h2>
                            </div>
                            <button onClick={() => setIsFilterOpen(false)} title="Fechar" aria-label="Fechar" className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Status do Pagamento</label>
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("Todos")}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border ${
                                            statusFilter === "Todos"
                                            ? "bg-blue-600 text-white border-blue-500"
                                            : "bg-slate-800/50 text-slate-400 border-white/[0.04] hover:bg-slate-800/80"
                                        } mb-1`}
                                    >
                                        Todos os Status
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("Pago")}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border ${
                                            statusFilter === "Pago"
                                            ? "bg-blue-600 text-white border-blue-500"
                                            : "bg-slate-800/50 text-slate-400 border-white/[0.04] hover:bg-slate-800/80"
                                        } mb-1`}
                                    >
                                        Apenas Pagos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("Previsto")}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border ${
                                            statusFilter === "Previsto"
                                            ? "bg-blue-600 text-white border-blue-500"
                                            : "bg-slate-800/50 text-slate-400 border-white/[0.04] hover:bg-slate-800/80"
                                        } mb-1`}
                                    >
                                        Apenas Pendentes (Previstos)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("Atrasado")}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border ${
                                            statusFilter === "Atrasado"
                                            ? "bg-red-600 text-white border-red-500"
                                            : "bg-slate-800/50 text-slate-400 border-white/[0.04] hover:bg-slate-800/80"
                                        }`}
                                    >
                                        Transações em Atraso
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Conta Bancária</label>
                                <select 
                                    title="Conta Bancária" 
                                    value={accountFilter}
                                    onChange={(e) => setAccountFilter(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                                >
                                    <option value="Todas as contas">Todas as contas</option>
                                    <option value="Conta Principal">Conta Principal</option>
                                    <option value="Caixa Interno">Caixa Interno</option>
                                    <option value="Reserva de Lucros">Reserva de Lucros</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Centro de Custo</label>
                                <select 
                                    title="Centro de Custo" 
                                    value={costCenterFilter}
                                    onChange={(e) => setCostCenterFilter(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                                >
                                    <option value="Todos">Todos os Centros</option>
                                    <option value="Comercial">Comercial</option>
                                    <option value="Tecnologia">Tecnologia</option>
                                    <option value="Operacional">Operacional</option>
                                    <option value="Marketing">Marketing / Branding</option>
                                    <option value="Diretoria">Diretoria / Sócios</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 flex gap-3">
                            <button 
                                onClick={() => {
                                    setStatusFilter("Todos");
                                    setAccountFilter("Todas as contas");
                                    setCostCenterFilter("Todos");
                                    setIsFilterOpen(false);
                                }} 
                                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors"
                            >
                                Limpar Filtros
                            </button>
                            <button onClick={() => setIsFilterOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors">Aplicar</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

