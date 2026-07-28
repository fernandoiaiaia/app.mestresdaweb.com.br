"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Trash2, Save } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { institutionalService, Partner } from "@/services/institutional.service";
import { companyBranchesService, CompanyBranch } from "@/services/company-branches.service";
import { Building } from "lucide-react";

export default function CompanyPartnersPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Partners state
    const [partners, setPartners] = useState<Partner[]>([]);
    const [showNewPartnerForm, setShowNewPartnerForm] = useState(false);
    const [newPartner, setNewPartner] = useState<Partner>({ id: "", name: "", cpf: "", role: "", share: "", companyId: "matriz" });
    const [formData, setFormData] = useState<any>(null); // to keep other data intact
    const [branches, setBranches] = useState<CompanyBranch[]>([]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await institutionalService.get();
            if (res.success && res.data) {
                setFormData(res.data);
                if (res.data.partners) setPartners(res.data.partners);
            }
        } catch (e) {
            toast.error("Erro", "Falha ao carregar dados dos sócios.");
        } 
        try {
            const branchesRes = await companyBranchesService.list();
            if (branchesRes.success && branchesRes.data) {
                setBranches(branchesRes.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async () => {
        if (!formData) return;
        setIsSaving(true);
        try {
            const res = await institutionalService.update({ ...formData, partners });
            if (res.success) {
                toast.success("Sucesso", "Quadro Societário atualizado!");
            } else {
                toast.error("Erro", res.message || "Falha ao salvar dados.");
            }
        } catch (e) {
            toast.error("Erro", "Erro de conexão ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    const addPartner = () => {
        if (!newPartner.name || !newPartner.cpf) {
            toast.error("Atenção", "Preencha o nome e o CPF do sócio.");
            return;
        }
        setPartners([...partners, { ...newPartner, id: Math.random().toString() }]);
        setNewPartner({ id: "", name: "", cpf: "", role: "", share: "", companyId: "matriz" });
        setShowNewPartnerForm(false);
    };

    const removePartner = (id: string) => {
        setPartners(partners.filter(p => p.id !== id));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-end mb-4">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20"
                >
                    {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    {isSaving ? "Salvando..." : "Salvar Quadro Societário"}
                </button>
            </div>

            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <UserPlus size={20} className="text-emerald-400" /> Quadro Societário (QSA)
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Gerencie os administradores e cotistas da empresa.</p>
                    </div>
                    <button 
                        onClick={() => setShowNewPartnerForm(!showNewPartnerForm)}
                        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-sm font-semibold transition-all"
                    >
                        {showNewPartnerForm ? "Cancelar" : "+ Adicionar Sócio"}
                    </button>
                </div>

                <AnimatePresence>
                    {showNewPartnerForm && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-5 mb-6 bg-slate-900/50 border border-emerald-500/20 rounded-xl space-y-4">
                                <h4 className="text-sm font-bold text-emerald-400">Novo Sócio</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Nome Completo</label>
                                        <input type="text" value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})} className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white" placeholder="João da Silva" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">CPF</label>
                                        <input type="text" value={newPartner.cpf} onChange={e => setNewPartner({...newPartner, cpf: e.target.value})} className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white font-mono" placeholder="000.000.000-00" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Participação (%)</label>
                                        <input type="number" value={newPartner.share} onChange={e => setNewPartner({...newPartner, share: e.target.value})} className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white" placeholder="Ex: 50" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Cargo/Função</label>
                                        <select value={newPartner.role} onChange={e => setNewPartner({...newPartner, role: e.target.value})} className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white appearance-none">
                                            <option value="">Selecione...</option>
                                            <option value="Sócio Administrador">Sócio Administrador</option>
                                            <option value="Sócio Cotista">Sócio Cotista</option>
                                            <option value="Diretor">Diretor (Não sócio)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Vinculado a qual Empresa?</label>
                                        <select value={newPartner.companyId || "matriz"} onChange={e => setNewPartner({...newPartner, companyId: e.target.value})} className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white appearance-none">
                                            <option value="matriz">Matriz Principal</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name} ({b.cnpj})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button onClick={addPartner} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold">Adicionar</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-3">
                    {partners.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                            <p className="text-slate-500 text-sm">Nenhum sócio cadastrado ainda.</p>
                        </div>
                    ) : (
                        partners.map(partner => (
                            <div key={partner.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/[0.04] rounded-xl hover:bg-slate-800/80 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-300">
                                        {partner.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{partner.name} <span className="text-xs font-normal text-slate-400 ml-2">({partner.cpf})</span></p>
                                        <div className="flex gap-3 mt-1 text-[11px]">
                                            <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">{partner.role}</span>
                                            <span className="text-slate-400 flex items-center gap-1">Participação: <strong className="text-white">{partner.share}%</strong></span>
                                            <span className="text-slate-500 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800">
                                                <Building size={10} />
                                                {(!partner.companyId || partner.companyId === 'matriz') ? 'Matriz' : branches.find(b => b.id === partner.companyId)?.name || 'Filial'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removePartner(partner.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}
