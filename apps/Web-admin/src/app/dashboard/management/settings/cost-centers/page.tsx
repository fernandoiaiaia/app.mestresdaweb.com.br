"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Building2,
    Plus,
    Search,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    X
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface CostCenter {
    id: string;
    name: string;
    code: string | null;
    active: boolean;
    budget: number;
    notes: string | null;
}

export default function CostCentersPage() {
    const { toast, confirm } = useToast();
    const [items, setItems] = useState<CostCenter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CostCenter | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        budget: "",
        active: true,
        notes: ""
    });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await api<CostCenter[]>("/api/cost-centers");
            if (res.success && res.data) {
                setItems(res.data);
            }
        } catch (e) {
            toast.error("Erro ao carregar dados", "Não foi possível carregar a lista de centros de custo.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = items.filter(c => {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.code || "").toLowerCase().includes(q);
    });

    const handleOpenCreate = () => {
        setEditingItem(null);
        setFormData({ name: "", code: "", budget: "", active: true, notes: "" });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: CostCenter) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            code: item.code || "",
            budget: item.budget ? String(item.budget) : "",
            active: item.active,
            notes: item.notes || ""
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name) {
            toast.error("Atenção", "O nome do centro de custo é obrigatório.");
            return;
        }

        const payload = {
            name: formData.name,
            code: formData.code || null,
            budget: formData.budget ? parseFloat(formData.budget) : 0,
            active: formData.active,
            notes: formData.notes || null,
        };

        try {
            if (editingItem) {
                const res = await api(`/api/cost-centers/${editingItem.id}`, {
                    method: "PUT",
                    body: payload
                });
                if (res.success) {
                    toast.success("Sucesso", "Centro de custo atualizado com sucesso!");
                    loadData();
                    handleCloseModal();
                } else {
                    toast.error("Erro", res.message || "Falha ao atualizar.");
                }
            } else {
                const res = await api("/api/cost-centers", {
                    method: "POST",
                    body: payload
                });
                if (res.success) {
                    toast.success("Sucesso", "Centro de custo criado com sucesso!");
                    loadData();
                    handleCloseModal();
                } else {
                    toast.error("Erro", res.message || "Falha ao criar.");
                }
            }
        } catch (error) {
            toast.error("Erro", "Erro de conexão ao salvar.");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        const confirmed = await confirm({
            title: "Excluir Centro de Custo",
            description: `Deseja realmente excluir o centro de custo "${name}"? Esta ação não pode ser desfeita.`,
            confirmLabel: "Excluir",
            cancelLabel: "Cancelar",
            variant: "danger"
        });

        if (!confirmed) return;

        try {
            const res = await api(`/api/cost-centers/${id}`, { method: "DELETE" });
            if (res.success) {
                toast.success("Sucesso", "Centro de custo excluído.");
                loadData();
            } else {
                toast.error("Erro", res.message || "Falha ao excluir.");
            }
        } catch (e) {
            toast.error("Erro", "Erro de conexão ao excluir.");
        }
    };

    const toggleActiveStatus = async (item: CostCenter) => {
        try {
            const res = await api(`/api/cost-centers/${item.id}`, {
                method: "PUT",
                body: { active: !item.active }
            });
            if (res.success) {
                toast.success("Sucesso", `Centro de custo ${!item.active ? "ativado" : "desativado"}.`);
                loadData();
            }
        } catch (e) {
            toast.error("Erro", "Falha ao mudar status.");
        }
    };

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/management/settings" className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors text-sm mr-1">
                        <ChevronLeft size={16} />
                    </Link>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Building2 size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Centros de Custo</h1>
                        <p className="text-sm text-slate-400">Organize e estruture suas finanças por áreas</p>
                    </div>
                </div>
                <button 
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={16} /> Adicionar
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6 w-full md:w-96">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou código..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40" 
                />
            </div>

            {/* Table */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 bg-slate-900/40 uppercase border-b border-white/[0.04]">
                            <tr>
                                <th className="px-5 py-4 font-medium tracking-wider">Código</th>
                                <th className="px-5 py-4 font-medium tracking-wider">Nome</th>
                                <th className="px-5 py-4 font-medium tracking-wider text-right">Orçamento</th>
                                <th className="px-5 py-4 font-medium tracking-wider text-center">Status</th>
                                <th className="px-5 py-4 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            Carregando centros de custo...
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                                        Nenhum centro de custo encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-800/60 transition-colors group">
                                        <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                                            {item.code || "—"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-white">{item.name}</div>
                                            {item.notes && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.notes}</div>}
                                        </td>
                                        <td className="px-5 py-4 text-right whitespace-nowrap">
                                            <span className={item.budget > 0 ? "text-emerald-400 font-medium" : "text-slate-500"}>
                                                {item.budget > 0 ? formatBRL(item.budget) : "—"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center whitespace-nowrap">
                                            <button 
                                                onClick={() => toggleActiveStatus(item)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                                                    item.active 
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' 
                                                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20'
                                                }`}
                                            >
                                                {item.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {item.active ? "Ativo" : "Inativo"}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-colors active:scale-95"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors active:scale-95"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" 
                        onClick={handleCloseModal}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                            onClick={e => e.stopPropagation()} 
                            className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
                        >
                            <form onSubmit={handleSave}>
                                {/* Modal Header */}
                                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-slate-800/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white tracking-tight">
                                                {editingItem ? "Editar Centro de Custo" : "Novo Centro de Custo"}
                                            </h2>
                                            <p className="text-xs text-slate-400">Preencha os dados abaixo</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Form Body */}
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome *</label>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="Ex: Comercial"
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-800 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Código (Opcional)</label>
                                            <input 
                                                type="text" 
                                                placeholder="Ex: CC-01"
                                                value={formData.code}
                                                onChange={e => setFormData({...formData, code: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-800 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Orçamento Mensal Planejado (Opcional)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={formData.budget}
                                                onChange={e => setFormData({...formData, budget: e.target.value})}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Observações</label>
                                        <textarea 
                                            rows={3}
                                            placeholder="Detalhes ou regras deste centro de custo..."
                                            value={formData.notes}
                                            onChange={e => setFormData({...formData, notes: e.target.value})}
                                            className="w-full px-3 py-2 bg-slate-800 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.active} 
                                                onChange={e => setFormData({...formData, active: e.target.checked})}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-slate-300">Ativo para novas transações</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 py-4 border-t border-white/[0.06] bg-slate-900 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={handleCloseModal} 
                                        className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                    >
                                        {editingItem ? "Salvar Alterações" : "Criar Centro de Custo"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
