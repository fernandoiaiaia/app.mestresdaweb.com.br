"use client";

import { ChevronLeft, KeyRound, Building2, ShieldCheck, FileCheck2 } from "lucide-react";
import Link from "next/link";

export default function InvoiceSettingsPage() {
    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <Link href="/dashboard/financial/invoices" className="text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        Configurações Fiscais
                    </h1>
                    <p className="text-slate-400 text-sm">Gerencie certificados digitais e integrações com prefeituras.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Certificado Digital */}
                <div className="bg-slate-800/40 border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
                    <div>
                        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                            <KeyRound size={28} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Certificado Digital A1</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            O certificado digital é necessário para assinar e transmitir as notas fiscais eletrônicas de forma legal e segura.
                        </p>
                        
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-500/20 flex items-center gap-4 mb-6">
                            <ShieldCheck className="text-emerald-400 w-8 h-8 flex-shrink-0" />
                            <div>
                                <p className="text-emerald-400 font-medium text-sm">Certificado Ativo</p>
                                <p className="text-slate-500 text-xs">Válido até 12/05/2027</p>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors">
                        Atualizar Certificado
                    </button>
                </div>

                {/* Integração Prefeitura */}
                <div className="bg-slate-800/40 border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
                    <div>
                        <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                            <Building2 size={28} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Dados da Prefeitura</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Configure seu código de tributação municipal e a senha web da sua prefeitura para permitir a emissão automática.
                        </p>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Município</span>
                                <span className="text-white font-medium">São Paulo - SP</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Inscrição Municipal</span>
                                <span className="text-white font-medium">12.345.678-9</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Cód. Tributação</span>
                                <span className="text-white font-medium">01.01 (Análise Dev.)</span>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2">
                        <FileCheck2 size={18} />
                        Editar Dados Municipais
                    </button>
                </div>

            </div>
        </div>
    );
}
