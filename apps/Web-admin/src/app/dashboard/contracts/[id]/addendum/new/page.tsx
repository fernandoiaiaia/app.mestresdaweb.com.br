"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ChevronLeft, ChevronRight, Save, User, FileText, 
    DollarSign, Users, Clock, Send, Sparkles, CheckCircle2, ShieldAlert,
    Paperclip, Mail, Search, UploadCloud, X, Lock
} from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { contractsMockService, Contract } from "@/services/mock/contracts.mock";

const steps = [
    { id: 1, title: 'Partes (Bloqueado)', icon: User },
    { id: 2, title: 'Objeto & Adições', icon: FileText },
    { id: 3, title: 'Financeiro', icon: DollarSign },
    { id: 4, title: 'Assinantes', icon: Users },
    { id: 5, title: 'Prazos', icon: Clock },
    { id: 6, title: 'Revisão IA', icon: Sparkles },
];

export default function NewAddendumWizardPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { toast } = useToast();
    
    const [originalContract, setOriginalContract] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiRisks, setAiRisks] = useState<any[]>([]);

    // Form Data (Aditivo)
    const [formData, setFormData] = useState({
        contractorName: '',
        contractorDocument: '',
        objectDescription: '',
        value: '',
        paymentMethod: 'PIX',
        signingDeadline: '',
        emailTemplate: 'et_1',
        crmScope: null as any,
        attachments: [] as File[],
        signers: [] as any[]
    });

    useEffect(() => {
        const load = async () => {
            const res = await contractsMockService.getContractById(resolvedParams.id);
            if (res.success && res.data) {
                setOriginalContract(res.data);
                setFormData({
                    ...formData,
                    contractorName: res.data.contractorName,
                    contractorDocument: '00.000.000/0001-00', // mocked
                    value: res.data.value.toString(),
                    paymentMethod: res.data.paymentMethod,
                    signers: res.data.signers.map(s => ({ ...s, role: s.role }))
                });
            } else {
                toast.error("Erro", "Contrato original não encontrado.");
                router.push("/dashboard/contracts");
            }
            setIsLoading(false);
        };
        load();
    }, [resolvedParams.id]);

    const nextStep = () => {
        if (currentStep < 6) setCurrentStep(currentStep + 1);
        if (currentStep === 5) {
            runAIAnalysis();
        }
    };
    const prevStep = () => {if (currentStep > 1) setCurrentStep(currentStep - 1)};

    const runAIAnalysis = async () => {
        setIsAnalyzing(true);
        const res = await contractsMockService.analyzeContractRisks();
        setIsAnalyzing(false);
        if (res.success && res.data) {
            setAiRisks(res.data);
            toast.success("Análise concluída", "A IA identificou pontos no aditivo.");
        }
    };

    const handleCreateDraft = async () => {
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1000));
        toast.success("Sucesso", "Aditivo criado como Rascunho!");
        router.push(`/dashboard/contracts/${resolvedParams.id}`);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><span className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/contracts/${resolvedParams.id}`} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-white tracking-tight">Novo Aditivo</h1>
                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">Ref: CTR-{originalContract?.number}</span>
                        </div>
                        <p className="text-sm text-slate-400">Criando um termo aditivo vinculado a um contrato existente.</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-10" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 -z-10 transition-all duration-500" style={{ width: `${((currentStep - 1) / 5) * 100}%` }} />
                
                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : isCompleted ? 'bg-indigo-900 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-700 text-slate-600'}`}>
                                {isCompleted ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
                            </div>
                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-500'} text-center max-w-[80px]`}>{step.title}</span>
                        </div>
                    );
                })}
            </div>

            <div className="flex-1 bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col">
                <AnimatePresence mode="wait">
                    
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Lock size={20} className="text-slate-500"/> Dados das Partes (Bloqueado)</h3>
                            <div className="p-4 bg-slate-900 border border-white/5 rounded-xl text-sm text-slate-400 mb-4">
                                Os dados do contratante não podem ser alterados em um aditivo. As partes se mantêm as mesmas do contrato original.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-50 pointer-events-none">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Nome ou Razão Social</label>
                                    <input type="text" value={formData.contractorName} readOnly className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">CPF ou CNPJ</label>
                                    <input type="text" value={formData.contractorDocument} readOnly className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white font-mono" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><FileText size={20} className="text-indigo-400"/> Objeto & Alterações do Aditivo</h3>
                            
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase text-slate-500">Qual a justificativa ou alteração principal deste aditivo?</label>
                                <textarea value={formData.objectDescription} onChange={e => setFormData({...formData, objectDescription: e.target.value})} className="w-full h-32 p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none" placeholder="Ex: Prorrogação de prazo por mais 12 meses e reajuste de escopo..." />
                            </div>

                            <div className="space-y-1.5 pt-4 border-t border-white/5">
                                <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-2"><Paperclip size={12}/> Anexos Complementares</label>
                                <div className="border-2 border-dashed border-slate-700 bg-slate-900/30 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900 transition-all">
                                    <UploadCloud size={24} className="text-slate-500 mb-2" />
                                    <p className="text-xs font-bold text-slate-300">Clique para anexar novos escopos ou planilhas</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><DollarSign size={20} className="text-indigo-400"/> Novas Condições Financeiras (Se houver)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Novo Valor Total (R$)</label>
                                    <input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Nova Forma de Pagamento</label>
                                    <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none">
                                        <option value="PIX">PIX</option>
                                        <option value="Boleto">Boleto Bancário</option>
                                        <option value="Cartao">Cartão de Crédito</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Users size={20} className="text-indigo-400"/> Assinantes do Aditivo</h3>
                            <div className="p-4 bg-slate-900 border border-white/5 rounded-xl text-sm text-slate-400 mb-4">
                                Por padrão, todas as partes que assinaram o contrato original devem assinar o aditivo.
                            </div>
                            {formData.signers.map((signer, idx) => (
                                <div key={idx} className="p-4 bg-slate-900 border border-white/5 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-5 space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Nome</label>
                                        <input type="text" value={signer.name} readOnly className="w-full p-2 bg-slate-950/50 border border-white/5 rounded-lg text-sm text-white opacity-70" />
                                    </div>
                                    <div className="md:col-span-4 space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">E-mail</label>
                                        <input type="email" value={signer.email} readOnly className="w-full p-2 bg-slate-950/50 border border-white/5 rounded-lg text-sm text-white opacity-70" />
                                    </div>
                                    <div className="md:col-span-3 space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Papel</label>
                                        <input type="text" value={signer.role} readOnly className="w-full p-2 bg-slate-950/50 border border-white/5 rounded-lg text-sm text-white opacity-70" />
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {currentStep === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Clock size={20} className="text-indigo-400"/> Prazos e Envio do Aditivo</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Data Limite para Assinatura</label>
                                    <input type="date" value={formData.signingDeadline} onChange={e => setFormData({...formData, signingDeadline: e.target.value})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-2"><Mail size={12}/> Modelo de E-mail</label>
                                    <select value={formData.emailTemplate} onChange={e => setFormData({...formData, emailTemplate: e.target.value})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none">
                                        <option value="et_1">Envio de Aditivo Padrão</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 6 && (
                        <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Sparkles size={20} className="text-amber-400"/> Análise de Riscos do Aditivo (IA)</h3>
                            
                            {isAnalyzing ? (
                                <div className="py-10 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                        <Sparkles size={24} className="text-amber-400 animate-pulse" />
                                    </div>
                                    <p className="text-sm text-amber-500 font-bold animate-pulse">Comparando com o original...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
                                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-emerald-400">Tudo Certo</h4>
                                            <p className="text-xs text-emerald-500/80 mt-1">A IA não identificou riscos adicionais neste termo aditivo comparado ao original.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>

                <div className="mt-auto pt-8 border-t border-white/5 flex justify-between items-center">
                    <button 
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        Anterior
                    </button>
                    
                    {currentStep < 6 ? (
                        <button 
                            onClick={nextStep}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                        >
                            Próximo <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button 
                            onClick={handleCreateDraft}
                            disabled={isAnalyzing || isSubmitting}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                        >
                            {isSubmitting ? "Gerando..." : "Finalizar Rascunho do Aditivo"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
