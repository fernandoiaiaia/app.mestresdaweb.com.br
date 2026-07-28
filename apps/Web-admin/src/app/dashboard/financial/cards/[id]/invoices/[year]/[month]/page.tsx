"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Plus, Loader2, CreditCard as CardIcon, Trash2, Calendar, DollarSign, Lock, X, Edit, Pencil } from "lucide-react";
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

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const getSafeDateForInvoice = (year: number, month: number, closingDay: number) => {
    let targetYear = year;
    let targetMonth = month;
    let targetDay = 1;
    if (closingDay === 1) {
        targetMonth -= 1;
        targetDay = 15;
        if (targetMonth < 0) {
            targetMonth = 11;
            targetYear -= 1;
        }
    } else {
        targetDay = closingDay - 1;
    }
    const d = new Date(Date.UTC(targetYear, targetMonth, targetDay, 12, 0, 0));
    return d.toISOString().split('T')[0];
};

export default function InvoiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const cardId = params.id as string;
    const yearParam = parseInt(params.year as string);
    const monthParam = parseInt(params.month as string); // 0-indexed

    const [card, setCard] = useState<CreditCard | null>(null);
    const [loading, setLoading] = useState(true);

    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isClosingInvoice, setIsClosingInvoice] = useState(false);

    // Form fields
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Software / SaaS");
    const [value, setValue] = useState("");
    const [installments, setInstallments] = useState("1");
    const [isAddingExpense, setIsAddingExpense] = useState(false);

    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editDescription, setEditDescription] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editValue, setEditValue] = useState("");
    const [isUpdatingExpense, setIsUpdatingExpense] = useState(false);

    const loadCard = async () => {
        try {
            setLoading(true);
            const res = await api<CreditCard>(`/api/financial/cards/${cardId}`);
            if (res && res.success && res.data) {
                setCard(res.data);
                if (!date) setDate(getSafeDateForInvoice(yearParam, monthParam, res.data.closingDay));
            }
        } catch (error) {
            toast.error("Erro ao carregar detalhes da fatura");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCard();
    }, [cardId, yearParam, monthParam]);

    const openEditExpenseModal = (expense: Expense) => {
        setEditingExpense(expense);
        setEditDescription(expense.description);
        setEditCategory(expense.category);
        setEditValue(expense.value.toString().replace('.', ','));
    };

    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingExpense) return;
        try {
            setIsUpdatingExpense(true);
            const parsedValue = parseFloat(editValue.replace(/\./g, '').replace(',', '.'));
            
            const res = await api(`/api/financial/cards/${cardId}/expenses/${editingExpense.id}`, {
                method: "PUT",
                body: {
                    description: editDescription,
                    category: editCategory,
                    value: parsedValue
                }
            });

            if (res.success) {
                toast.success("Despesa atualizada com sucesso!");
                setEditingExpense(null);
                loadCard();
            } else {
                toast.error("Erro ao atualizar despesa");
            }
        } catch {
            toast.error("Erro interno ao atualizar despesa");
        } finally {
            setIsUpdatingExpense(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsAddingExpense(true);
            const parsedValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
            
            const res = await api(`/api/financial/cards/${cardId}/expenses`, {
                method: "POST",
                body: {
                    date: new Date(date).toISOString(),
                    description,
                    category,
                    value: parsedValue,
                    installments: parseInt(installments)
                }
            });

            if (res.success) {
                toast.success("Despesa adicionada com sucesso!");
                setIsExpenseModalOpen(false);
                loadCard();
                setDescription("");
                setValue("");
                setInstallments("1");
            } else {
                toast.error("Erro ao adicionar despesa");
            }
        } catch (error) {
            toast.error("Erro interno ao adicionar despesa");
        } finally {
            setIsAddingExpense(false);
        }
    };

    const handleCloseInvoice = async (invoiceId: string) => {
        if (!confirm("Tem certeza que deseja fechar esta fatura? O valor total será enviado para o fluxo de caixa principal.")) return;

        try {
            setIsClosingInvoice(true);
            const res = await api(`/api/financial/cards/${cardId}/invoices/${invoiceId}/close`, {
                method: "POST",
                body: { account: "Conta Principal" }
            });

            if (res.success) {
                toast.success("Fatura fechada com sucesso!");
                loadCard();
            } else {
                toast.error(res.error?.message || "Erro ao fechar fatura");
            }
        } catch (error) {
            toast.error("Erro interno ao fechar fatura");
        } finally {
            setIsClosingInvoice(false);
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm("Deseja realmente remover esta despesa?")) return;
        
        try {
            const res = await api(`/api/financial/cards/${cardId}/expenses/${expenseId}`, {
                method: "DELETE"
            });
            if (res.success) {
                toast.success("Despesa removida.");
                loadCard();
            }
        } catch {
            toast.error("Erro ao remover despesa");
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>;
    }

    if (!card) {
        return <div className="p-8 text-center text-white">Cartão não encontrado.</div>;
    }

    const currentInvoice = card.invoices.find(inv => inv.year === yearParam && inv.month === monthParam);
    const totalValue = currentInvoice ? currentInvoice.totalValue : 0;
    const status = currentInvoice ? currentInvoice.status : 'open';
    const expenses = currentInvoice ? currentInvoice.expenses : [];

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/financial/cards/${cardId}`} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            Fatura de {monthNames[monthParam]} {yearParam}
                        </h1>
                        <p className="text-sm text-slate-400">Cartão {card.name} ({card.brand})</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-400 mb-1">Total da Fatura</p>
                    <p className="text-3xl font-bold text-blue-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                    </p>
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${status === 'open' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {status === 'open' ? 'Aberta' : 'Fechada'}
                    </span>
                    {status === 'open' && (
                        <p className="text-sm text-slate-400 hidden md:block">
                            O fechamento ocorre no dia {card.closingDay}.
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> Adicionar Gasto
                    </button>
                    {currentInvoice && status === 'open' && totalValue > 0 && (
                        <button
                            onClick={() => handleCloseInvoice(currentInvoice.id)}
                            disabled={isClosingInvoice}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isClosingInvoice ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                            Fechar Fatura
                        </button>
                    )}
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-slate-800/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                {expenses.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-600">
                            <DollarSign size={24} className="text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">Nenhum gasto lançado</h3>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto">Esta fatura ainda está vazia. Clique em "Adicionar Gasto" para começar a lançar suas despesas.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {expenses.map((expense) => (
                            <div key={expense.id} className="p-5 flex justify-between items-center group hover:bg-slate-800/80 transition-colors">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center border border-white/5">
                                        <DollarSign size={20} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-base font-medium text-white">{expense.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-400 font-medium">{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                                            <span className="text-xs text-slate-600">•</span>
                                            <span className="text-xs text-slate-400">{expense.category}</span>
                                            {expense.installment && (
                                                <>
                                                    <span className="text-xs text-slate-600">•</span>
                                                    <span className="text-[10px] bg-white/10 text-slate-300 font-bold px-2 py-0.5 rounded-md">Parc. {expense.installment}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-lg font-bold text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.value)}
                                    </span>
                                    {status === 'open' && (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => openEditExpenseModal(expense)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Despesa */}
            <AnimatePresence>
                {isExpenseModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <h2 className="text-xl font-semibold text-white">Lançar Despesa</h2>
                                <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Data da Compra</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Sugerimos a data exata para que a compra caia nesta fatura.</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Ex: Uber, iFood, AWS"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                                        <select 
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="Alimentação">Alimentação</option>
                                            <option value="Transporte">Transporte</option>
                                            <option value="Software / SaaS">Software / SaaS</option>
                                            <option value="Infraestrutura / Cloud">Infraestrutura</option>
                                            <option value="Materiais de Escritório">Materiais</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Valor Total (R$)</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Ex: 150,00"
                                            value={value}
                                            onChange={e => setValue(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Parcelas (Opcional)</label>
                                    <select 
                                        value={installments}
                                        onChange={e => setInstallments(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="1">1x (À vista)</option>
                                        <option value="2">2x</option>
                                        <option value="3">3x</option>
                                        <option value="4">4x</option>
                                        <option value="5">5x</option>
                                        <option value="6">6x</option>
                                        <option value="10">10x</option>
                                        <option value="12">12x</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsExpenseModalOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isAddingExpense}
                                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex justify-center items-center"
                                    >
                                        {isAddingExpense ? <Loader2 className="w-5 h-5 animate-spin" /> : "Adicionar"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Editar Despesa */}
            <AnimatePresence>
                {editingExpense && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <h2 className="text-xl font-semibold text-white">Editar Despesa</h2>
                                <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateExpense} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                                    <input type="text" required value={editDescription} onChange={e => setEditDescription(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                                        <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none">
                                            <option value="Alimentação">Alimentação</option>
                                            <option value="Transporte">Transporte</option>
                                            <option value="Software / SaaS">Software / SaaS</option>
                                            <option value="Infraestrutura / Cloud">Infraestrutura</option>
                                            <option value="Materiais de Escritório">Materiais</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Valor Total (R$)</label>
                                        <input type="text" required value={editValue} onChange={e => setEditValue(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
                                    </div>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-200/80 mt-2">
                                    Atenção: Edição permitida apenas para descrição e valor. Para mudar data ou parcelas, exclua o lançamento.
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setEditingExpense(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700">Cancelar</button>
                                    <button type="submit" disabled={isUpdatingExpense} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500">
                                        {isUpdatingExpense ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
