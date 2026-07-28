"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Check, Wallet, Building, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { investmentsService } from "@/services/investments.service";
import { bankAccountsService, BankAccount } from "@/services/bank-accounts.service";
import { motion } from "framer-motion";

export default function NewInvestmentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        institution: "",
        type: "CDB",
        initialAmount: "",
        startDate: new Date().toISOString().split('T')[0],
        accountId: ""
    });

    useEffect(() => {
        bankAccountsService.list().then(res => {
            if (res.success && res.data) {
                setAccounts(res.data.filter(a => a.isActive));
            }
        });
    }, []);

    const handleSave = async () => {
        if (!formData.name || !formData.institution || !formData.type || !formData.initialAmount || !formData.startDate) {
            toast.error("Campos obrigatórios", "Preencha todos os campos corretamente.");
            return;
        }

        const initialAmountNum = parseFloat(formData.initialAmount.replace(/\./g, '').replace(',', '.'));
        if (isNaN(initialAmountNum) || initialAmountNum <= 0) {
            toast.error("Valor inválido", "Digite um valor válido maior que zero para a aplicação.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await investmentsService.create({
                name: formData.name,
                institution: formData.institution,
                type: formData.type,
                initialAmount: initialAmountNum,
                startDate: formData.startDate,
                accountId: formData.accountId || null
            });

            if (res.success) {
                toast.success("Sucesso", "Investimento criado com sucesso!");
                router.push("/dashboard/financial/investments");
            } else {
                toast.error("Erro", "Falha ao criar investimento.");
            }
        } catch (e) {
            toast.error("Erro", "Erro ao conectar com o servidor.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/financial/investments" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Wallet size={14} /><span>Investimentos</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Novo</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Plus size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Nova Aplicação</h1>
                            <p className="text-sm text-slate-400">Registre um novo investimento de renda fixa ou variável.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
                    >
                        {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                        {isSaving ? "Salvando..." : "Salvar Investimento"}
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-8">
                {/* Bloco 1: O que é? */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">1</span>
                        O que você está investindo?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Nome do Investimento</label>
                            <input 
                                type="text" 
                                placeholder="Ex: CDB Liquidez Diária"
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" 
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Tipo de Ativo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Building size={16} className="text-slate-500" />
                                </div>
                                <select 
                                    value={formData.type} 
                                    onChange={e => setFormData({...formData, type: e.target.value})} 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                                >
                                    <option value="CDB">CDB</option>
                                    <option value="CDI">CDI</option>
                                    <option value="LCI">LCI</option>
                                    <option value="LCA">LCA</option>
                                    <option value="Tesouro Direto">Tesouro Direto</option>
                                    <option value="Fundos">Fundos de Investimento</option>
                                    <option value="Ações">Ações</option>
                                    <option value="FIIs">FIIs (Fundos Imobiliários)</option>
                                    <option value="Criptomoedas">Criptomoedas</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Valor Inicial Aplicado (R$)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <DollarSign size={16} className="text-slate-500" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="0,00"
                                    value={formData.initialAmount} 
                                    onChange={e => setFormData({...formData, initialAmount: e.target.value})} 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Data da Aplicação</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Calendar size={16} className="text-slate-500" />
                                </div>
                                <input 
                                    type="date" 
                                    value={formData.startDate} 
                                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]" 
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Bloco 2: Onde vai ficar? */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">2</span>
                        Onde o dinheiro vai ficar?
                    </h2>
                    <div className="space-y-1.5 max-w-md">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Instituição / Corretora</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Building size={16} className="text-slate-500" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Ex: XP Investimentos, Banco Inter, BTG Pactual"
                                value={formData.institution} 
                                onChange={e => setFormData({...formData, institution: e.target.value})} 
                                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" 
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Bloco 3: De onde o dinheiro vai sair? */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">3</span>
                        De onde o dinheiro vai sair?
                    </h2>
                    <div className="space-y-1.5 max-w-md">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Conta Bancária (Fluxo de Caixa)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Wallet size={16} className="text-slate-500" />
                            </div>
                            <select 
                                value={formData.accountId} 
                                onChange={e => setFormData({...formData, accountId: e.target.value})} 
                                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                            >
                                <option value="">Não descontar do caixa (Já investi antes)</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} - {acc.bank}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {formData.accountId && (
                        <div className="mt-6 p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <p className="text-sm text-amber-400 font-medium mb-1">
                                Uma Transação de Transferência será gerada automaticamente!
                            </p>
                            <p className="text-xs text-amber-500/80">
                                Como você selecionou uma conta de origem, o valor de <strong>R$ {formData.initialAmount || '0,00'}</strong> será debitado da sua conta sob a classificação "Transferência". Isso diminui seu saldo em caixa, mas <strong>não entra no seu DRE como Despesa</strong>, pois é apenas um remanejamento de patrimônio.
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
