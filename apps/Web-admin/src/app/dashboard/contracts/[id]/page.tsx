"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
    ChevronLeft, Send, XCircle, Download, FileSignature, 
    History, MessageSquare, Clock, CheckCircle2, User, FileText, DownloadCloud, DollarSign, Users,
    ShieldCheck, Archive, Mail
} from "lucide-react";

import { contractsMockService, Contract } from "@/services/mock/contracts.mock";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ContractDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { toast } = useToast();
    const [contract, setContract] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'negotiation'>('details');

    useEffect(() => {
        const load = async () => {
            const res = await contractsMockService.getContractById(resolvedParams.id);
            if (res.success && res.data) {
                setContract(res.data);
            } else {
                toast.error("Erro", "Falha ao carregar o contrato.");
            }
            setIsLoading(false);
        };
        load();
    }, [resolvedParams.id]);

    const handleSendForSignature = () => {
        toast.success("Sucesso", "Contrato enviado para assinatura via E-mail e WhatsApp!");
        if (contract) setContract({ ...contract, status: 'signing' });
    };

    const handleDownload = () => {
        toast.success("Info", "Iniciando download do PDF...");
    };

    const handleCancel = () => {
        if (confirm("Tem certeza que deseja cancelar este contrato?")) {
            toast.success("Cancelado", "O contrato foi cancelado com sucesso.");
            if (contract) setContract({ ...contract, status: 'cancelled' });
        }
    };

    const handleResendReminders = () => {
        toast.success("Enviado", "Lembretes reenviados para assinantes pendentes.");
    };

    const handleArchive = () => {
        if (confirm("Tem certeza que deseja arquivar este contrato?")) {
            toast.success("Arquivado", "O contrato foi movido para o arquivo.");
            if (contract) setContract({ ...contract, status: 'archived' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!contract) {
        return <div className="p-10 text-center text-white">Contrato não encontrado.</div>;
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-start gap-4">
                    <Link href="/dashboard/contracts" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors mt-1">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-white tracking-tight">{contract.contractorName}</h1>
                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {contract.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400">Contrato #{contract.number} • Criado em {format(new Date(contract.createdAt), "dd/MM/yyyy")}</p>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap justify-end">
                    {contract.status === 'signing' && (
                        <button onClick={handleResendReminders} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all border border-white/5 flex items-center gap-2">
                            <Mail size={16} /> Reenviar Lembretes
                        </button>
                    )}
                    
                    <button onClick={handleDownload} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg border border-white/5 flex items-center gap-2">
                        <DownloadCloud size={16} /> PDF
                    </button>

                    <Link href={`/dashboard/contracts/${contract.id}/evidences`} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg border border-white/5 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-400" /> Evidências
                    </Link>

                    {contract.status === 'signed' && (
                        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg border border-white/5 flex items-center gap-2">
                            <FileText size={16} /> Criar Aditivo
                        </button>
                    )}

                    {contract.status !== 'signed' && contract.status !== 'cancelled' && contract.status !== 'archived' && (
                        <button onClick={handleCancel} className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-sm font-bold transition-all border border-rose-500/20 flex items-center gap-2">
                            <XCircle size={16} /> Cancelar
                        </button>
                    )}

                    {(contract.status === 'signed' || contract.status === 'cancelled') && (
                        <button onClick={handleArchive} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-all border border-white/5 flex items-center gap-2">
                            <Archive size={16} /> Arquivar
                        </button>
                    )}

                    {contract.status !== 'signed' && contract.status !== 'cancelled' && contract.status !== 'archived' && (
                        <button onClick={handleSendForSignature} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                            <Send size={16} /> Enviar p/ Assinar
                        </button>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 mb-8">
                <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Status do Contrato</h3>
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-10" />
                    
                    {/* Status Nodes */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-indigo-600 text-white flex items-center justify-center"><CheckCircle2 size={16}/></div>
                        <span className="text-xs font-bold text-indigo-400">Rascunho</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${contract.status === 'review' || contract.status === 'sent' || contract.status === 'signing' || contract.status === 'signed' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                            {contract.status === 'review' || contract.status === 'sent' || contract.status === 'signing' || contract.status === 'signed' ? <CheckCircle2 size={16}/> : <FileSignature size={16}/>}
                        </div>
                        <span className={`text-xs font-bold ${contract.status === 'review' || contract.status === 'sent' || contract.status === 'signing' || contract.status === 'signed' ? 'text-indigo-400' : 'text-slate-500'}`}>Enviado</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${contract.status === 'signing' || contract.status === 'signed' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                            {contract.status === 'signing' || contract.status === 'signed' ? <CheckCircle2 size={16}/> : <Users size={16}/>}
                        </div>
                        <span className={`text-xs font-bold ${contract.status === 'signing' || contract.status === 'signed' ? 'text-indigo-400' : 'text-slate-500'}`}>Em Assinatura</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${contract.status === 'signed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                            {contract.status === 'signed' ? <CheckCircle2 size={16}/> : <CheckCircle2 size={16}/>}
                        </div>
                        <span className={`text-xs font-bold ${contract.status === 'signed' ? 'text-emerald-400' : 'text-slate-500'}`}>Assinado</span>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex border-b border-white/[0.06] mb-6">
                <button 
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'details' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Detalhes do Contrato
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'history' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Histórico & Versões
                </button>
                <button 
                    onClick={() => setActiveTab('negotiation')}
                    className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'negotiation' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Negociação (Alterações)
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        {/* Objeto e Info */}
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><FileText size={18} className="text-indigo-400"/> Objeto</h3>
                            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                {contract.objectDescription}
                            </p>
                        </div>
                        
                        {/* Financeiro */}
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><DollarSign size={18} className="text-emerald-400"/> Financeiro</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Valor Total</span>
                                    <p className="text-lg font-bold text-white mt-1">{formatCurrency(contract.value)}</p>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Pagamento</span>
                                    <p className="text-lg font-bold text-white mt-1">{contract.paymentMethod}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Signers Status */}
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Users size={18} className="text-indigo-400"/> Assinantes</h3>
                            <div className="space-y-4">
                                {contract.signers.map(signer => (
                                    <div key={signer.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-sm font-bold text-white">{signer.name}</p>
                                            <p className="text-[10px] uppercase font-bold text-slate-500">{signer.role}</p>
                                        </div>
                                        {signer.status === 'signed' ? (
                                            <div className="flex flex-col items-end">
                                                <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400">Assinou</span>
                                                <span className="text-[9px] text-slate-500 mt-1">{signer.signedAt && format(new Date(signer.signedAt), "dd/MM/yy HH:mm")}</span>
                                            </div>
                                        ) : (
                                            <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-400">Pendente</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Prazos */}
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Clock size={18} className="text-rose-400"/> Prazos Limite</h3>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Expira em</span>
                                <p className="text-lg font-bold text-white mt-1">{format(new Date(contract.signingDeadline), "dd/MM/yyyy")}</p>
                                <p className="text-xs text-rose-400 mt-2">Sem assinaturas após esta data, o contrato é cancelado.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="relative pl-6 border-l-2 border-slate-700 space-y-8">
                        {/* Fake History */}
                        <div className="relative">
                            <div className="absolute w-4 h-4 bg-indigo-600 rounded-full -left-[33px] top-1 border-4 border-slate-900" />
                            <p className="text-sm font-bold text-white">Contrato Enviado para Assinatura</p>
                            <p className="text-xs text-slate-500 mt-1">20/05/2026 às 15:30 • Por Você</p>
                        </div>
                        <div className="relative">
                            <div className="absolute w-4 h-4 bg-slate-600 rounded-full -left-[33px] top-1 border-4 border-slate-900" />
                            <p className="text-sm font-bold text-white">Nova Versão Gerada (v1.2)</p>
                            <p className="text-xs text-slate-500 mt-1">20/05/2026 às 14:45 • Por Você</p>
                            <div className="p-3 bg-slate-900 border border-white/5 rounded-xl mt-2 text-xs text-slate-400">
                                Cláusula 4.1 modificada a pedido do contratante.
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute w-4 h-4 bg-slate-600 rounded-full -left-[33px] top-1 border-4 border-slate-900" />
                            <p className="text-sm font-bold text-white">Contrato Criado</p>
                            <p className="text-xs text-slate-500 mt-1">20/05/2026 às 10:00 • Por Você</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'negotiation' && (
                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Solicitações de Alteração</h3>
                    
                    <div className="space-y-6">
                        {/* Mock de uma solicitação de alteração */}
                        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-400 mb-2 inline-block">Pendente</span>
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <FileText size={16} className="text-slate-400"/> Ref: CLÁUSULA 5 - DA RESCISÃO
                                    </h4>
                                </div>
                                <span className="text-[10px] text-slate-500">Há 2 horas</span>
                            </div>
                            
                            <div className="bg-slate-800 p-4 rounded-xl border border-white/5 mb-4 relative">
                                <div className="absolute w-1 h-full bg-indigo-500 left-0 top-0 rounded-l-xl" />
                                <p className="text-xs font-bold text-indigo-400 mb-1">Ressalva do Cliente (Tech Inovações):</p>
                                <p className="text-sm text-slate-300">"Gostaríamos de alterar o prazo de notificação de rescisão de 30 dias para 60 dias para maior segurança de ambas as partes."</p>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => toast.success("Sucesso", "Alteração aceita. Uma nova versão do contrato será gerada.")} className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all">
                                    Aceitar Alteração
                                </button>
                                <button onClick={() => toast.success("Enviado", "Contraproposta enviada para o cliente.")} className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all">
                                    Sugerir Contraproposta
                                </button>
                                <button onClick={() => toast.error("Recusado", "A solicitação foi negada e o cliente notificado.")} className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all">
                                    Negar
                                </button>
                            </div>
                        </div>

                        {/* Histórico Resolvido */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 opacity-70">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 mb-2 inline-block">Resolvido (Aceito)</span>
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <FileText size={16} className="text-slate-400"/> Ref: CLÁUSULA 2 - VALORES
                                    </h4>
                                </div>
                                <span className="text-[10px] text-slate-500">Ontem</span>
                            </div>
                            
                            <div className="bg-slate-800 p-4 rounded-xl border border-white/5 mb-4 relative">
                                <div className="absolute w-1 h-full bg-indigo-500 left-0 top-0 rounded-l-xl" />
                                <p className="text-xs font-bold text-indigo-400 mb-1">Ressalva do Cliente (Tech Inovações):</p>
                                <p className="text-sm text-slate-300">"Podemos alterar a forma de pagamento para Boleto Bancário?"</p>
                            </div>

                            <div className="bg-slate-800 p-4 rounded-xl border border-white/5 relative">
                                <div className="absolute w-1 h-full bg-emerald-500 left-0 top-0 rounded-l-xl" />
                                <p className="text-xs font-bold text-emerald-400 mb-1">Nossa Resposta:</p>
                                <p className="text-sm text-slate-300">Aceito. O contrato já foi atualizado para Boleto (Versão 1.2).</p>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
