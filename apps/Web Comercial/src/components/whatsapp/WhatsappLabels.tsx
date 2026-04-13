"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Tag, Save, X, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.json()).then(d => d.data);

export function WhatsappLabels() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [search, setSearch] = useState("");
    
    const { data: labels, error, mutate, isLoading } = useSWR(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/labels`, fetcher);

    const [showModal, setShowModal] = useState(false);
    
    // Lista de cores tailwind predefinidas
    const colorOptions = [
        "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", 
        "bg-teal-500", "bg-cyan-500", "bg-blue-500", "bg-indigo-500",
        "bg-purple-500", "bg-pink-500", "bg-rose-500", "bg-slate-500"
    ];

    const [editingLabel, setEditingLabel] = useState<any | null>(null);

    useEffect(() => {
        if (!user) return;
        if (user.role === "VIEWER") router.push("/dashboard");
    }, [user, router]);

    const handleOpenModal = (label: any = null) => {
        setEditingLabel(label ? { ...label } : { name: "", color: colorOptions[0], count: 0 });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!editingLabel?.name) return;
        
        const isEditing = !!editingLabel.id && !editingLabel.id.startsWith("new_");
        
        try {
            const url = isEditing 
                ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/labels/${editingLabel.id}`
                : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/labels`;
                
            const res = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ name: editingLabel.name, color: editingLabel.color })
            });

            if (res.ok) {
                mutate();
            }
        } catch (err) {
            console.error("Error saving label", err);
        }

        setShowModal(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta etiqueta?")) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/labels/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            mutate();
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col flex-1 bg-slate-900 border-l border-white/5 items-center justify-center">
                 <RefreshCw size={24} className="text-blue-500 animate-spin" />
            </div>
        );
    }

    const filteredLabels = (labels || []).filter((l: any) => l.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full flex flex-col flex-1 bg-slate-900 border-l border-white/5 relative overflow-hidden">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Tag className="text-blue-500" /> Gerenciador de Etiquetas
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Crie e organize rótulos para categorizar seus clientes no funil de comunicação.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Buscar etiqueta..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 w-64 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={16} /> Nova Etiqueta
                    </button>
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-4xl mx-auto space-y-4">
                    {filteredLabels.map((label: any) => (
                        <div key={label.id} className="flex items-center justify-between p-4 bg-slate-800/40 border border-white/5 rounded-2xl hover:bg-slate-800/80 transition-all group shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-4 h-4 rounded-full ${label.color || "bg-blue-500"} shadow-sm ring-4 ring-slate-900`}></div>
                                <div>
                                    <h3 className="text-base font-bold text-white mb-0.5">{label.name}</h3>
                                    <span className="text-xs text-slate-500 font-medium">Cadastrada na automação</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleOpenModal(label)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(label.id)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {filteredLabels.length === 0 && (
                        <div className="py-12 text-center text-slate-500">
                            Nenhuma etiqueta encontrada com esse termo.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal CRUD */}
            {showModal && editingLabel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-slate-800/50">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Tag size={18} className="text-blue-400" /> 
                                {editingLabel.id ? "Editar Etiqueta" : "Nova Etiqueta"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Nome da Etiqueta</label>
                                <input 
                                    type="text" 
                                    value={editingLabel.name}
                                    onChange={(e) => setEditingLabel({ ...editingLabel, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                                    placeholder="Ex: Cliente VIP"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">Cor de Identificação</label>
                                <div className="grid grid-cols-6 gap-3">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setEditingLabel({ ...editingLabel, color })}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${color} ${
                                                editingLabel.color === color 
                                                    ? 'ring-4 ring-blue-500/30 scale-110 shadow-lg' 
                                                    : 'hover:scale-110 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            {editingLabel.color === color && <div className="w-3 h-3 bg-white rounded-full"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-[#111b21] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-800 rounded-full flex shrink-0"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300">Preview no Chat</h4>
                                    <div className={`mt-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-opacity-10 shadow-sm border border-transparent text-white/90 ${editingLabel.color || "bg-blue-500"}`}>
                                        {editingLabel.name || "NOME"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-5 bg-slate-800/50 border-t border-white/5 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                                <Save size={16} /> Salvar Etiqueta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
