"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
    ChevronLeft, Settings, Wallet, Plus, 
    MoreVertical, Edit2, Trash2, X, CheckCircle2,
    Building2, CreditCard, Landmark, Coins, DollarSign,
    ArrowRight, Loader2
} from "lucide-react";
import { bankAccountsService, BankAccount, AccountType } from "@/services/bank-accounts.service";

const BANK_OPTIONS = ["Itaú", "Bradesco", "Banco do Brasil", "Caixa", "Santander", "Nubank", "Inter", "BTG Pactual", "XP Investimentos", "Outro"];
const COLOR_OPTIONS = [
    { value: "bg-orange-500", label: "Laranja (Itaú/Inter)" },
    { value: "bg-red-500", label: "Vermelho (Bradesco/Santander)" },
    { value: "bg-blue-600", label: "Azul (Caixa/BTG)" },
    { value: "bg-yellow-400", label: "Amarelo (BB)" },
    { value: "bg-purple-600", label: "Roxo (Nubank)" },
    { value: "bg-emerald-500", label: "Verde (Caixa Física)" },
    { value: "bg-slate-500", label: "Cinza (Outros)" },
];

export default function AccountsSettingsPage() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form state
    const [formData, setFormData] = useState<Partial<BankAccount>>({
        name: "", bank: "Itaú", agency: "", accountNumber: "", 
        type: "Corrente", initialBalance: 0, color: "bg-orange-500", isActive: true
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const res = await bankAccountsService.list();
            if (res.success && res.data) {
                setAccounts(res.data);
            }
        } catch (error) {
            console.error("Failed to load accounts", error);
            alert("Não foi possível carregar as contas.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case "Corrente": return Landmark;
            case "Poupança": return Coins;
            case "Investimento": return Building2;
            case "Caixa": return Wallet;
            default: return CreditCard;
        }
    };

    const handleOpenNew = () => {
        setEditingId(null);
        setFormData({
            name: "", bank: "Itaú", agency: "", accountNumber: "", 
            type: "Corrente", initialBalance: 0, color: "bg-orange-500", isActive: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (acc: BankAccount) => {
        setEditingId(acc.id);
        setFormData({ ...acc });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.")) {
            try {
                const res = await bankAccountsService.delete(id);
                if (res.success) {
                    setAccounts(accounts.filter(a => a.id !== id));
                } else {
                    alert(res.message || "Erro ao excluir a conta");
                }
            } catch (error) {
                console.error("Failed to delete account", error);
                alert("Erro ao excluir a conta");
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.bank) return alert("Preencha o nome e o banco!");
        
        setIsSaving(true);
        try {
            if (editingId) {
                const res = await bankAccountsService.update(editingId, formData);
                if (res.success && res.data) {
                    setAccounts(accounts.map(a => a.id === editingId ? res.data! : a));
                    setIsModalOpen(false);
                } else {
                    alert(res.message || "Erro ao atualizar a conta");
                }
            } else {
                const res = await bankAccountsService.create(formData);
                if (res.success && res.data) {
                    setAccounts([res.data, ...accounts]);
                    setIsModalOpen(false);
                } else {
                    alert(res.message || "Erro ao criar a conta");
                }
            }
        } catch (error) {
            console.error("Failed to save account", error);
            alert("Erro ao salvar a conta");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/management/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Contas</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Wallet size={24} className="text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Contas Bancárias</h1>
                            <p className="text-sm text-slate-400">Cadastre e gerencie as contas usadas no controle financeiro</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleOpenNew}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                    >
                        <Plus size={16} /> Nova Conta
                    </button>
                </div>
            </motion.div>

            {/* List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {accounts.map((acc, idx) => {
                            const Icon = getIconForType(acc.type);
                            return (
                                <motion.div
                                    key={acc.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative group transition-all ${!acc.isActive ? 'opacity-50 grayscale' : 'hover:bg-slate-800/60 hover:border-white/10'}`}
                                >
                                    {/* Active Badge */}
                                    <div className={`absolute top-5 right-5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${acc.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                                        {acc.isActive ? "Ativa" : "Inativa"}
                                    </div>

                                    <div className="flex items-start gap-4 mb-6 mt-1">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${acc.color} shadow-black/20`}>
                                            <Icon size={24} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-12">
                                            <h3 className="text-base font-bold text-white truncate">{acc.name}</h3>
                                            <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-1">{acc.bank} • {acc.type}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/[0.04]">
                                            <div>
                                                <p className="text-[10px] uppercase text-slate-500 font-bold mb-0.5">Agência</p>
                                                <p className="text-sm font-mono text-slate-300">{acc.agency || "N/A"}</p>
                                            </div>
                                            <div className="w-px h-8 bg-white/[0.06]" />
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase text-slate-500 font-bold mb-0.5">Conta</p>
                                                <p className="text-sm font-mono text-slate-300">{acc.accountNumber || "N/A"}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Saldo Atual</p>
                                            <p className={`text-2xl font-bold tracking-tight ${acc.initialBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                                                {formatCurrency(acc.initialBalance)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions hover */}
                                    <div className="absolute bottom-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(acc)} className="p-2 bg-slate-700 hover:bg-blue-500 text-white rounded-lg transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(acc.id)} className="p-2 bg-slate-700 hover:bg-rose-500 text-white rounded-lg transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Empty State / Add New Card */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleOpenNew}
                        className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-white/[0.08] hover:border-blue-500/50 bg-slate-800/20 hover:bg-blue-500/5 rounded-2xl transition-all group"
                    >
                        <div className="w-14 h-14 rounded-full bg-slate-800 group-hover:bg-blue-500 text-slate-500 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                            <Plus size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-400 group-hover:text-blue-400 transition-colors">Cadastrar Nova Conta</span>
                    </motion.button>
                </div>
            )}

            {/* Modal de Cadastro/Edição */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Wallet size={18} className="text-blue-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">{editingId ? "Editar Conta" : "Nova Conta"}</h2>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                {/* Nome & Cor */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-3 space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Nome da Conta (Apelido) <span className="text-rose-400">*</span></label>
                                        <input 
                                            type="text" 
                                            value={formData.name} 
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            placeholder="Ex: Conta Corrente Itaú" 
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Cor</label>
                                        <select 
                                            value={formData.color} 
                                            onChange={e => setFormData({...formData, color: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                                        >
                                            {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label.split(" ")[0]}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Instituição & Tipo */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Instituição Financeira <span className="text-rose-400">*</span></label>
                                        <select 
                                            value={formData.bank} 
                                            onChange={e => setFormData({...formData, bank: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                                        >
                                            {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Tipo de Conta</label>
                                        <select 
                                            value={formData.type} 
                                            onChange={e => setFormData({...formData, type: e.target.value as AccountType})}
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                                        >
                                            <option value="Corrente">Corrente</option>
                                            <option value="Poupança">Poupança</option>
                                            <option value="Investimento">Investimento</option>
                                            <option value="Caixa">Caixa Físico</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Agência e Conta */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Agência (com dígito se houver)</label>
                                        <input 
                                            type="text" 
                                            value={formData.agency || ""} 
                                            onChange={e => setFormData({...formData, agency: e.target.value})}
                                            placeholder="Ex: 0001" 
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Número da Conta (com dígito)</label>
                                        <input 
                                            type="text" 
                                            value={formData.accountNumber || ""} 
                                            onChange={e => setFormData({...formData, accountNumber: e.target.value})}
                                            placeholder="Ex: 12345-6" 
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" 
                                        />
                                    </div>
                                </div>

                                {/* Saldo Inicial & Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Saldo Inicial / Atual (R$)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <DollarSign size={16} className="text-slate-500" />
                                            </div>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                value={formData.initialBalance || 0} 
                                                onChange={e => setFormData({...formData, initialBalance: parseFloat(e.target.value) || 0})}
                                                className="w-full pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Status da Conta</label>
                                        <div className="flex items-center gap-3 h-10">
                                            <button 
                                                onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                            <span className={`text-sm font-bold ${formData.isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                {formData.isActive ? "Conta Ativa" : "Conta Inativa"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-white/[0.06] bg-slate-900/50 flex gap-3 justify-end">
                                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white rounded-xl transition-colors">
                                    Cancelar
                                </button>
                                <button disabled={isSaving} onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20">
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                                    Salvar Conta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
