"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, PieChart, Calculator, CheckCircle2, Wallet, DollarSign, Loader2 } from "lucide-react";
import { profitDistributionService, ProfitSimulation } from "@/services/profit-distribution.service";
import { companyBranchesService, CompanyBranch } from "@/services/company-branches.service";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function NewProfitDistributionPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    // Step 1: Selection
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [companyId, setCompanyId] = useState("matriz");
    const [branches, setBranches] = useState<CompanyBranch[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    
    // Step 2: Simulation Results
    const [simulation, setSimulation] = useState<ProfitSimulation | null>(null);
    const [distributedAmount, setDistributedAmount] = useState("");
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, "");
        if (val.length === 0) {
            setDistributedAmount("");
            return;
        }
        val = (parseInt(val, 10) / 100).toFixed(2);
        val = val.replace(".", ",");
        val = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        setDistributedAmount(val);
    };
    
    // Step 3: Execution
    const [accounts, setAccounts] = useState<any[]>([]);
    const [accountId, setAccountId] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        // Load bank accounts
        api("/api/financial/accounts").then((res: any) => {
            if (res.success) setAccounts(res.data);
        }).catch(() => {});

        // Load branches
        companyBranchesService.list().then(res => {
            if (res.success && res.data) setBranches(res.data);
        }).catch(() => {});
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };

    const handleSimulate = async () => {
        setIsSimulating(true);
        try {
            const res = await profitDistributionService.simulate(month, year, companyId);
            if (res.success && res.data) {
                setSimulation(res.data);
                if (res.data.totalProfit > 0) {
                    let val = res.data.totalProfit.toFixed(2).replace(".", ",");
                    val = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                    setDistributedAmount(val);
                } else {
                    setDistributedAmount("0,00");
                }
            }
        } catch (error) {
            toast.error("Erro", "Não foi possível simular a distribuição.");
        } finally {
            setIsSimulating(false);
        }
    };

    const handleExecute = async () => {
        if (!simulation) return;

        const amountNum = parseFloat(distributedAmount.replace(/\./g, '').replace(',', '.'));
        
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error("Erro", "Valor a distribuir inválido.");
            return;
        }

        if (amountNum > simulation.totalProfit && simulation.totalProfit > 0) {
            toast.error("Atenção", "O valor distribuído não pode ser maior que o lucro do período.");
            return;
        }

        if (!accountId) {
            toast.error("Erro", "Selecione a conta bancária de onde o dinheiro sairá.");
            return;
        }

        if (simulation.partners.length === 0) {
            toast.error("Atenção", "Não há sócios cadastrados no Perfil Institucional da empresa.");
            return;
        }

        // Calculate items
        const items = simulation.partners.map(p => ({
            name: p.name,
            share: parseFloat(p.share),
            value: amountNum * (parseFloat(p.share) / 100)
        }));

        setIsExecuting(true);
        try {
            const res = await profitDistributionService.execute({
                referencePeriod: `${year}-${month}`,
                totalProfit: simulation.totalProfit,
                distributedAmount: amountNum,
                accountId,
                items
            });

            if (res.success) {
                toast.success("Sucesso", "Distribuição realizada! As transferências foram agendadas no caixa.");
                router.push("/dashboard/financial/profit-distribution");
            } else {
                toast.error("Erro", "Falha ao realizar distribuição.");
            }
        } catch (error) {
            toast.error("Erro", "Erro ao conectar com servidor.");
        } finally {
            setIsExecuting(false);
        }
    };

    const renderPartnerItems = () => {
        if (!simulation) return null;
        const amountNum = parseFloat(distributedAmount.replace(/\./g, '').replace(',', '.'));
        const validAmount = isNaN(amountNum) ? 0 : amountNum;

        if (simulation.partners.length === 0) {
            return (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
                    Nenhum sócio encontrado. Acesse <b>Configurações &gt; Dados da Empresa</b> para cadastrar o Quadro Societário.
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {simulation.partners.map((p, i) => {
                    const share = parseFloat(p.share);
                    const val = validAmount * (share / 100);
                    return (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-900 border border-white/5 rounded-xl">
                            <div>
                                <h4 className="text-sm font-bold text-white">{p.name}</h4>
                                <span className="text-xs text-slate-400">Participação: {p.share}%</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-lg font-black text-amber-400">{formatCurrency(val)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen pb-32">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/financial/profit-distribution" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><PieChart size={14} /><span>Distribuição de Lucros</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Nova</span>
                </div>
                
                <h1 className="text-2xl font-bold text-white tracking-tight">Realizar Nova Distribuição</h1>
                <p className="text-sm text-slate-400">Calcule o lucro do período e repasse aos sócios cadastrados.</p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8">
                
                {/* Passo 1: Período */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
                        Selecionar Período de Apuração
                    </h2>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
                        <div className="flex-1 space-y-1.5 w-full">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Empresa (Quadro Societário)</label>
                            <select 
                                value={companyId} 
                                onChange={e => {
                                    setCompanyId(e.target.value);
                                    setSimulation(null); // clear simulation on change
                                }} 
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
                            >
                                <option value="matriz">Matriz Principal</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.cnpj})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-1.5 w-full">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Mês</label>
                            <select 
                                value={month} 
                                onChange={e => setMonth(e.target.value)} 
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
                            >
                                <option value="01">Janeiro</option>
                                <option value="02">Fevereiro</option>
                                <option value="03">Março</option>
                                <option value="04">Abril</option>
                                <option value="05">Maio</option>
                                <option value="06">Junho</option>
                                <option value="07">Julho</option>
                                <option value="08">Agosto</option>
                                <option value="09">Setembro</option>
                                <option value="10">Outubro</option>
                                <option value="11">Novembro</option>
                                <option value="12">Dezembro</option>
                            </select>
                        </div>
                        <div className="flex-1 space-y-1.5 w-full">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Ano</label>
                            <input 
                                type="number" 
                                value={year} 
                                onChange={e => setYear(e.target.value)} 
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50" 
                            />
                        </div>
                        <button 
                            onClick={handleSimulate}
                            disabled={isSimulating}
                            className="w-full md:w-auto px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                            Apurar Lucro
                        </button>
                    </div>
                </motion.div>

                {/* Passo 2: Resultado e Divisão */}
                {simulation && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
                            Resultado do Exercício e Divisão
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/10">
                                <span className="text-[10px] uppercase font-bold text-emerald-500/80 mb-1 block">Receitas Recebidas</span>
                                <span className="text-lg font-bold text-emerald-400">{formatCurrency(simulation.incomes)}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/10">
                                <span className="text-[10px] uppercase font-bold text-rose-500/80 mb-1 block">Despesas Pagas</span>
                                <span className="text-lg font-bold text-rose-400">{formatCurrency(simulation.expenses)}</span>
                            </div>
                            <div className={`p-4 rounded-xl ${simulation.totalProfit > 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-800 border border-white/10'}`}>
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Lucro Líquido Real</span>
                                <span className={`text-xl font-black ${simulation.totalProfit > 0 ? 'text-amber-400' : 'text-white'}`}>{formatCurrency(simulation.totalProfit)}</span>
                            </div>
                        </div>

                        {simulation.totalProfit <= 0 && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6">
                                <p className="text-sm text-rose-400 font-medium">Atenção: O período selecionado não gerou lucro contábil. Recomenda-se não realizar distribuição.</p>
                            </div>
                        )}

                        <div className="space-y-4 max-w-sm mb-8">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-amber-500">Valor a Distribuir (R$)</label>
                                <p className="text-xs text-slate-400 mb-2">Você pode distribuir o lucro inteiro ou apenas parte dele.</p>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <DollarSign size={16} className="text-amber-500" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={distributedAmount} 
                                        onChange={handleAmountChange} 
                                        className="w-full pl-10 pr-4 py-4 bg-slate-950 border border-amber-500/30 rounded-xl text-xl font-bold text-amber-400 focus:outline-none focus:border-amber-500 shadow-inner" 
                                    />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            Simulação por Sócio
                        </h3>
                        {renderPartnerItems()}

                    </motion.div>
                )}

                {/* Passo 3: Pagamento */}
                {simulation && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
                            Efetivar Transferências
                        </h2>

                        <div className="space-y-1.5 max-w-md mb-8">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Conta Bancária de Origem</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Wallet size={16} className="text-slate-500" />
                                </div>
                                <select 
                                    value={accountId} 
                                    onChange={e => setAccountId(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none"
                                >
                                    <option value="">Selecione a conta que irá pagar os sócios</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} - {acc.bank}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
                            <p className="text-sm text-blue-400 font-medium mb-1">
                                O que vai acontecer agora?
                            </p>
                            <p className="text-xs text-blue-500/80">
                                Ao confirmar, o sistema vai criar uma transação de saída (tipo Pessoas, categoria Distribuição de Lucros) para cada sócio listado acima. Isso debitará automaticamente o saldo da conta selecionada e registrará o histórico de repasses.
                            </p>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/5">
                            <button 
                                onClick={handleExecute}
                                disabled={isExecuting}
                                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
                            >
                                {isExecuting ? "Processando..." : (
                                    <>
                                        <CheckCircle2 size={18} /> Confirmar e Distribuir
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
}
