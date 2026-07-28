"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft,
    DollarSign,
    Save,
    Calendar,
    Paperclip,
    AlertCircle,
    Briefcase,
    Tag,
    Users,
    Check,
    HelpCircle,
    Info,
    Trash2,
    Plus,
    X,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { bankAccountsService, BankAccount } from "@/services/bank-accounts.service";
import { costCentersService, CostCenter } from "@/services/cost-centers.service";
import { categoriesService, TransactionCategory } from "@/services/categories.service";
import { transactionTypesService, TransactionType } from "@/services/transaction-types.service";
import { paymentMethodsService, PaymentMethod } from "@/services/payment-methods.service";

// Removed static categoriesByType

export default function EditTransactionPage() {
    const router = useRouter();
    const params = useParams() as { id: string };
    const { toast, confirm } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Form states
    const [typeGroup, setTypeGroup] = useState("Recebimentos");
    const [category, setCategory] = useState("");
    const [client, setClient] = useState("");
    const [clientsList, setClientsList] = useState<{id: string, name: string}[]>([]);
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
    const [status, setStatus] = useState("Previsto");
    const [description, setDescription] = useState("");
    const [value, setValue] = useState("");
    const [account, setAccount] = useState("Conta Principal");
    const [paymentMethod, setPaymentMethod] = useState("PIX");
    const [costCenter, setCostCenter] = useState("Comercial");
    const [notes, setNotes] = useState("");
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [allCategories, setAllCategories] = useState<TransactionCategory[]>([]);
    const [availableCategories, setAvailableCategories] = useState<TransactionCategory[]>([]);
    const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    useEffect(() => {
        const filtered = allCategories.filter(c => c.typeGroup === typeGroup && c.active);
        setAvailableCategories(filtered);
        if (filtered.length > 0 && !filtered.find(c => c.name === category)) {
            setCategory(filtered[0].name);
        } else if (filtered.length === 0) {
            setCategory("");
        }
    }, [typeGroup, allCategories]);

    useEffect(() => {
        api<{id: string, name: string}[]>("/api/clients").then(res => {
            if (res.success && res.data) {
                setClientsList(res.data);
            }
        });

        bankAccountsService.list().then(res => {
            if (res.success && res.data) {
                setBankAccounts(res.data);
            }
        });

        costCentersService.list().then(res => {
            if (res.success && res.data) {
                setCostCenters(res.data.filter(c => c.active));
            }
        });

        categoriesService.list().then(res => {
            if (res.success && res.data) {
                setAllCategories(res.data);
            }
        });

        transactionTypesService.list().then(res => {
            if (res.success && res.data) {
                const active = res.data.filter(t => t.active);
                // Sort to put income first, then expense
                active.sort((a, b) => {
                    if (a.nature === 'income' && b.nature !== 'income') return -1;
                    if (a.nature !== 'income' && b.nature === 'income') return 1;
                    return a.name.localeCompare(b.name);
                });
                setTransactionTypes(active);
            }
        });

        paymentMethodsService.list().then(res => {
            if (res.success && res.data) {
                setPaymentMethods(res.data.filter(p => p.active));
            }
        });
        
        // Fetch transaction data
        if (params.id) {
            api<any>(`/api/financial/transactions/${params.id}`).then(res => {
                if (res.success && res.data) {
                    const tx = res.data;
                    setTransaction(tx);
                    setTypeGroup(tx.typeGroup);
                    setCategory(tx.category);
                    setClient(tx.client);
                    setValue(tx.value.toString());
                    setOriginalValue(parseFloat(tx.value));
                    setDescription(tx.description);
                    setStatus(tx.status);
                    setAccount(tx.account);
                    setPaymentMethod(tx.paymentMethod);
                    setCostCenter(tx.costCenter);
                    setNotes(tx.notes || "");

                    if (tx.date) setDate(new Date(tx.date).toISOString().split("T")[0]);
                    if (tx.dueDate) setDueDate(new Date(tx.dueDate).toISOString().split("T")[0]);
                } else {
                    toast.error("Erro", "Transação não encontrada.");
                    router.push("/dashboard/financial/transactions");
                }
            }).finally(() => {
                setIsFetching(false);
            });
        }
    }, [params.id, router, toast]);

    // No recurrence toggles for edit mode.

    // Attachments mock
    const [transaction, setTransaction] = useState<any>(null);
    const [originalValue, setOriginalValue] = useState<number | null>(null);
    const [editScope, setEditScope] = useState<"this" | "future" | "all">("this");
    const [isEditScopeModalOpen, setIsEditScopeModalOpen] = useState(false);
    const [isScopeConfirmed, setIsScopeConfirmed] = useState(false);
    const [deleteScope, setDeleteScope] = useState<"this" | "future" | "all">("this");
    const [isDeleteScopeModalOpen, setIsDeleteScopeModalOpen] = useState(false);

    const [attachments, setAttachments] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments([...attachments, ...Array.from(e.target.files)]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim() || !value || !client.trim()) {
            toast.error("Campos obrigatórios", "Preencha todos os campos obrigatórios (Descrição, Contato e Valor).");
            return;
        }

        const newValue = parseFloat(value);

        if (transaction?.parentId && !isScopeConfirmed) {
            setIsEditScopeModalOpen(true);
            return;
        }

        setIsLoading(true);

        try {
            const payload: any = {
                description,
                client,
                value: newValue,
                typeGroup,
                category,
                date,
                dueDate,
                status,
                account,
                paymentMethod,
                costCenter,
                notes: notes || undefined,
                scope: transaction?.parentId ? editScope : undefined,
            };

            const response = await api<{ id: string }>(`/api/financial/transactions/${params.id}`, {
                method: "PUT",
                body: payload,
            });

            if (!response.success || !response.data) {
                toast.error("Erro ao salvar", response.message || "Erro desconhecido ao atualizar transação.");
                setIsLoading(false);
                return;
            }

            const transactionId = response.data.id;

            // Sequential Upload of Attachments if any exist
            if (attachments.length > 0) {
                const token = localStorage.getItem("accessToken");
                const uploadHeaders: Record<string, string> = {};
                if (token) {
                    uploadHeaders["Authorization"] = `Bearer ${token}`;
                }
                
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
                
                for (const file of attachments) {
                    const formData = new FormData();
                    formData.append("file", file);
                    
                    const uploadRes = await fetch(`${API_BASE_URL}/api/financial/transactions/${transactionId}/attachments`, {
                        method: "POST",
                        headers: uploadHeaders,
                        body: formData,
                    });
                    
                    if (!uploadRes.ok) {
                        const errData = await uploadRes.json().catch(() => ({}));
                        throw new Error(errData.message || `Falha ao enviar arquivo ${file.name}`);
                    }
                }
            }

            toast.success("Sucesso", "Transação atualizada com sucesso!");
            router.push("/dashboard/financial/transactions");
        } catch (error: any) {
            console.error("[NEW_TRANSACTION_ERROR]", error);
            toast.error("Erro de operação", error.message || "Não foi possível concluir o registro da transação.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (transaction?.parentId) {
            setDeleteScope("this");
            setIsDeleteScopeModalOpen(true);
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
        await executeDelete("this");
    };

    const executeDelete = async (scope: "this" | "future" | "all") => {
        try {
            const query = scope !== "this" ? `?scope=${scope}` : "";
            const response = await api(`/api/financial/transactions/${params.id}${query}`, {
                method: "DELETE",
            });
            if (response.success) {
                toast.success("Sucesso", scope === "all" ? "Transações excluídas com sucesso." : scope === "future" ? "Transação e futuras excluídas com sucesso." : "Transação excluída com sucesso.");
                router.push("/dashboard/financial/transactions");
            } else {
                toast.error("Erro ao excluir", response.message || "Erro desconhecido.");
            }
        } catch (error) {
            toast.error("Erro de conexão", "Falha ao excluir a transação.");
        }
    };

    // Remove hardcoded transactionTypes

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto pb-32 animate-in fade-in duration-500">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
            >
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/financial/transactions" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} />
                        <span>Financeiro</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <Link href="/dashboard/financial/transactions" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        Transações
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-blue-400 text-sm font-medium">Editar Transação</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <DollarSign size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Editar Transação</h1>
                            <p className="text-sm text-slate-400">Altere os detalhes deste fluxo de caixa</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Identificação Geral */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="relative z-50 bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 md:p-8 space-y-6"
                >
                    <div className="flex items-start gap-3 border-b border-white/[0.04] pb-4">
                        <Tag className="text-blue-500 mt-1" size={18} />
                        <div>
                            <h2 className="text-md font-semibold text-white">1. Identificação Geral</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Determine a categoria, contato e valor principal do lançamento.</p>
                        </div>
                    </div>

                    {/* Tipo de Lançamento */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Tipo de Lançamento *</label>
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                            {transactionTypes.length === 0 ? (
                                <span className="text-sm text-slate-500">Nenhum tipo cadastrado</span>
                            ) : (
                                transactionTypes.map((type) => {
                                    const isActive = typeGroup === type.name;
                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setTypeGroup(type.name)}
                                            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 text-center ${
                                                isActive 
                                                ? (type.nature === 'income' ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]")
                                                : "bg-slate-800/30 text-slate-400 border-white/[0.04] hover:bg-slate-800/60 hover:text-white"
                                            }`}
                                        >
                                            {type.name}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Categoria */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Categoria *</label>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            >
                                {availableCategories.length === 0 ? (
                                    <option value="">Nenhuma categoria</option>
                                ) : (
                                    availableCategories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Contato */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Contato (Cliente/Fornecedor) *</label>
                            <div className="relative">
                                <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={client}
                                    onChange={(e) => {
                                        setClient(e.target.value);
                                        setShowClientSuggestions(true);
                                    }}
                                    onFocus={() => setShowClientSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                                    placeholder="Ex: Amazon Web Services, JP Corp"
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                />
                                <AnimatePresence>
                                    {showClientSuggestions && clientsList.filter(c => c.name.toLowerCase().includes(client.toLowerCase())).length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto overflow-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                                        >
                                            {clientsList.filter(c => c.name.toLowerCase().includes(client.toLowerCase())).map(c => (
                                                <div 
                                                    key={c.id} 
                                                    onClick={() => {
                                                        setClient(c.name);
                                                        setShowClientSuggestions(false);
                                                    }}
                                                    className="px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white cursor-pointer transition-colors border-b border-white/[0.02] last:border-0"
                                                >
                                                    {c.name}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Valor */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Valor (R$) *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Descrição da Transação *</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Pagamento mensal de infraestrutura Cloud AWS"
                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                </motion.div>

                {/* 2. Detalhes Financeiros */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 md:p-8 space-y-6"
                >
                    <div className="flex items-start gap-3 border-b border-white/[0.04] pb-4">
                        <Calendar className="text-blue-500 mt-1" size={18} />
                        <div>
                            <h2 className="text-md font-semibold text-white">2. Detalhes de Liquidação</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Defina datas de vencimento, conta contábil e status da transação.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Data Emissão */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Data de Emissão</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        {/* Data Vencimento */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Data de Vencimento</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Status Inicial</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStatus("Previsto")}
                                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 text-center ${
                                        status === "Previsto"
                                        ? "bg-slate-700 text-white border-slate-600"
                                        : "bg-slate-800/30 text-slate-500 border-white/[0.04] hover:bg-slate-800/60"
                                    }`}
                                >
                                    Previsto (Pendente)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus("Pago")}
                                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 text-center ${
                                        status === "Pago"
                                        ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                                        : "bg-slate-800/30 text-slate-500 border-white/[0.04] hover:bg-slate-800/60"
                                    }`}
                                >
                                    Pago (Liquidado)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Conta */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Conta Contábil</label>
                            <select 
                                value={account} 
                                onChange={(e) => setAccount(e.target.value)}
                                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            >
                                {bankAccounts.length === 0 ? (
                                    <option value="Conta Principal">Conta Principal</option>
                                ) : (
                                    bankAccounts.map(ba => (
                                        <option key={ba.id} value={ba.name}>{ba.name}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Forma de Pagamento */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Forma de Pagamento</label>
                            <select 
                                value={paymentMethod} 
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            >
                                {paymentMethods.length === 0 && paymentMethod ? (
                                    <option value={paymentMethod}>{paymentMethod}</option>
                                ) : (
                                    paymentMethods.map(pm => (
                                        <option key={pm.id} value={pm.name}>{pm.name}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Centro de Custos */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Centro de Custo</label>
                            <select 
                                value={costCenter} 
                                onChange={(e) => setCostCenter(e.target.value)}
                                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            >
                                {costCenters.length === 0 ? (
                                    <option value="Comercial">Comercial</option>
                                ) : (
                                    costCenters.map(cc => (
                                        <option key={cc.id} value={cc.name}>{cc.name}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                </motion.div>



                {/* 4. Anexos e Observações */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 md:p-8 space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Observações */}
                        <div className="md:col-span-7 space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Observações e Histórico</label>
                            <textarea
                                rows={5}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Condições especiais de faturamento, dados bancários complementares ou histórico geral do contrato..."
                                className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                            />
                        </div>

                        {/* Anexos */}
                        <div className="md:col-span-5 space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Documentos Anexados</label>
                            
                            <div className="relative border border-dashed border-white/[0.08] hover:border-blue-500/30 rounded-xl p-4 text-center cursor-pointer transition-all bg-slate-850/20 group">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <Paperclip className="mx-auto text-slate-500 group-hover:text-blue-400 transition-colors mb-2" size={24} />
                                <p className="text-xs font-semibold text-slate-300">Selecione ou arraste arquivos</p>
                                <p className="text-[10px] text-slate-500 mt-1">Notas fiscais, boletos, comprovantes (Max 15MB)</p>
                            </div>

                            {/* Files preview list */}
                            {attachments.length > 0 && (
                                <div className="mt-3 space-y-1.5 max-h-24 overflow-y-auto">
                                    {attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-white/[0.04] text-xs">
                                            <span className="text-slate-300 truncate pr-4">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(idx)}
                                                className="text-slate-500 hover:text-red-400 p-0.5 transition-colors"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Edit Scope Modal */}
                {isEditScopeModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                                <div>
                                    <h3 className="font-bold text-xl text-white">Alterar {transaction?.installment ? "parcelamento" : "recorrência"}</h3>
                                    <p className="text-sm text-slate-400 mt-1">Esta transação faz parte de um {transaction?.installment ? "parcelamento" : "grupo recorrente"}. Escolha o alcance da alteração.</p>
                                </div>
                                <button onClick={() => setIsEditScopeModalOpen(false)} title="Fechar" aria-label="Fechar" className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-3">
                                {[
                                    { value: "this", label: "Alterar somente esta transação", desc: "Apenas a parcela selecionada será atualizada." },
                                    { value: "future", label: "Alterar esta e as futuras transações", desc: "A partir desta parcela em diante será atualizado." },
                                    { value: "all", label: "Alterar essa e todas as transações", desc: "Todas as parcelas vinculadas serão atualizadas." },
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                                            editScope === option.value
                                                ? "bg-blue-500/10 border-blue-500/40"
                                                : "bg-slate-800/50 border-white/[0.04] hover:bg-slate-800"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="edit-scope"
                                            value={option.value}
                                            checked={editScope === option.value}
                                            onChange={(e) => setEditScope(e.target.value as "this" | "future" | "all")}
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
                                    onClick={() => setIsEditScopeModalOpen(false)}
                                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setIsScopeConfirmed(true);
                                        setIsEditScopeModalOpen(false);
                                        // Programmatically re-submit the form after React state update
                                        setTimeout(() => {
                                            const form = document.getElementById("edit-transaction-form") as HTMLFormElement | null;
                                            form?.requestSubmit();
                                        }, 100);
                                    }}
                                    className="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Scope Modal */}
                {isDeleteScopeModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                                <div>
                                    <h3 className="font-bold text-xl text-white">Excluir {transaction?.installment ? "parcelamento" : "recorrência"}</h3>
                                    <p className="text-sm text-slate-400 mt-1">Escolha o alcance da exclusão.</p>
                                </div>
                                <button onClick={() => setIsDeleteScopeModalOpen(false)} title="Fechar" aria-label="Fechar" className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-3">
                                {[
                                    { value: "this", label: "Apagar somente esta transação", desc: "Remove apenas a parcela selecionada." },
                                    { value: "future", label: "Apagar esta e as futuras transações", desc: "Remove a partir desta parcela em diante." },
                                    { value: "all", label: "Apagar essa e todas as transações", desc: "Remove todas as parcelas vinculadas." },
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                                            deleteScope === option.value
                                                ? "bg-red-500/10 border-red-500/40"
                                                : "bg-slate-800/50 border-white/[0.04] hover:bg-slate-800"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="delete-scope"
                                            value={option.value}
                                            checked={deleteScope === option.value}
                                            onChange={(e) => setDeleteScope(e.target.value as "this" | "future" | "all")}
                                            className="mt-1 rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500/50"
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
                                    onClick={() => setIsDeleteScopeModalOpen(false)}
                                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setIsDeleteScopeModalOpen(false);
                                        executeDelete(deleteScope);
                                    }}
                                    className="px-6 py-2.5 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-colors"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="flex justify-end items-center gap-4 pt-4"
                >
                    <Link
                        href="/dashboard/financial/transactions"
                        className="px-6 py-3 rounded-xl border border-white/[0.08] bg-slate-800/20 text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-white/[0.12] transition-all text-sm font-semibold"
                    >
                        Cancelar Lançamento
                    </Link>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 hover:border-red-500/40 text-red-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all duration-300"
                    >
                        <Trash2 size={16} />
                        Excluir
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isLoading ? "Processando..." : "Salvar Transação"}
                    </button>
                </motion.div>

            </form>
        </div>
    );
}
