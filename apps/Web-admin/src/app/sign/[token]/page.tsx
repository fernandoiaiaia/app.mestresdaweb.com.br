"use client";

import { useState, useRef, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckCircle2, FileSignature, AlertCircle, XCircle, 
    Lock, Check, MessageSquare, Download, ShieldCheck
} from "lucide-react";

import { useToast } from "@/components/ui/toast";

export default function SignContractLandingPage({ params }: { params: Promise<{ token: string }> }) {
    const resolvedParams = use(params);
    const { toast } = useToast();
    
    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const [step, setStep] = useState<'reading' | 'action' | 'signing' | 'success' | 'refused'>('reading');
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // For "Request Changes" flow
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [changeRequestText, setChangeRequestText] = useState("");
    const [activeClauseId, setActiveClauseId] = useState<string | null>(null);

    // Clause status
    const [clauseStatus, setClauseStatus] = useState<Record<string, 'ok' | 'issue'>>({});

    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Allow a small threshold of 10px
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                if (!hasReadToBottom) {
                    setHasReadToBottom(true);
                    toast.success("Leitura Concluída", "Você já pode prosseguir com a assinatura.");
                }
            }
        }
    };

    const handleApprove = () => {
        setStep('signing');
        toast.success("Código Enviado", "Enviamos um código de 6 dígitos para o seu e-mail e WhatsApp.");
    };

    const handleRefuse = () => {
        if(confirm("Tem certeza que deseja recusar este contrato? Esta ação notificará o emissor.")) {
            setStep('refused');
        }
    };

    const handleRequestChangeSubmit = () => {
        if (!changeRequestText) return;
        
        if (activeClauseId) {
            setClauseStatus({ ...clauseStatus, [activeClauseId]: 'issue' });
            toast.success("Ressalva Registrada", "Sua solicitação de alteração para esta cláusula foi salva.");
            setShowChangeModal(false);
            setChangeRequestText("");
            setActiveClauseId(null);
        } else {
            toast.success("Solicitação Enviada", "O emissor foi notificado sobre as alterações solicitadas.");
            setShowChangeModal(false);
            setStep('refused');
        }
    };

    const handleClauseOk = (id: string) => {
        setClauseStatus({ ...clauseStatus, [id]: 'ok' });
    };

    const handleSign = async () => {
        if (twoFactorCode.length < 6) {
            toast.error("Atenção", "Digite o código de 6 dígitos.");
            return;
        }
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));
        setIsSubmitting(false);
        setStep('success');
    };

    // Fake Contract Content (Iterável)
    const clauses = [
        { id: 'intro', title: 'PARTES', content: 'Pelo presente instrumento particular, de um lado ACME CORP LTDA, pessoa jurídica de direito privado... (CONTRATADA).\nE de outro lado TECH INOVAÇÕES LTDA... (CONTRATANTE).' },
        { id: 'c1', title: 'CLÁUSULA 1 - DO OBJETO', content: 'O presente contrato tem como objeto a prestação de serviços de desenvolvimento de software conforme escopo detalhado no Anexo 1.' },
        { id: 'c2', title: 'CLÁUSULA 2 - DO VALOR E FORMA DE PAGAMENTO', content: 'A CONTRATANTE pagará à CONTRATADA o valor total de R$ 15.000,00, pagos via PIX em parcela única no aceite deste.' },
        { id: 'c3', title: 'CLÁUSULA 3 - DAS OBRIGAÇÕES', content: 'A CONTRATADA compromete-se a entregar os serviços no prazo estipulado. A CONTRATANTE deve fornecer os acessos necessários em até 5 dias úteis.' },
        { id: 'c4', title: 'CLÁUSULA 4 - DA CONFIDENCIALIDADE', content: 'Ambas as partes se comprometem a manter sigilo absoluto sobre informações confidenciais compartilhadas durante a vigência deste contrato.' },
        { id: 'c5', title: 'CLÁUSULA 5 - DA RESCISÃO', content: 'Qualquer das partes poderá rescindir este contrato mediante notificação prévia de 30 dias por escrito, sem incidência de multa.' },
        { id: 'c6', title: 'CLÁUSULA 6 - DO FORO', content: 'As partes elegem o foro da Comarca de São Paulo/SP para dirimir quaisquer dúvidas oriundas deste instrumento.' },
        { id: 'end', title: 'FECHO', content: 'E, por estarem assim justas e contratadas, assinam eletronicamente o presente instrumento.\n\nSão Paulo, 03 de Junho de 2026.' }
    ];

    const hasIssues = Object.values(clauseStatus).includes('issue');

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30 selection:text-indigo-900">
            {/* Minimal Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <FileSignature size={18} className="text-white" />
                    </div>
                    <span className="font-black text-slate-800 text-lg tracking-tight">Portal de Assinaturas</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    <Lock size={12} /> Ambiente Seguro
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-8">
                <AnimatePresence mode="wait">
                    
                    {/* Step 1 & 2: Reading & Action */}
                    {(step === 'reading' || step === 'action') && (
                        <motion.div key="reading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                                
                                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                                    <div>
                                        <h1 className="text-xl font-bold text-slate-800">Contrato de Prestação de Serviços</h1>
                                        <p className="text-sm text-slate-500 mt-1">Emissor: ACME Corp Ltda</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase rounded-full border border-amber-200">Aguardando sua assinatura</span>
                                    </div>
                                </div>

                                {/* Contract Document Area (Requires Scroll) */}
                                <div 
                                    ref={scrollRef} 
                                    onScroll={handleScroll}
                                    className="flex-1 p-8 md:p-12 overflow-y-auto bg-white relative"
                                >
                                    <div className="max-w-2xl mx-auto space-y-8">
                                        <h2 className="text-center text-lg font-bold text-slate-800 mb-8">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
                                        
                                        {clauses.map((clause) => (
                                            <div key={clause.id} className={`p-4 -mx-4 rounded-xl transition-colors group relative border border-transparent ${clauseStatus[clause.id] === 'ok' ? 'bg-emerald-50/50 border-emerald-100' : clauseStatus[clause.id] === 'issue' ? 'bg-amber-50/50 border-amber-100' : 'hover:bg-slate-50'}`}>
                                                
                                                <h3 className="text-sm font-bold text-slate-800 mb-2">{clause.title}</h3>
                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{clause.content}</p>

                                                {/* Clause Action Buttons on Hover */}
                                                <div className={`absolute top-4 right-4 flex gap-2 transition-opacity ${clauseStatus[clause.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                    {clauseStatus[clause.id] !== 'issue' && (
                                                        <button 
                                                            onClick={() => handleClauseOk(clause.id)}
                                                            className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${clauseStatus[clause.id] === 'ok' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                            title="Concordar com esta cláusula"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => { setActiveClauseId(clause.id); setShowChangeModal(true); }}
                                                        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${clauseStatus[clause.id] === 'issue' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                                                        title="Sugerir alteração nesta cláusula"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="h-64 flex items-center justify-center border-t border-slate-100 mt-10">
                                            <p className="text-xs text-slate-400">--- Fim do Documento ---</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Bar */}
                                <div className="p-5 border-t border-slate-200 bg-slate-50 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
                                    {!hasReadToBottom ? (
                                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 w-full md:w-auto">
                                            <AlertCircle size={18} />
                                            <span className="text-sm font-semibold">Por favor, leia o contrato até o final para habilitar a assinatura.</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200 w-full md:w-auto">
                                            <CheckCircle2 size={18} />
                                            <span className="text-sm font-semibold">Leitura confirmada.</span>
                                        </div>
                                    )}

                                    <div className="flex w-full md:w-auto gap-3">
                                        <button 
                                            onClick={handleRefuse}
                                            className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-bold transition-all"
                                        >
                                            Recusar
                                        </button>
                                        <button 
                                            onClick={() => { setActiveClauseId(null); setShowChangeModal(true); }}
                                            className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            {hasIssues ? "Enviar Alterações" : "Solicitar Alteração Geral"}
                                        </button>
                                        <button 
                                            onClick={handleApprove}
                                            disabled={!hasReadToBottom || hasIssues}
                                            className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Check size={18} /> Assinar Contrato
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: 2FA Signing */}
                    {step === 'signing' && (
                        <motion.div key="signing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-20">
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Lock size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Código de Segurança</h2>
                                <p className="text-sm text-slate-500 mb-8">
                                    Enviamos um código de 6 dígitos para o seu e-mail e WhatsApp. Digite-o abaixo para confirmar sua assinatura.
                                </p>

                                <input 
                                    type="text" 
                                    maxLength={6}
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="w-full text-center text-4xl font-black tracking-[0.5em] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all mb-6"
                                />

                                <button 
                                    onClick={handleSign}
                                    disabled={isSubmitting || twoFactorCode.length !== 6}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={20} />}
                                    {isSubmitting ? "Autenticando..." : "Confirmar Assinatura"}
                                </button>

                                <button onClick={() => setStep('reading')} className="mt-4 text-sm font-bold text-slate-500 hover:text-slate-700">
                                    Voltar para o documento
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-20">
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Assinado com Sucesso!</h2>
                                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                                    Sua assinatura eletrônica tem validade jurídica garantida por lei. Você receberá uma cópia do documento assinado em seu e-mail assim que todas as partes concluírem o processo.
                                </p>
                                <button className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                                    <Download size={18} /> Baixar Cópia (Prévia)
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Refused */}
                    {step === 'refused' && (
                        <motion.div key="refused" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-20">
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center">
                                <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <XCircle size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Processo Interrompido</h2>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Você recusou ou solicitou alterações neste documento. O emissor foi notificado e entrará em contato em breve.
                                </p>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            {/* Change Request Modal */}
            <AnimatePresence>
                {showChangeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Solicitar Alteração</h3>
                            {activeClauseId ? (
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                                    <p className="text-xs font-bold text-amber-800 uppercase">Referência: {clauses.find(c => c.id === activeClauseId)?.title}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 mb-4">Descreva detalhadamente as alterações gerais que você solicita no documento.</p>
                            )}
                            
                            <textarea 
                                value={changeRequestText}
                                onChange={(e) => setChangeRequestText(e.target.value)}
                                className="w-full h-32 p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none mb-4"
                                placeholder={activeClauseId ? "Sua sugestão de alteração para esta cláusula específica..." : "Sua sugestão geral..."}
                            />
                            
                            <div className="flex justify-end gap-3">
                                <button onClick={() => { setShowChangeModal(false); setActiveClauseId(null); setChangeRequestText(""); }} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                                <button onClick={handleRequestChangeSubmit} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">Salvar Ressalva</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
