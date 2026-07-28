"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Loader2, Plus, Settings, FileText, Ban, CheckCircle2, AlertCircle, Search } from "lucide-react";

interface TaxInvoice {
    id: string;
    clientName: string;
    clientDocument: string;
    serviceDescription: string;
    value: number;
    status: string; // emitted, cancelled
    issueDate: string;
}

import { institutionalService, InstitutionalProfile } from "@/services/institutional.service";

export default function InvoicesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
    const [certData, setCertData] = useState<InstitutionalProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 10;

    const loadData = async () => {
        try {
            setLoading(true);
            const [res, certRes] = await Promise.all([
                api<TaxInvoice[]>("/api/financial/tax-invoices"),
                institutionalService.get()
            ]);
            if (res.success && res.data) {
                setInvoices(res.data);
            }
            if (certRes.success && certRes.data) {
                setCertData(certRes.data);
            }
        } catch {
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCancel = async (id: string) => {
        if (!confirm("Tem certeza que deseja cancelar esta Nota Fiscal?")) return;
        try {
            const res = await api(`/api/financial/tax-invoices/${id}`, { method: "DELETE" });
            if (res.success) {
                toast.success("Nota cancelada com sucesso!");
                loadData();
            } else {
                toast.error("Erro ao cancelar nota");
            }
        } catch {
            toast.error("Erro interno");
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
    }

    const emittedInvoices = invoices.filter(i => i.status === 'emitted');
    const totalEmitted = emittedInvoices.reduce((acc, curr) => acc + curr.value, 0);
    const estimatedTaxes = totalEmitted * 0.06; // Média 6% SIMPLES

    const filteredInvoices = invoices.filter(i => 
        i.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.clientDocument.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const paginatedInvoices = filteredInvoices.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            
            {/* Cert Alert */}
            {!certData?.certFilename && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl shrink-0">
                        <AlertCircle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-amber-400 font-bold mb-1">Atenção: Certificado Digital Ausente</h3>
                        <p className="text-amber-500/80 text-sm mb-3">Para emitir notas fiscais de serviço (NFS-e), você precisa instalar o Certificado Digital A1 da empresa.</p>
                        <button 
                            onClick={() => router.push("/dashboard/management/settings/company/certificate")}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs rounded-lg transition-colors"
                        >
                            Configurar Certificado Agora
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Notas Fiscais</h1>
                <p className="text-slate-400">Emissão e gestão de notas de serviço (NFS-e).</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/60 border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><CheckCircle2 size={20} /></div>
                        <h3 className="text-slate-300 font-medium">Total Emitido</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEmitted)}</p>
                </div>
                <div className="bg-slate-800/60 border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><FileText size={20} /></div>
                        <h3 className="text-slate-300 font-medium">Notas Validadas</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{emittedInvoices.length}</p>
                </div>
                <div className="bg-slate-800/60 border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center"><AlertCircle size={20} /></div>
                        <h3 className="text-slate-300 font-medium">Impostos Estimados</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedTaxes)}</p>
                    <p className="text-xs text-slate-500 mt-2">Média de 6% sobre o faturamento</p>
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    onClick={() => certData?.certFilename ? router.push("/dashboard/financial/invoices/new") : toast.error("Certificado não configurado", "Você precisa instalar o certificado A1 primeiro.")}
                    className={`${certData?.certFilename ? 'bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 cursor-pointer group' : 'bg-slate-800/20 border-slate-700/30 opacity-50 cursor-not-allowed'} border p-6 rounded-3xl transition-colors flex items-center gap-6`}
                >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-transform ${certData?.certFilename ? 'bg-blue-500 shadow-lg shadow-blue-500/30 group-hover:scale-110' : 'bg-slate-700'}`}>
                        {certData?.certFilename ? <Plus size={32} /> : <Ban size={32} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Emitir Nota Fiscal</h3>
                        <p className={`${certData?.certFilename ? 'text-blue-200/70' : 'text-slate-500'} text-sm`}>
                            {certData?.certFilename ? "Preencha os dados e gere uma nova nota de serviço para seu cliente." : "Requer configuração do certificado."}
                        </p>
                    </div>
                </div>

                <div 
                    onClick={() => router.push("/dashboard/management/settings/company/certificate")}
                    className="bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-slate-600 p-6 rounded-3xl cursor-pointer transition-colors group flex items-center gap-6"
                >
                    <div className="w-16 h-16 rounded-full bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                        <Settings size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Configurações Fiscais</h3>
                        <p className="text-slate-400 text-sm">Gerencie seu Certificado Digital A1 e a integração com a prefeitura.</p>
                    </div>
                </div>
            </div>

            {/* Histórico */}
            <div className="bg-slate-800/40 border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-white">Histórico de Notas</h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente ou documento..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
                {filteredInvoices.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        {invoices.length === 0 ? "Nenhuma nota fiscal foi emitida ainda." : "Nenhuma nota encontrada para a busca."}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/50">
                                    <th className="p-4 font-medium">Cliente</th>
                                    <th className="p-4 font-medium">Data Emissão</th>
                                    <th className="p-4 font-medium">Valor</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedInvoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="p-4">
                                            <p className="text-white font-medium">{invoice.clientName}</p>
                                            <p className="text-xs text-slate-500">{invoice.clientDocument}</p>
                                        </td>
                                        <td className="p-4 text-slate-300 text-sm">
                                            {new Date(invoice.issueDate).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4 text-white font-medium">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.value)}
                                        </td>
                                        <td className="p-4">
                                            {invoice.status === 'emitted' ? (
                                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded uppercase">Emitida</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded uppercase">Cancelada</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {invoice.status === 'emitted' && (
                                                <button 
                                                    onClick={() => handleCancel(invoice.id)}
                                                    className="text-slate-500 hover:text-red-400 flex items-center gap-1 justify-end w-full text-sm font-medium transition-colors"
                                                >
                                                    <Ban size={14} /> Cancelar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Pagination controls */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-white/5 flex justify-center items-center gap-4 bg-slate-900/30">
                                <button 
                                    disabled={currentPage === 0}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors text-sm"
                                >
                                    Anterior
                                </button>
                                <span className="text-slate-400 text-sm">Página {currentPage + 1} de {totalPages}</span>
                                <button 
                                    disabled={currentPage >= totalPages - 1}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors text-sm"
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}
