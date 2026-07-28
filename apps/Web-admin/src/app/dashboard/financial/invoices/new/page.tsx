"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { ChevronLeft, Loader2, FileText, CheckCircle2, User, Building, MapPin, AlignLeft, AlertCircle, Search } from "lucide-react";
import Link from "next/link";

export default function NewInvoicePage() {
    const router = useRouter();
    const { toast } = useToast();

    const [clientName, setClientName] = useState("");
    const [clientDocument, setClientDocument] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [clientCep, setClientCep] = useState("");
    const [clientAddress, setClientAddress] = useState("");
    const [clientNeighborhood, setClientNeighborhood] = useState("");
    const [clientCity, setClientCity] = useState("");
    const [clientState, setClientState] = useState("");
    
    const [serviceDescription, setServiceDescription] = useState("");
    const [valueStr, setValueStr] = useState("");
    const [impostoRetido, setImpostoRetido] = useState("false");
    const [isEmitting, setIsEmitting] = useState(false);

    // Auto-complete de Empresas
    const [companies, setCompanies] = useState<any[]>([]);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Carrega as empresas ao montar
        api<any[]>("/api/companies").then(res => {
            if (res.success && res.data) {
                setCompanies(res.data);
            }
        });

        // Fechar dropdown ao clicar fora
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCompanyDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCompanies = clientName.trim() === "" 
        ? [] 
        : companies.filter(c => c.name.toLowerCase().includes(clientName.toLowerCase()));

    const handleSelectCompany = (company: any) => {
        setClientName(company.name);
        setClientDocument(company.cnpj || "");
        if (company.city) setClientCity(company.city);
        if (company.state) setClientState(company.state);
        if (company.address) setClientAddress(company.address);
        setShowCompanyDropdown(false);
    };

    // Auto-preenchimento de CEP simples
    const handleCepChange = async (cep: string) => {
        setClientCep(cep);
        const cleanCep = cep.replace(/\D/g, "");
        if (cleanCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setClientAddress(data.logradouro);
                    setClientNeighborhood(data.bairro);
                    setClientCity(data.localidade);
                    setClientState(data.uf);
                }
            } catch (e) {
                // Ignore error silently
            }
        }
    };

    const handleEmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsEmitting(true);
            const value = parseFloat(valueStr.replace(/\./g, "").replace(",", "."));
            
            const res = await api("/api/financial/tax-invoices", {
                method: "POST",
                body: { 
                    clientName, 
                    clientDocument, 
                    clientEmail,
                    clientAddress: {
                        cep: clientCep,
                        street: clientAddress,
                        neighborhood: clientNeighborhood,
                        city: clientCity,
                        state: clientState
                    },
                    serviceDescription, 
                    value,
                    impostoRetido: impostoRetido === "true"
                }
            });

            if (res.success) {
                toast.success("Nota Fiscal emitida com sucesso!");
                router.push("/dashboard/financial/invoices");
            } else {
                toast.error(res.error?.message || "Erro ao emitir nota");
            }
        } catch {
            toast.error("Erro interno ao emitir");
        } finally {
            setIsEmitting(false);
        }
    };

    const previewValue = parseFloat(valueStr.replace(/\./g, "").replace(",", ".")) || 0;
    const estimatedTax = previewValue * 0.06;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <Link href="/dashboard/financial/invoices" className="text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        Nova Nota Fiscal de Serviço
                    </h1>
                    <p className="text-slate-400 text-sm">Preencha os dados do cliente e os detalhes do serviço prestado.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulário Profissional */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleEmit} className="space-y-8 bg-slate-800/40 border border-white/5 rounded-3xl p-8">
                        
                        {/* Seção Cliente */}
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <User size={20} className="text-blue-400" /> Dados do Tomador (Cliente)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2 relative" ref={dropdownRef}>
                                    <label className="block text-sm font-medium text-slate-300">Razão Social / Nome</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input 
                                            type="text" 
                                            required 
                                            value={clientName} 
                                            onChange={e => {
                                                setClientName(e.target.value);
                                                setShowCompanyDropdown(true);
                                            }} 
                                            onFocus={() => setShowCompanyDropdown(true)}
                                            placeholder="Ex: Acme Corp LTDA" 
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
                                        />
                                    </div>
                                    
                                    {/* Dropdown Autocomplete */}
                                    {showCompanyDropdown && filteredCompanies.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                            {filteredCompanies.map(company => (
                                                <div 
                                                    key={company.id}
                                                    onClick={() => handleSelectCompany(company)}
                                                    className="px-4 py-3 hover:bg-blue-600/20 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                                                >
                                                    <p className="text-white font-medium">{company.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono mt-1">{company.cnpj || "Sem CNPJ"}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-300">CPF ou CNPJ</label>
                                    <input type="text" required value={clientDocument} onChange={e => setClientDocument(e.target.value)} placeholder="00.000.000/0001-00" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-300">E-mail do Cliente (Opcional)</label>
                                    <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="contato@cliente.com.br" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
                                </div>
                            </div>

                            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                                <MapPin size={16} /> Endereço (Obrigatório pela Prefeitura)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-300">CEP</label>
                                    <input type="text" required value={clientCep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-300">Logradouro (Rua/Av)</label>
                                    <input type="text" required value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Av. Paulista, 1000" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-300">Bairro</label>
                                    <input type="text" required value={clientNeighborhood} onChange={e => setClientNeighborhood(e.target.value)} placeholder="Centro" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-300">Cidade</label>
                                    <input type="text" required value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="São Paulo" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-300">Estado (UF)</label>
                                    <input type="text" required value={clientState} onChange={e => setClientState(e.target.value)} placeholder="SP" maxLength={2} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow uppercase" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Seção Serviço */}
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-emerald-400" /> Detalhes do Serviço
                            </h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-300">Valor Bruto do Serviço (R$)</label>
                                        <input type="text" required value={valueStr} onChange={e => setValueStr(e.target.value)} placeholder="Ex: 5000,00" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-xl font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-300">ISS Retido pelo Tomador?</label>
                                        <select value={impostoRetido} onChange={e => setImpostoRetido(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow h-[52px]">
                                            <option value="false">Não (Normal)</option>
                                            <option value="true">Sim (Retido)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-300">Discriminação dos Serviços</label>
                                    <div className="relative">
                                        <AlignLeft className="absolute left-3 top-4 w-5 h-5 text-slate-500" />
                                        <textarea required value={serviceDescription} onChange={e => setServiceDescription(e.target.value)} rows={5} placeholder="Descreva detalhadamente o serviço prestado..." className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-shadow" />
                                    </div>
                                    <p className="text-xs text-slate-500">Esta descrição aparecerá exatamente assim na nota fiscal gerada pela prefeitura.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-4">
                            <Link href="/dashboard/financial/invoices" className="px-6 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors">
                                Cancelar
                            </Link>
                            <button type="submit" disabled={isEmitting} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center gap-2">
                                {isEmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                Transmitir Nota Fiscal
                            </button>
                        </div>
                    </form>
                </div>

                {/* Resumo Lateral (Preview) */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-6 sticky top-8">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
                            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Resumo da Nota</h3>
                                <p className="text-xs text-slate-400">Simulação de emissão</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Tomador:</span>
                                <span className="text-white font-medium truncate max-w-[150px]">{clientName || "Não informado"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Documento:</span>
                                <span className="text-white font-medium">{clientDocument || "Não informado"}</span>
                            </div>
                            
                            <hr className="border-white/5 my-4" />
                            
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Valor Bruto:</span>
                                <span className="text-white font-bold text-lg">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(previewValue)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Estimativa de Impostos (6%):</span>
                                <span className="text-orange-400">
                                    - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedTax)}
                                </span>
                            </div>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mt-6">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-emerald-400 font-medium">Valor Líquido Estimado</span>
                                </div>
                                <span className="text-emerald-400 font-bold text-2xl">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(previewValue - estimatedTax)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl flex gap-3 text-xs text-blue-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400" />
                            <p>Ao clicar em "Transmitir", a nota será gerada imediatamente e não poderá ser alterada, apenas cancelada.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
