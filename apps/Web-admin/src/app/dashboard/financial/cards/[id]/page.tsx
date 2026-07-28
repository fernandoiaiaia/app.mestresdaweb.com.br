"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Pencil, X, CalendarDays, ExternalLink, MoreVertical, Plus, Trash2, Edit } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Expense {
    id: string;
    date: string;
    description: string;
    category: string;
    value: number;
    installment: string | null;
}

interface Invoice {
    id: string;
    month: number;
    year: number;
    totalValue: number;
    status: string;
    dueDate: string;
    expenses: Expense[];
}

interface CreditCard {
    id: string;
    name: string;
    brand: string;
    limit: number | null;
    closingDay: number;
    dueDay: number;
    color: string;
    invoices: Invoice[];
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fullMonthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function CreditCardDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const cardId = params.id as string;

    const [card, setCard] = useState<CreditCard | null>(null);
    const [loading, setLoading] = useState(true);

    const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
    const [isEditingCard, setIsEditingCard] = useState(false);
    const [editCardName, setEditCardName] = useState("");
    const [editCardBrand, setEditCardBrand] = useState("");
    const [editCardLimit, setEditCardLimit] = useState("");
    const [editCardClosingDay, setEditCardClosingDay] = useState("");
    const [editCardDueDay, setEditCardDueDay] = useState("");
    const [editCardColor, setEditCardColor] = useState("blue");

    // Layout States
    const [activeTab, setActiveTab] = useState<"future" | "history">("future");
    const [futurePage, setFuturePage] = useState(0);
    const [historyPage, setHistoryPage] = useState(0);
    const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

    // Modals
    const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
    const [newInvoiceMonth, setNewInvoiceMonth] = useState("");
    const [newInvoiceYear, setNewInvoiceYear] = useState("");
    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [editInvoiceDueDate, setEditInvoiceDueDate] = useState("");
    const [editInvoiceStatus, setEditInvoiceStatus] = useState("open");
    const [isUpdatingInvoice, setIsUpdatingInvoice] = useState(false);

    const loadCard = async () => {
        try {
            setLoading(true);
            const res = await api<CreditCard>(`/api/financial/cards/${cardId}`);
            if (res && res.success && res.data) {
                setCard(res.data);
            }
        } catch (error) {
            toast.error("Erro ao carregar detalhes do cartão");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCard();
    }, [cardId]);

    const handleUpdateCard = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsEditingCard(true);
            const res = await api(`/api/financial/cards/${cardId}`, {
                method: "PUT",
                body: {
                    name: editCardName,
                    brand: editCardBrand,
                    limit: editCardLimit ? parseFloat(editCardLimit.replace(/\./g, '').replace(',', '.')) : null,
                    closingDay: parseInt(editCardClosingDay),
                    dueDay: parseInt(editCardDueDay),
                    color: editCardColor
                }
            });

            if (res.success) {
                toast.success("Cartão atualizado!");
                setIsEditCardModalOpen(false);
                loadCard();
            } else {
                toast.error("Erro ao atualizar cartão");
            }
        } catch {
            toast.error("Erro interno ao atualizar cartão");
        } finally {
            setIsEditingCard(false);
        }
    };

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsCreatingInvoice(true);
            const res = await api(`/api/financial/cards/${cardId}/invoices`, {
                method: "POST",
                body: { month: parseInt(newInvoiceMonth), year: parseInt(newInvoiceYear) }
            });
            if (res.success) {
                toast.success("Fatura criada com sucesso!");
                setIsNewInvoiceModalOpen(false);
                loadCard();
            } else {
                toast.error(res.error?.message || "Erro ao criar fatura");
            }
        } catch {
            toast.error("Erro interno ao criar fatura");
        } finally {
            setIsCreatingInvoice(false);
        }
    };

    const handleUpdateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingInvoice) return;
        try {
            setIsUpdatingInvoice(true);
            const res = await api(`/api/financial/cards/${cardId}/invoices/${editingInvoice.id}`, {
                method: "PUT",
                body: {
                    dueDate: new Date(editInvoiceDueDate).toISOString(),
                    status: editInvoiceStatus
                }
            });
            if (res.success) {
                toast.success("Fatura atualizada!");
                setEditingInvoice(null);
                loadCard();
            } else {
                toast.error("Erro ao atualizar fatura");
            }
        } catch {
            toast.error("Erro interno");
        } finally {
            setIsUpdatingInvoice(false);
        }
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        if (!confirm("Atenção! Excluir esta fatura APAGARÁ TODOS OS GASTOS associados a ela. Deseja continuar?")) return;
        try {
            const res = await api(`/api/financial/cards/${cardId}/invoices/${invoiceId}`, { method: "DELETE" });
            if (res.success) {
                toast.success("Fatura excluída com sucesso.");
                loadCard();
            } else {
                toast.error("Erro ao excluir fatura.");
            }
        } catch {
            toast.error("Erro interno");
        }
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClick = () => setOpenMenuKey(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>;
    }

    if (!card) {
        return <div className="p-8 text-center text-white">Cartão não encontrado.</div>;
    }

    let bgGradient = "from-slate-700 to-slate-900";
    if (card.color === 'purple') bgGradient = "from-purple-600 to-violet-900";
    if (card.color === 'orange') bgGradient = "from-orange-500 to-red-600";
    if (card.color === 'blue') bgGradient = "from-blue-600 to-indigo-900";
    if (card.color === 'black') bgGradient = "from-slate-800 to-black";
    if (card.color === 'green') bgGradient = "from-emerald-500 to-teal-800";

    // Date calculations
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Determine Future vs History
    const historyInvoices = card.invoices.filter(inv => {
        // History: status is closed/paid OR date is before current month
        if (inv.status !== 'open') return true;
        if (inv.year < currentYear) return true;
        if (inv.year === currentYear && inv.month < currentMonth) return true;
        return false;
    }).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });

    // Calculate max future month for generating grid
    let maxFutureMonthsAhead = 12; // default 12
    card.invoices.forEach(inv => {
        if (inv.status === 'open' && (inv.year > currentYear || (inv.year === currentYear && inv.month >= currentMonth))) {
            const diff = (inv.year - currentYear) * 12 + (inv.month - currentMonth);
            if (diff >= maxFutureMonthsAhead) {
                maxFutureMonthsAhead = diff + 1;
            }
        }
    });
    const totalFuturePages = Math.ceil(maxFutureMonthsAhead / 12);
    const generatedFutureMonthsLimit = totalFuturePages * 12;

    const futureMonthsGrid = Array.from({ length: generatedFutureMonthsLimit }).map((_, i) => {
        let y = currentYear;
        let m = currentMonth + i;
        if (m > 11) {
            y += Math.floor(m / 12);
            m = m % 12;
        }
        return { year: y, month: m };
    });

    const paginatedFuture = futureMonthsGrid.slice(futurePage * 12, (futurePage + 1) * 12);
    const paginatedHistory = historyInvoices.slice(historyPage * 12, (historyPage + 1) * 12);
    const totalHistoryPages = Math.ceil(historyInvoices.length / 12);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/financial/cards" className="text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {card.name} <span className="text-sm font-normal text-slate-500">({card.brand})</span>
                    <button onClick={() => {
                        setEditCardName(card.name);
                        setEditCardBrand(card.brand || "Mastercard");
                        setEditCardLimit(card.limit ? card.limit.toString() : "");
                        setEditCardClosingDay(card.closingDay.toString());
                        setEditCardDueDay(card.dueDay.toString());
                        setEditCardColor(card.color || "blue");
                        setIsEditCardModalOpen(true);
                    }} className="text-slate-400 hover:text-white transition-colors ml-2"><Pencil size={18} /></button>
                </h1>
            </div>

            {/* Layout Flexbox for Card + Summary on Top/Left */}
            <div className="flex flex-col xl:flex-row gap-8">
                
                {/* Physical Card Representation */}
                <div className="w-full xl:w-96 flex-shrink-0">
                    <div className={`relative bg-gradient-to-br ${bgGradient} rounded-3xl p-8 shadow-2xl border border-white/10 h-64 flex flex-col justify-between transform transition-transform hover:scale-[1.02] duration-300`}>
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-10 bg-yellow-400/80 rounded-md shadow-inner flex items-center justify-center overflow-hidden">
                                <div className="w-12 h-8 border border-yellow-600/30 rounded-sm"></div>
                            </div>
                            <span className="text-white/80 font-bold italic tracking-wider text-xl">{card.brand}</span>
                        </div>
                        <div>
                            <h3 className="text-white text-2xl font-semibold tracking-wide drop-shadow-md mb-2">{card.name}</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/60 text-[10px] uppercase tracking-widest">Fechamento</p>
                                    <p className="text-white text-sm font-semibold">Dia {card.closingDay}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-[10px] uppercase tracking-widest">Vencimento</p>
                                    <p className="text-white text-sm font-semibold">Dia {card.dueDay}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary / Actions */}
                <div className="flex-1 bg-slate-800/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Resumo do Cartão</h2>
                            <p className="text-slate-400 text-sm">Controle as próximas faturas ou o histórico de faturas pagas.</p>
                        </div>
                        <button 
                            onClick={() => {
                                const nextMonth = (currentMonth + 1) % 12;
                                const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
                                setNewInvoiceMonth(nextMonth.toString());
                                setNewInvoiceYear(nextYear.toString());
                                setIsNewInvoiceModalOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} /> Nova Fatura
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Limite</p>
                            <p className="text-lg font-bold text-white">
                                {card.limit ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit) : 'Ilimitado'}
                            </p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Faturas Abertas</p>
                            <p className="text-lg font-bold text-blue-400">{card.invoices.filter(i => i.status === 'open').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Area */}
            <div className="pt-6">
                <div className="flex items-center gap-6 border-b border-white/10 mb-6">
                    <button 
                        onClick={() => setActiveTab("future")}
                        className={`pb-3 text-sm font-bold tracking-wide transition-colors relative ${activeTab === "future" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"}`}
                    >
                        Próximas Faturas
                        {activeTab === "future" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab("history")}
                        className={`pb-3 text-sm font-bold tracking-wide transition-colors relative ${activeTab === "history" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"}`}
                    >
                        Histórico
                        {activeTab === "history" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></span>}
                    </button>
                </div>

                {/* FUTURE TAB */}
                {activeTab === "future" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {paginatedFuture.map((um) => {
                                const monthKey = `${um.year}-${um.month}`;
                                const invoice = card.invoices.find(inv => inv.month === um.month && inv.year === um.year);
                                const totalValue = invoice ? invoice.totalValue : 0;
                                const status = invoice ? invoice.status : 'open';
                                
                                return (
                                    <div 
                                        key={monthKey} 
                                        className="bg-slate-800 border border-white/5 rounded-2xl p-5 hover:bg-slate-750 hover:border-slate-600 transition-all duration-300 group hover:shadow-xl relative overflow-visible"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>
                                        
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="cursor-pointer" onClick={() => router.push(`/dashboard/financial/cards/${cardId}/invoices/${um.year}/${um.month}`)}>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{um.year}</p>
                                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{fullMonthNames[um.month]}</h3>
                                            </div>
                                            
                                            {/* Action Menu */}
                                            <div className="relative">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setOpenMenuKey(openMenuKey === monthKey ? null : monthKey); }}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-700 transition-colors"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                {openMenuKey === monthKey && invoice && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in-95">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setEditingInvoice(invoice); setEditInvoiceDueDate(new Date(invoice.dueDate).toISOString().split('T')[0]); setEditInvoiceStatus(invoice.status); setOpenMenuKey(null); }}
                                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                                        >
                                                            <Edit size={14} /> Editar
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id); setOpenMenuKey(null); }}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} /> Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div 
                                            className="mt-6 flex flex-col justify-end cursor-pointer"
                                            onClick={() => router.push(`/dashboard/financial/cards/${cardId}/invoices/${um.year}/${um.month}`)}
                                        >
                                            <p className="text-xs text-slate-400 mb-1">Total da fatura</p>
                                            <div className="flex justify-between items-end">
                                                <p className={`text-2xl font-bold ${totalValue > 0 ? 'text-white' : 'text-slate-500'}`}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                                                </p>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status === 'open' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                    {status === 'open' ? 'Aberta' : 'Fechada'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Pagination Future */}
                        {totalFuturePages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <button 
                                    disabled={futurePage === 0}
                                    onClick={() => setFuturePage(f => f - 1)}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
                                >
                                    Anterior
                                </button>
                                <span className="text-slate-400 text-sm">Página {futurePage + 1} de {totalFuturePages}</span>
                                <button 
                                    disabled={futurePage >= totalFuturePages - 1}
                                    onClick={() => setFuturePage(f => f + 1)}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === "history" && (
                    <div className="space-y-6">
                        {paginatedHistory.length === 0 ? (
                            <div className="bg-slate-800/30 border border-white/5 p-12 text-center rounded-3xl">
                                <p className="text-slate-400">Nenhuma fatura no histórico ainda.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                {paginatedHistory.map((invoice) => {
                                    const monthKey = `${invoice.year}-${invoice.month}`;
                                    
                                    return (
                                        <div 
                                            key={monthKey} 
                                            className="bg-slate-800/80 border border-white/5 rounded-2xl p-5 hover:bg-slate-750 cursor-pointer transition-all duration-300 group hover:-translate-y-1"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div onClick={() => router.push(`/dashboard/financial/cards/${cardId}/invoices/${invoice.year}/${invoice.month}`)}>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{invoice.year}</p>
                                                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{fullMonthNames[invoice.month]}</h3>
                                                </div>
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setOpenMenuKey(openMenuKey === monthKey ? null : monthKey); }}
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-700 transition-colors"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    {openMenuKey === monthKey && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 py-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setEditingInvoice(invoice); setEditInvoiceDueDate(new Date(invoice.dueDate).toISOString().split('T')[0]); setEditInvoiceStatus(invoice.status); setOpenMenuKey(null); }}
                                                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                                            >
                                                                <Edit size={14} /> Editar
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id); setOpenMenuKey(null); }}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                                                            >
                                                                <Trash2 size={14} /> Excluir
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div 
                                                className="mt-6 flex flex-col justify-end"
                                                onClick={() => router.push(`/dashboard/financial/cards/${cardId}/invoices/${invoice.year}/${invoice.month}`)}
                                            >
                                                <p className="text-xs text-slate-400 mb-1">Total fechado</p>
                                                <div className="flex justify-between items-end">
                                                    <p className={`text-2xl font-bold text-white`}>
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.totalValue)}
                                                    </p>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${invoice.status === 'open' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                        {invoice.status === 'open' ? 'Aberta' : 'Fechada'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination History */}
                        {totalHistoryPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <button 
                                    disabled={historyPage === 0}
                                    onClick={() => setHistoryPage(h => h - 1)}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
                                >
                                    Anterior
                                </button>
                                <span className="text-slate-400 text-sm">Página {historyPage + 1} de {totalHistoryPages}</span>
                                <button 
                                    disabled={historyPage >= totalHistoryPages - 1}
                                    onClick={() => setHistoryPage(h => h + 1)}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Editar Cartão */}
            <AnimatePresence>
                {isEditCardModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <h2 className="text-xl font-semibold text-white">Editar Cartão</h2>
                                <button onClick={() => setIsEditCardModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUpdateCard} className="p-6 space-y-4">
                                <div><label className="block text-sm text-slate-300 mb-1">Nome do Cartão</label><input type="text" required value={editCardName} onChange={e => setEditCardName(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm text-slate-300 mb-1">Bandeira</label><select value={editCardBrand} onChange={e => setEditCardBrand(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"><option value="Mastercard">Mastercard</option><option value="Visa">Visa</option><option value="Elo">Elo</option><option value="Amex">Amex</option></select></div>
                                    <div><label className="block text-sm text-slate-300 mb-1">Cor</label><select value={editCardColor} onChange={e => setEditCardColor(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"><option value="purple">Roxo</option><option value="orange">Laranja</option><option value="blue">Azul</option><option value="black">Preto</option><option value="green">Verde</option></select></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm text-slate-300 mb-1">Fechamento</label><input type="number" min="1" max="31" required value={editCardClosingDay} onChange={e => setEditCardClosingDay(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" /></div>
                                    <div><label className="block text-sm text-slate-300 mb-1">Vencimento</label><input type="number" min="1" max="31" required value={editCardDueDay} onChange={e => setEditCardDueDay(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" /></div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsEditCardModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700">Cancelar</button>
                                    <button type="submit" disabled={isEditingCard} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500">{isEditingCard ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar"}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Nova Fatura Manual */}
            <AnimatePresence>
                {isNewInvoiceModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <h2 className="text-xl font-semibold text-white">Nova Fatura Manual</h2>
                                <button onClick={() => setIsNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Mês</label>
                                        <select value={newInvoiceMonth} onChange={e => setNewInvoiceMonth(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none">
                                            {monthNames.map((m, i) => <option key={i} value={i}>{fullMonthNames[i]}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Ano</label>
                                        <input type="number" required min={currentYear} max={2050} value={newInvoiceYear} onChange={e => setNewInvoiceYear(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsNewInvoiceModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700">Cancelar</button>
                                    <button type="submit" disabled={isCreatingInvoice} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500">{isCreatingInvoice ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Criar Fatura"}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Editar Fatura */}
            <AnimatePresence>
                {editingInvoice && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <h2 className="text-xl font-semibold text-white">Editar Fatura</h2>
                                <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUpdateInvoice} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">Data de Vencimento</label>
                                    <input type="date" required value={editInvoiceDueDate} onChange={e => setEditInvoiceDueDate(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">Status</label>
                                    <select value={editInvoiceStatus} onChange={e => setEditInvoiceStatus(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none">
                                        <option value="open">Aberta</option>
                                        <option value="closed">Fechada</option>
                                        <option value="paid">Paga</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setEditingInvoice(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700">Cancelar</button>
                                    <button type="submit" disabled={isUpdatingInvoice} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500">{isUpdatingInvoice ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar Alterações"}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
