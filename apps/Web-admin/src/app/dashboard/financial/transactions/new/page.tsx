"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { bankAccountsService, BankAccount } from "@/services/bank-accounts.service";
import { costCentersService, CostCenter } from "@/services/cost-centers.service";
import { categoriesService, TransactionCategory } from "@/services/categories.service";
import { transactionTypesService, TransactionType } from "@/services/transaction-types.service";
import { paymentMethodsService, PaymentMethod } from "@/services/payment-methods.service";

// Removed static categoriesByType

function NewTransactionForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [typeGroup, setTypeGroup] = useState("Recebimentos");
    const [category, setCategory] = useState("");
    const [client, setClient] = useState("");
    const [clientsList, setClientsList] = useState<{id: string, name: string}[]>([]);
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
    const [dueDateManuallyChanged, setDueDateManuallyChanged] = useState(false);

    // Keep dueDate in sync with date until the user manually edits the due date
    useEffect(() => {
        if (!dueDateManuallyChanged) {
            setDueDate(date);
        }
    }, [date, dueDateManuallyChanged]);

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
        const typeGroupFromUrl = searchParams.get("typeGroup");
        if (typeGroupFromUrl) {
            setTypeGroup(typeGroupFromUrl);
        }

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
                    const aIsIncome = a.nature === 'income' || a.name.toLowerCase().includes('recebimento') || a.name.toLowerCase().includes('receita');
                    const bIsIncome = b.nature === 'income' || b.name.toLowerCase().includes('recebimento') || b.name.toLowerCase().includes('receita');
                    if (aIsIncome && !bIsIncome) return -1;
                    if (!aIsIncome && bIsIncome) return 1;
                    return a.name.localeCompare(b.name);
                });
                setTransactionTypes(active);
                const typeGroupFromUrl = searchParams.get("typeGroup");
                if (active.length > 0 && !active.find(t => t.name === typeGroup)) {
                    // Prefer the type requested in the URL if it exists and is active
                    if (typeGroupFromUrl && active.find(t => t.name === typeGroupFromUrl)) {
                        setTypeGroup(typeGroupFromUrl);
                    } else {
                        setTypeGroup(active[0].name);
                    }
                }
            }
        });

        paymentMethodsService.list().then(res => {
            if (res.success && res.data) {
                const active = res.data.filter(p => p.active);
                setPaymentMethods(active);
                if (active.length > 0 && !active.find(p => p.name === paymentMethod)) {
                    setPaymentMethod(active[0].name);
                }
            }
        });
    }, []);

    // Advanced features toggles
    const [isInstallmentActive, setIsInstallmentActive] = useState(false);
    const [installmentsCount, setInstallmentsCount] = useState("12");
    const [installmentInterval, setInstallmentInterval] = useState("Mensal");
    
    const [isRecurrenceActive, setIsRecurrenceActive] = useState(false);
    const [recurrenceFreq, setRecurrenceFreq] = useState("Mensal");
    const [recurrenceMonths, setRecurrenceMonths] = useState("12");

    // Attachments mock
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

        setIsLoading(true);

        try {
            const payload = {
                description,
                client,
                value: parseFloat(value),
                typeGroup,
                category,
                date,
                dueDate,
                status,
                account,
                paymentMethod,
                costCenter,
                notes: notes || undefined,
                isInstallment: isInstallmentActive,
                installmentsCount: isInstallmentActive ? parseInt(installmentsCount, 10) : 1,
                installmentInterval: isInstallmentActive ? installmentInterval : undefined,
                isRecurrence: isRecurrenceActive,
                recurrenceFreq: isRecurrenceActive ? recurrenceFreq : undefined,
                recurrenceMonths: isRecurrenceActive ? parseInt(recurrenceMonths, 10) || 12 : undefined,
            };

            const response = await api<{ id: string }>("/api/financial/transactions", {
                method: "POST",
                body: payload,
            });

            if (!response.success || !response.data) {
                toast.error("Erro ao salvar", response.message || "Erro desconhecido ao cadastrar transação.");
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

            toast.success("Sucesso", "Transação registrada com sucesso!");
            router.push("/dashboard/financial/transactions");
        } catch (error: any) {
            console.error("[NEW_TRANSACTION_ERROR]", error);
            toast.error("Erro de operação", error.message || "Não foi possível concluir o registro da transação.");
        } finally {
            setIsLoading(false);
        }
    };

    // Remove hardcoded transactionTypes

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
                    <span className="text-blue-400 text-sm font-medium">Nova Transação</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <DollarSign size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Nova Transação</h1>
                            <p className="text-sm text-slate-400">Cadastre um fluxo de caixa detalhado para a contabilidade</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
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
                                onChange={(e) => {
                                    setDueDateManuallyChanged(true);
                                    setDueDate(e.target.value);
                                }}
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
                                {paymentMethods.length === 0 ? (
                                    <option value="PIX">PIX</option>
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

                {/* 3. Opções Avançadas: Parcelamento e Recorrência */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {/* Parcelamento Card */}
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="toggle-installment"
                                    checked={isInstallmentActive}
                                    onChange={(e) => {
                                        setIsInstallmentActive(e.target.checked);
                                        if (e.target.checked) setIsRecurrenceActive(false); // Mutually exclusive
                                    }}
                                    className="rounded border-slate-700 bg-slate-800/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900 w-4 h-4 cursor-pointer"
                                />
                                <label htmlFor="toggle-installment" className="text-sm font-semibold text-white cursor-pointer select-none">Habilitar Parcelamento</label>
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Desdobrar Lançamentos</span>
                        </div>

                        <AnimatePresence mode="wait">
                            {isInstallmentActive ? (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Qtde. parcelas</label>
                                            <input
                                                type="number"
                                                value={installmentsCount}
                                                onChange={(e) => setInstallmentsCount(e.target.value)}
                                                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Frequência</label>
                                            <select
                                                value={installmentInterval}
                                                onChange={(e) => setInstallmentInterval(e.target.value)}
                                                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="Semanal">Semanal</option>
                                                <option value="Quinzenal">Quinzenal</option>
                                                <option value="Mensal">Mensal</option>
                                                <option value="Bimestral">Bimestral</option>
                                                <option value="Trimestral">Trimestral</option>
                                                <option value="Semestral">Semestral</option>
                                                <option value="Anual">Anual</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[11px] text-blue-400">
                                        <Info size={16} className="shrink-0 mt-0.5" />
                                        <p>Ao salvar, o sistema criará <strong>{installmentsCount} lançamentos consecutivos</strong> de forma automatizada com vencimentos em cascata a partir da data informada.</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <p className="text-xs text-slate-500 leading-relaxed py-2">Use o parcelamento para dividir o valor total em múltiplos lançamentos que vencem sequencialmente ao longo do tempo.</p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Recorrência Card */}
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="toggle-recurrence"
                                    checked={isRecurrenceActive}
                                    onChange={(e) => {
                                        setIsRecurrenceActive(e.target.checked);
                                        if (e.target.checked) setIsInstallmentActive(false); // Mutually exclusive
                                    }}
                                    className="rounded border-slate-700 bg-slate-800/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900 w-4 h-4 cursor-pointer"
                                />
                                <label htmlFor="toggle-recurrence" className="text-sm font-semibold text-white cursor-pointer select-none">Habilitar Recorrência</label>
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Lançamentos Periódicos</span>
                        </div>

                        <AnimatePresence mode="wait">
                            {isRecurrenceActive ? (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Frequência</label>
                                            <select
                                                value={recurrenceFreq}
                                                onChange={(e) => setRecurrenceFreq(e.target.value)}
                                                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="Semanal">Semanal</option>
                                                <option value="Mensal">Mensal</option>
                                                <option value="Bimestral">Bimestral</option>
                                                <option value="Trimestral">Trimestral</option>
                                                <option value="Semestral">Semestral</option>
                                                <option value="Anual">Anual</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Quantidade de meses</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={24}
                                                value={recurrenceMonths}
                                                onChange={(e) => setRecurrenceMonths(e.target.value)}
                                                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-400">
                                        <Info size={16} className="shrink-0 mt-0.5" />
                                        <p>Lançamentos recorrentes são ideais para contratos de SaaS, aluguel, pro-labore ou assinaturas mensais recorrentes.</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <p className="text-xs text-slate-500 leading-relaxed py-2">Ative a recorrência para repetir este lançamento pela quantidade de meses definida (mensalidades, contratos fixos).</p>
                            )}
                        </AnimatePresence>
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

export default function NewTransactionPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <NewTransactionForm />
        </Suspense>
    );
}
