"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ChevronLeft, ChevronRight, Save, User, FileText, 
    DollarSign, Users, Clock, Send, Sparkles, CheckCircle2, ShieldAlert,
    Paperclip, Mail, Search, UploadCloud, X, Building
} from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { contractsMockService } from "@/services/mock/contracts.mock";
import { api } from "@/lib/api";
import { useEffect } from "react";

const maskCPFCNPJ = (value: string) => {
    value = value.replace(/\D/g, "");
    if (value.length <= 11) {
        return value
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
        return value
            .substring(0, 14)
            .replace(/(\d{2})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1/$2")
            .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
};

const maskCurrency = (value: string) => {
    value = value.replace(/\D/g, "");
    if (!value) return "";
    value = (parseInt(value) / 100).toFixed(2);
    return value.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseCurrency = (value: string) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, "").replace(",", "."));
};

const steps = [
    { id: 1, title: 'Partes', icon: User },
    { id: 2, title: 'Objeto', icon: FileText },
    { id: 3, title: 'Financeiro', icon: DollarSign },
    { id: 4, title: 'Assinantes', icon: Users },
    { id: 5, title: 'Prazos', icon: Clock },
    { id: 6, title: 'Revisão IA', icon: Sparkles },
];

export default function NewContractWizardPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiRisks, setAiRisks] = useState<any[]>([]);

    const [templates, setTemplates] = useState<any[]>([]);
    const [templateSearch, setTemplateSearch] = useState('');
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

    const [dealSearch, setDealSearch] = useState('');
    const [foundDeals, setFoundDeals] = useState<any[]>([]);
    const [isSearchingDeals, setIsSearchingDeals] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<any>(null);

    const [matriz, setMatriz] = useState<any>(null);
    const [branches, setBranches] = useState<any[]>([]);

    useEffect(() => {
        api<any>('/api/contracts/templates?limit=100').then(res => {
            if (res.success && res.data) {
                setTemplates(res.data);
            }
        });
        api<any>('/api/institutional').then(res => {
            if (res.success && res.data) {
                setMatriz(res.data);
                // Pre-select matriz
                setFormData(prev => ({
                    ...prev,
                    contractedName: res.data.companyName || res.data.tradeName || 'Matriz',
                    contractedDocument: res.data.cnpj || ''
                }));
            }
        });
        api<any>('/api/company-branches').then(res => {
            if (res.success && res.data) {
                setBranches(res.data);
            }
        });
    }, []);

    const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()));

    // Form Data
    const [formData, setFormData] = useState({
        contractorName: '',
        contractorDocument: '',
        objectDescription: '',
        value: '',
        paymentMethod: 'PIX',
        installments: 1,
        firstDueDate: '',
        installmentsList: [] as { dueDate: string; value: string }[],
        signingDeadline: '',
        emailTemplate: 'et_1',
        crmScope: null as any,
        attachments: [] as File[],
        contractedCompanyId: 'matriz',
        contractedName: '',
        contractedDocument: '',
        contractedPartners: [] as any[],
        signers: [{ name: '', email: '', role: 'contratante' }]
    });

    const nextStep = () => {
        if (currentStep < 6) setCurrentStep(currentStep + 1);
        if (currentStep === 5) {
            runAIAnalysis();
        }
    };
    const prevStep = () => {if (currentStep > 1) setCurrentStep(currentStep - 1)};

    const generateInstallments = () => {
        const num = parseInt(formData.installments as any) || 1;
        const total = parseCurrency(formData.value) || 0;
        let firstDate = new Date();
        if (formData.firstDueDate) {
            const [y, m, d] = formData.firstDueDate.split('-');
            firstDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        }
        
        const list = [];
        const valPerInst = (total / num).toFixed(2);
        const valPerInstMasked = maskCurrency(valPerInst.replace(".", ""));
        
        for (let i = 0; i < num; i++) {
            const d = new Date(firstDate);
            d.setMonth(d.getMonth() + i);
            const iso = d.toISOString().split('T')[0];
            list.push({ dueDate: iso, value: valPerInstMasked });
        }
        setFormData({ ...formData, installmentsList: list });
    };

    const runAIAnalysis = async () => {
        setIsAnalyzing(true);
        // Construindo texto de contexto combinando tudo
        const textToAnalyze = `
Contratante: ${formData.contractorName}
Objeto do Contrato: ${formData.objectDescription}
Valor: R$ ${formData.value}
Parcelas: ${formData.installments}
Forma Pagamento: ${formData.paymentMethod}
Prazos e Vencimentos: Primeiro em ${formData.firstDueDate}
        `.trim();

        // Chama a rota real de análise que usa a Anthropic
        const res = await api<any>('/api/contracts/analysis/analyze-risks', {
            method: 'POST',
            body: { textContext: textToAnalyze, role: 'contratada', compareModel: 'none' }
        });
        
        setIsAnalyzing(false);
        if (res.success && res.data) {
            setAiRisks(res.data);
            toast.success("Análise concluída", "A IA identificou alguns pontos de atenção.");
        } else {
            toast.error("Erro na Análise", "Não foi possível realizar a análise de riscos agora.");
        }
    };

    const handleSearchDeal = async () => {
        if (!dealSearch) return;
        setIsSearchingDeals(true);
        const res = await api<any>(`/api/contracts/deals/search?q=${dealSearch}`);
        setIsSearchingDeals(false);
        if (res.success && res.data) {
            setFoundDeals(res.data);
            if (res.data.length === 0) toast.error("Aviso", "Nenhum negócio encontrado.");
        }
    };

    const handleCreateDraft = async () => {
        setIsSubmitting(true);
        
        const payload = {
            ...formData,
            templateId: selectedTemplate?.id,
            dealId: selectedDeal?.id,
            value: parseCurrency(formData.value),
            signers: [
                ...formData.signers,
                ...formData.contractedPartners.map(p => ({
                    name: p.name,
                    email: p.email || 'socio@empresa.com',
                    role: 'contratada'
                }))
            ]
        };
        
        const res = await api<any>('/api/contracts', {
            method: 'POST',
            body: payload
        });
        
        if (res.success && res.data) {
            const contractId = res.data.id;
            
            // Fazer upload sequencial dos arquivos, se houver
            for (const file of formData.attachments) {
                const fd = new FormData();
                fd.append("file", file);
                await fetch(`/api/contracts/${contractId}/upload`, {
                    method: 'POST',
                    body: fd,
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
            }
            
            toast.success("Sucesso", "Contrato gerado como Rascunho!");
            router.push("/dashboard/contracts");
        } else {
            toast.error("Erro", "Falha ao gerar o rascunho do contrato.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/contracts" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Novo Contrato</h1>
                        <p className="text-sm text-slate-400">Preencha as informações para gerar o documento.</p>
                    </div>
                </div>
            </div>

            {/* Stepper */}
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
                            <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-500'}`}>{step.title}</span>
                        </div>
                    );
                })}
            </div>

            {/* Content Form Area */}
            <div className="flex-1 bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col">
                <AnimatePresence mode="wait">
                    
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><User size={20} className="text-indigo-400"/> Dados do Contratante</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Nome ou Razão Social</label>
                                    <input type="text" value={formData.contractorName} onChange={e => setFormData({...formData, contractorName: e.target.value})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" placeholder="Ex: Acme Corp Ltda" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">CPF ou CNPJ</label>
                                    <input type="text" value={formData.contractorDocument} onChange={e => setFormData({...formData, contractorDocument: maskCPFCNPJ(e.target.value)})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 font-mono" placeholder="00.000.000/0001-00" />
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 mt-8 pt-6 border-t border-white/5"><Building size={20} className="text-emerald-400"/> Sua Empresa (Contratada)</h3>
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Selecione a Empresa (Matriz ou Filial)</label>
                                    <select 
                                        className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData(prev => ({ ...prev, contractedCompanyId: val, contractedPartners: [] }));
                                            if (val === 'matriz' && matriz) {
                                                setFormData(prev => ({...prev, contractedName: matriz.companyName || matriz.tradeName || 'Matriz', contractedDocument: matriz.cnpj || ''}));
                                            } else {
                                                const b = branches.find(b => b.id === val);
                                                if (b) setFormData(prev => ({...prev, contractedName: b.name, contractedDocument: b.cnpj || ''}));
                                            }
                                        }}
                                    >
                                        <option value="matriz">Matriz {matriz?.cnpj ? `(${matriz.cnpj})` : ''}</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name} {b.cnpj ? `(${b.cnpj})` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                {matriz?.partners && matriz.partners.filter((p: any) => p.companyId === formData.contractedCompanyId || (formData.contractedCompanyId === 'matriz' && !p.companyId)).length > 0 && (
                                    <div className="space-y-1.5 p-4 bg-slate-900 border border-white/5 rounded-xl mt-2">
                                        <label className="text-[11px] font-bold uppercase text-slate-500 mb-2 block">Sócios Assinantes (Contratada)</label>
                                        <div className="space-y-2">
                                            {matriz.partners.filter((p: any) => p.companyId === formData.contractedCompanyId || (formData.contractedCompanyId === 'matriz' && !p.companyId)).map((partner: any, idx: number) => {
                                                const isChecked = formData.contractedPartners.some(p => p.id === partner.id);
                                                return (
                                                    <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFormData({...formData, contractedPartners: [...formData.contractedPartners, partner]});
                                                                } else {
                                                                    setFormData({...formData, contractedPartners: formData.contractedPartners.filter(p => p.id !== partner.id)});
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-white/20 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50" 
                                                        />
                                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{partner.name} ({partner.role || 'Sócio'})</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <p className="text-xs text-blue-400">Dica: Futuramente, você poderá buscar os clientes direto do CRM (Advisor) aqui.</p>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><FileText size={20} className="text-indigo-400"/> Objeto & Anexos</h3>
                            
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-2"><Search size={12}/> Buscar Escopo no CRM (Advisor)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={dealSearch} onChange={e => setDealSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchDeal()} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" placeholder="Digite o nome do negócio/cliente..." />
                                    <button onClick={handleSearchDeal} disabled={isSearchingDeals} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all whitespace-nowrap">
                                        {isSearchingDeals ? "Buscando..." : "Buscar"}
                                    </button>
                                </div>
                                {foundDeals.length > 0 && !selectedDeal && (
                                    <div className="mt-2 bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-lg">
                                        {foundDeals.map(deal => (
                                            <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="p-3 border-b border-white/5 last:border-0 hover:bg-slate-700 cursor-pointer flex justify-between items-center text-sm text-white transition-colors">
                                                <span>{deal.title}</span>
                                                <span className="text-xs text-indigo-400 font-bold">R$ {deal.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedDeal && (
                                    <div className="mt-2 p-3 bg-slate-900/50 border border-white/5 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText size={16} className="text-emerald-400" />
                                            <div>
                                                <p className="text-xs font-bold text-white">Negócio Selecionado: {selectedDeal.title}</p>
                                                <p className="text-[10px] text-slate-500">Valor vinculado: R$ {selectedDeal.value}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedDeal(null)} className="text-slate-500 hover:text-rose-400"><X size={16}/></button>
                                    </div>
                                )}
                            </div>

                            {/* Template Selector */}
                            <div className="space-y-1.5 pt-4 border-t border-white/5 relative">
                                <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-2"><FileText size={12}/> Selecionar Modelo de Contrato</label>
                                <input 
                                    type="text" 
                                    value={templateSearch}
                                    onChange={e => {
                                        setTemplateSearch(e.target.value);
                                        setShowTemplateDropdown(true);
                                    }}
                                    onFocus={() => setShowTemplateDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowTemplateDropdown(false), 200)}
                                    className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" 
                                    placeholder="Buscar modelo digitando o nome..." 
                                />
                                {showTemplateDropdown && filteredTemplates.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                        {filteredTemplates.map(t => (
                                            <div 
                                                key={t.id} 
                                                onClick={() => {
                                                    setSelectedTemplate(t);
                                                    setTemplateSearch(t.name);
                                                    setShowTemplateDropdown(false);
                                                    setFormData({...formData, objectDescription: t.content || ''});
                                                    toast.success("Modelo Carregado", `O conteúdo do modelo "${t.name}" foi inserido na descrição do objeto.`);
                                                }}
                                                className="p-3 hover:bg-slate-700 cursor-pointer text-sm text-white border-b border-white/5 last:border-0"
                                            >
                                                {t.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedTemplate && (
                                    <div className="mt-2 text-xs text-emerald-400 font-bold flex items-center gap-1">
                                        <CheckCircle2 size={14}/> Modelo "{selectedTemplate.name}" selecionado e carregado na descrição abaixo.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5 pt-4 border-t border-white/5">
                                <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-2"><Paperclip size={12}/> Anexos Adicionais</label>
                                <label className="border-2 border-dashed border-slate-700 bg-slate-900/30 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900 transition-all">
                                    <input type="file" multiple className="hidden" onChange={e => {
                                        if (e.target.files) {
                                            setFormData({...formData, attachments: [...formData.attachments, ...Array.from(e.target.files)]});
                                        }
                                    }} />
                                    <UploadCloud size={24} className="text-slate-500 mb-2" />
                                    <p className="text-xs font-bold text-slate-300">Clique para selecionar arquivos</p>
                                    <p className="text-[10px] text-slate-500 mt-1">PDF, JPG, PNG, DOCX</p>
                                </label>
                                {formData.attachments.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {formData.attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 border border-white/5 rounded-lg text-xs text-slate-300">
                                                <span className="truncate">{file.name}</span>
                                                <button onClick={() => setFormData({...formData, attachments: formData.attachments.filter((_, i) => i !== idx)})} className="text-slate-500 hover:text-rose-400"><X size={14}/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5 pt-4 border-t border-white/5">
                                <label className="text-[11px] font-bold uppercase text-slate-500">Descrição do Objeto (Opcional)</label>
                                <textarea value={formData.objectDescription} onChange={e => setFormData({...formData, objectDescription: e.target.value})} className="w-full h-24 p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none" placeholder="Detalhes complementares ao escopo anexo..." />
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><DollarSign size={20} className="text-indigo-400"/> Condições Financeiras</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Valor Total (R$)</label>
                                    <input type="text" value={formData.value} onChange={e => setFormData({...formData, value: maskCurrency(e.target.value)})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" placeholder="Ex: 15.000,00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Forma de Pagamento</label>
                                    <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none">
                                        <option value="PIX">PIX</option>
                                        <option value="Boleto">Boleto Bancário</option>
                                        <option value="Cartao">Cartão de Crédito</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Número de Parcelas</label>
                                    <input type="number" min="1" value={formData.installments} onChange={e => setFormData({...formData, installments: parseInt(e.target.value) || 1})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" placeholder="1" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Primeiro Vencimento</label>
                                    <input type="date" value={formData.firstDueDate} onChange={e => setFormData({...formData, firstDueDate: e.target.value})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" />
                                </div>
                                <div className="space-y-1.5 md:col-span-2 mt-2">
                                    <button onClick={generateInstallments} className="px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-xl text-xs font-bold transition-all border border-indigo-500/30">
                                        Gerar Grade de Parcelas
                                    </button>
                                </div>
                                {formData.installmentsList.length > 0 && (
                                    <div className="md:col-span-2 space-y-3 mt-2 pt-4 border-t border-white/5">
                                        <label className="text-[11px] font-bold uppercase text-slate-500">Grade de Parcelamento</label>
                                        {formData.installmentsList.map((inst, idx) => (
                                            <div key={idx} className="flex gap-4 items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] text-slate-500">Vencimento</label>
                                                    <input type="date" value={inst.dueDate} onChange={e => {
                                                        const newList = [...formData.installmentsList];
                                                        newList[idx].dueDate = e.target.value;
                                                        setFormData({ ...formData, installmentsList: newList });
                                                    }} className="w-full p-2 bg-slate-950 border border-white/5 rounded-lg text-sm text-white" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] text-slate-500">Valor (R$)</label>
                                                    <input type="text" value={inst.value} onChange={e => {
                                                        const newList = [...formData.installmentsList];
                                                        newList[idx].value = maskCurrency(e.target.value);
                                                        setFormData({ ...formData, installmentsList: newList });
                                                    }} className="w-full p-2 bg-slate-950 border border-white/5 rounded-lg text-sm text-white" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Users size={20} className="text-indigo-400"/> Assinantes</h3>
                            
                            {formData.signers.map((signer, idx) => (
                                <div key={idx} className="p-4 bg-slate-900 border border-white/5 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-5 space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Nome Completo</label>
                                        <input type="text" value={signer.name} onChange={e => {
                                            const newS = [...formData.signers]; newS[idx].name = e.target.value; setFormData({...formData, signers: newS});
                                        }} className="w-full p-2 bg-slate-950 border border-white/5 rounded-lg text-sm text-white" />
                                    </div>
                                    <div className="md:col-span-4 space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">E-mail</label>
                                        <input type="email" value={signer.email} onChange={e => {
                                            const newS = [...formData.signers]; newS[idx].email = e.target.value; setFormData({...formData, signers: newS});
                                        }} className="w-full p-2 bg-slate-950 border border-white/5 rounded-lg text-sm text-white" />
                                    </div>
                                    <div className="md:col-span-3 space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Papel</label>
                                        <select value={signer.role} onChange={e => {
                                            const newS = [...formData.signers]; newS[idx].role = e.target.value; setFormData({...formData, signers: newS});
                                        }} className="w-full p-2 bg-slate-950 border border-white/5 rounded-lg text-sm text-white appearance-none">
                                            <option value="contratante">Contratante</option>
                                            <option value="contratada">Contratada</option>
                                            <option value="testemunha">Testemunha</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                            
                            <button onClick={() => setFormData({...formData, signers: [...formData.signers, { name: '', email: '', role: 'contratante' }]})} className="text-sm font-bold text-indigo-400 hover:text-indigo-300">
                                + Adicionar outro assinante
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Clock size={20} className="text-indigo-400"/> Prazos e Envio</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500">Data Limite para Assinatura</label>
                                    <input type="date" value={formData.signingDeadline} onChange={e => setFormData({...formData, signingDeadline: e.target.value})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" />
                                    <p className="text-[10px] text-slate-500 mt-1">O contrato é cancelado caso as assinaturas não sejam coletadas até esta data.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-2"><Mail size={12}/> Modelo de E-mail de Envio</label>
                                    <select value={formData.emailTemplate} onChange={e => setFormData({...formData, emailTemplate: e.target.value})} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none">
                                        <option value="et_1">Envio de Contrato Padrão</option>
                                        <option value="et_2">Lembrete de Assinatura</option>
                                    </select>
                                    <p className="text-[10px] text-indigo-400 mt-1 cursor-pointer hover:underline">Ver prévia do e-mail selecionado</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 6 && (
                        <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Sparkles size={20} className="text-amber-400"/> Análise de Riscos (IA)</h3>
                            
                            {isAnalyzing ? (
                                <div className="py-10 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                        <Sparkles size={24} className="text-amber-400 animate-pulse" />
                                    </div>
                                    <p className="text-sm text-amber-500 font-bold animate-pulse">Lendo e analisando o contrato...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3 mb-6">
                                        <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-400">Atenção Necessária</h4>
                                            <p className="text-xs text-amber-500/80 mt-1">A IA identificou {aiRisks.length} pontos de risco no contrato antes do envio. Revise as sugestões abaixo.</p>
                                        </div>
                                    </div>
                                    
                                    {aiRisks.map((risk, i) => (
                                        <div key={i} className="p-4 bg-slate-900 border border-white/5 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${risk.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                    Risco {risk.severity === 'high' ? 'Alto' : 'Médio'}
                                                </span>
                                                <span className="text-xs font-bold text-white">Cláusula: {risk.clause}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 mb-3">{risk.description}</p>
                                            <div className="p-3 bg-slate-950 rounded-lg border border-indigo-500/20">
                                                <p className="text-xs font-bold text-indigo-400 mb-1">Sugestão de Correção (IA):</p>
                                                <p className="text-sm text-slate-300">{risk.suggestion}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* Footer Controls */}
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
                            {isSubmitting ? "Gerando..." : "Finalizar Rascunho"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
