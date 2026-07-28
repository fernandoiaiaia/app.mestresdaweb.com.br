"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building, MapPin, FileText } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { companyBranchesService, CompanyBranch } from "@/services/company-branches.service";

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

export default function CompanyBranchesPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    
    // Branches state
    const [branches, setBranches] = useState<CompanyBranch[]>([]);
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Partial<CompanyBranch>>({});
    const [isSavingBranch, setIsSavingBranch] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const branchesRes = await companyBranchesService.list();
            if (branchesRes.success && branchesRes.data) {
                setBranches(branchesRes.data);
            }
        } catch (e) {
            toast.error("Erro", "Falha ao carregar as filiais.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveBranch = async () => {
        if (!editingBranch.name) {
            toast.error("Atenção", "O nome da filial é obrigatório.");
            return;
        }

        setIsSavingBranch(true);
        try {
            if (editingBranch.id) {
                const res = await companyBranchesService.update(editingBranch.id, editingBranch);
                if (res.success) toast.success("Sucesso", "Filial atualizada.");
            } else {
                const res = await companyBranchesService.create(editingBranch);
                if (res.success) toast.success("Sucesso", "Filial adicionada.");
            }
            setShowBranchForm(false);
            setEditingBranch({});
            
            // Reload branches
            const branchesRes = await companyBranchesService.list();
            if (branchesRes.success && branchesRes.data) {
                setBranches(branchesRes.data);
            }
        } catch (e) {
            toast.error("Erro", "Falha ao salvar filial.");
        } finally {
            setIsSavingBranch(false);
        }
    };

    const handleDeleteBranch = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta filial?")) return;
        try {
            await companyBranchesService.delete(id);
            toast.success("Sucesso", "Filial removida.");
            setBranches(branches.filter(b => b.id !== id));
        } catch (e) {
            toast.error("Erro", "Falha ao remover filial.");
        }
    };

    const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = maskCEP(e.target.value);
        setEditingBranch(prev => ({ ...prev, zipCode: val }));
        
        const cleanCEP = val.replace(/\D/g, "");
        if (cleanCEP.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setEditingBranch(prev => ({
                        ...prev,
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state,
                    }));
                    toast.success("CEP Encontrado", "Endereço preenchido automaticamente.");
                }
            } catch (err) {
                // Ignore error silently
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
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <MapPin size={20} className="text-blue-400" /> Filiais
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Gerencie os dados específicos de cada unidade ou filial da empresa.</p>
                    </div>
                    <button 
                        onClick={() => {
                            setEditingBranch({});
                            setShowBranchForm(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                        + Nova Filial
                    </button>
                </div>

                <AnimatePresence>
                    {showBranchForm && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 mb-8 bg-slate-900 border border-white/10 rounded-2xl space-y-5">
                                <h4 className="text-base font-bold text-white">{editingBranch.id ? 'Editar Filial' : 'Nova Filial'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] uppercase text-slate-500 font-bold block">Nome da Filial (Apelido)</label>
                                        <input type="text" value={editingBranch.name || ""} onChange={e => setEditingBranch({...editingBranch, name: e.target.value})} className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white" placeholder="Ex: Filial Sul" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] uppercase text-slate-500 font-bold block">CNPJ da Filial</label>
                                        <input type="text" value={editingBranch.cnpj || ""} onChange={e => setEditingBranch({...editingBranch, cnpj: maskCNPJ(e.target.value)})} className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white font-mono" placeholder="00.000.000/0002-00" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[11px] uppercase text-slate-500 font-bold block">Razão Social (Opcional)</label>
                                        <input type="text" value={editingBranch.companyName || ""} onChange={e => setEditingBranch({...editingBranch, companyName: e.target.value})} className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] uppercase text-slate-500 font-bold block">Inscrição Estadual</label>
                                        <input type="text" value={editingBranch.stateRegistration || ""} onChange={e => setEditingBranch({...editingBranch, stateRegistration: e.target.value})} className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] uppercase text-slate-500 font-bold block">Inscrição Municipal</label>
                                        <input type="text" value={editingBranch.municipalRegistration || ""} onChange={e => setEditingBranch({...editingBranch, municipalRegistration: e.target.value})} className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white" />
                                    </div>
                                </div>

                                <h5 className="text-[11px] uppercase text-slate-500 font-bold border-t border-white/5 pt-4">Endereço da Filial</h5>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] uppercase text-slate-500 font-bold block">CEP</label>
                                        <input type="text" value={editingBranch.zipCode || ""} onChange={handleCEPChange} className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white" placeholder="00000-000" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[11px] uppercase text-slate-500 font-bold block">Cidade</label>
                                        <input type="text" value={editingBranch.city || ""} onChange={e => setEditingBranch({...editingBranch, city: e.target.value})} className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] uppercase text-slate-500 font-bold block">Estado</label>
                                        <input type="text" value={editingBranch.state || ""} onChange={e => setEditingBranch({...editingBranch, state: e.target.value})} className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white" />
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                                    <button onClick={() => setShowBranchForm(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all">Cancelar</button>
                                    <button onClick={handleSaveBranch} disabled={isSavingBranch} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                                        {isSavingBranch ? "Salvando..." : "Salvar Filial"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-4">
                    {branches.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                            <p className="text-slate-500 text-sm">Nenhuma filial cadastrada.</p>
                        </div>
                    ) : (
                        branches.map(branch => (
                            <div key={branch.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-slate-900/50 border border-white/[0.04] rounded-xl hover:bg-slate-800/80 transition-colors gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <Building size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-white">{branch.name}</h4>
                                        <div className="flex gap-3 mt-1 text-xs">
                                            {branch.cnpj && <span className="text-slate-400 font-mono flex items-center gap-1"><FileText size={10}/> {branch.cnpj}</span>}
                                            {branch.city && branch.state && <span className="text-slate-500 flex items-center gap-1"><MapPin size={10}/> {branch.city} - {branch.state}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto justify-end">
                                    <button 
                                        onClick={() => {
                                            setEditingBranch(branch);
                                            setShowBranchForm(true);
                                        }} 
                                        className="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteBranch(branch.id)} 
                                        className="px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}
