"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building, Save, MapPin, Phone, Mail } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { institutionalService, InstitutionalProfile } from "@/services/institutional.service";

const maskCNPJ = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .substring(0, 18);
};

const maskCEP = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/^(\d{5})(\d)/, "$1-$2")
        .substring(0, 9);
};

const maskPhone = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 10) {
        v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    }
    return v;
};

export default function CompanyGeneralSettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form data state
    const [formData, setFormData] = useState<InstitutionalProfile>({
        companyName: "", tradeName: "", cnpj: "", stateRegistration: "", municipalRegistration: "",
        cnae: "", taxRegime: "presumido", zipCode: "", street: "", number: "", complement: "",
        neighborhood: "", city: "", state: "", phone: "", email: ""
    });

    const [branches, setBranches] = useState([
        { id: '1', name: 'Filial São Paulo (SP)', cnpj: '12.345.678/0002-99', city: 'São Paulo', state: 'SP' }
    ]);
    const [showBranchModal, setShowBranchModal] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await institutionalService.get();
            if (res.success && res.data) {
                const d = res.data;
                setFormData({
                    companyName: d.companyName || "", tradeName: d.tradeName || "", cnpj: d.cnpj || "",
                    stateRegistration: d.stateRegistration || "", municipalRegistration: d.municipalRegistration || "",
                    cnae: d.cnae || "", taxRegime: d.taxRegime || "presumido", zipCode: d.zipCode || "",
                    street: d.street || "", number: d.number || "", complement: d.complement || "",
                    neighborhood: d.neighborhood || "", city: d.city || "", state: d.state || "",
                    phone: d.phone || "", email: d.email || ""
                });
            }
        } catch (e) {
            toast.error("Erro", "Falha ao carregar dados da empresa.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // We load current full data just to not override partners
            const currRes = await institutionalService.get();
            const currPartners = currRes.success && currRes.data ? currRes.data.partners : [];
            
            const res = await institutionalService.update({ ...formData, partners: currPartners });
            if (res.success) {
                toast.success("Sucesso", "Dados principais atualizados!");
            } else {
                toast.error("Erro", res.message || "Falha ao salvar dados.");
            }
        } catch (e) {
            toast.error("Erro", "Erro de conexão ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = maskCEP(e.target.value);
        setFormData(prev => ({ ...prev, zipCode: val }));
        
        const cleanCEP = val.replace(/\D/g, "");
        if (cleanCEP.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        street: data.logradouro || prev.street,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state,
                    }));
                    toast.success("CEP Encontrado", "Endereço preenchido automaticamente.");
                }
            } catch (err) {
                // Ignore error silently for the user
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-end mb-4">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                >
                    {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                </button>
            </div>

            {/* Section: Identificação */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-4 py-1 bg-indigo-500 text-white text-[10px] font-bold uppercase rounded-bl-xl shadow-lg shadow-indigo-500/20">Matriz</div>
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <Building size={16} className="text-rose-400" /> Identificação Fiscal da Matriz
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Razão Social</label>
                        <input type="text" value={formData.companyName || ""} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Nome Fantasia</label>
                        <input type="text" value={formData.tradeName || ""} onChange={e => setFormData({...formData, tradeName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">CNPJ</label>
                        <input type="text" value={formData.cnpj || ""} onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono" placeholder="00.000.000/0001-00" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Inscrição Estadual</label>
                            <input type="text" value={formData.stateRegistration || ""} onChange={e => setFormData({...formData, stateRegistration: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Inscrição Municipal</label>
                            <input type="text" value={formData.municipalRegistration || ""} onChange={e => setFormData({...formData, municipalRegistration: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">CNAE Principal</label>
                        <input type="text" value={formData.cnae || ""} onChange={e => setFormData({...formData, cnae: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Regime Tributário</label>
                        <select value={formData.taxRegime || "presumido"} onChange={e => setFormData({...formData, taxRegime: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                            <option value="simples">Simples Nacional</option>
                            <option value="presumido">Lucro Presumido</option>
                            <option value="real">Lucro Real</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Section: Endereço & Contato */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-400" /> Endereço e Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
                    <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">CEP</label>
                        <input type="text" value={formData.zipCode || ""} onChange={handleCEPChange} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono" placeholder="00000-000" />
                    </div>
                    <div className="md:col-span-7 space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Logradouro</label>
                        <input type="text" value={formData.street || ""} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Número</label>
                        <input type="text" value={formData.number || ""} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="md:col-span-4 space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Complemento</label>
                        <input type="text" value={formData.complement || ""} onChange={e => setFormData({...formData, complement: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Bairro</label>
                        <input type="text" value={formData.neighborhood || ""} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Cidade</label>
                        <input type="text" value={formData.city || ""} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">UF</label>
                        <input type="text" value={formData.state || ""} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-white/[0.04]">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Phone size={12}/> Telefone Principal</label>
                        <input type="text" value={formData.phone || ""} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" placeholder="(11) 99999-9999" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Mail size={12}/> E-mail Financeiro/NF</label>
                        <input type="email" value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                </div>
            </div>

            {/* Section: Filiais */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Building size={16} className="text-emerald-400" /> Filiais Cadastradas
                    </h3>
                    <button onClick={() => setShowBranchModal(true)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-900/20">
                        + Adicionar Filial
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {branches.map(branch => (
                        <div key={branch.id} className="p-5 bg-slate-900/50 border border-white/[0.06] hover:border-white/20 transition-all rounded-2xl relative group cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                                <MapPin size={20} />
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1">{branch.name}</h4>
                            <p className="text-xs text-slate-500 font-mono mb-3">{branch.cnpj}</p>
                            <span className="px-2.5 py-1 bg-slate-800 rounded-md text-[10px] font-bold text-slate-400">{branch.city} / {branch.state}</span>
                        </div>
                    ))}
                    {branches.length === 0 && (
                        <div className="col-span-full p-8 text-center border-2 border-dashed border-white/[0.05] rounded-2xl text-slate-500">
                            Nenhuma filial cadastrada.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Filial (Mock) */}
            {showBranchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-white/[0.06] rounded-2xl shadow-2xl p-6 w-full max-w-2xl">
                        <h3 className="text-lg font-bold text-white mb-6">Nova Filial</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Nome de Identificação</label>
                                <input type="text" placeholder="Ex: Filial Rio de Janeiro" className="w-full px-4 py-2.5 bg-slate-800 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">CNPJ da Filial</label>
                                <input type="text" placeholder="00.000.000/0002-00" className="w-full px-4 py-2.5 bg-slate-800 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono" onChange={e => e.target.value = maskCNPJ(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Cidade</label>
                                <input type="text" placeholder="Rio de Janeiro" className="w-full px-4 py-2.5 bg-slate-800 border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowBranchModal(false)} className="px-5 py-2.5 text-slate-400 font-bold hover:bg-slate-800 rounded-xl transition-colors text-sm">Cancelar</button>
                            <button onClick={() => {
                                toast.success("Filial salva", "Os dados da filial foram registrados.");
                                setBranches([...branches, { id: '2', name: 'Nova Filial', cnpj: '00.000.000/0002-00', city: 'Rio de Janeiro', state: 'RJ' }]);
                                setShowBranchModal(false);
                            }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-blue-600/20">Salvar Filial</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
