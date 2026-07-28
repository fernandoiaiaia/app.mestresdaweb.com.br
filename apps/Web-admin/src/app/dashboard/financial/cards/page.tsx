"use client";

import { useState, useEffect } from "react";
import { CreditCard as CardIcon, Plus, ChevronRight, X, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Invoice {
    id: string;
    month: number;
    year: number;
    totalValue: number;
    status: string;
    dueDate: string;
    transactionId?: string;
}

interface CreditCard {
    id: string;
    name: string;
    brand: string | null;
    limit: number | null;
    closingDay: number;
    dueDay: number;
    color: string;
    invoices: Invoice[];
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function CreditCardsPage() {
    const { toast } = useToast();
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddingCard, setIsAddingCard] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("Mastercard");
    const [limit, setLimit] = useState("");
    const [closingDay, setClosingDay] = useState("1");
    const [dueDay, setDueDay] = useState("10");
    const [color, setColor] = useState("blue");

    const loadCards = async () => {
        try {
            setLoading(true);
            const res = await api<CreditCard[]>("/api/financial/cards");
            if (res && res.success && res.data) {
                setCards(res.data);
            }
        } catch (error) {
            toast.error("Erro ao carregar cartões de crédito");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCards();
    }, []);

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsAddingCard(true);
            const res = await api<CreditCard>("/api/financial/cards", {
                method: "POST",
                body: {
                    name,
                    brand,
                    limit: limit ? parseFloat(limit.replace(/\./g, '').replace(',', '.')) : null,
                    closingDay: parseInt(closingDay),
                    dueDay: parseInt(dueDay),
                    color
                }
            });

            if (res?.success) {
                toast.success("Cartão cadastrado com sucesso!");
                setIsAddModalOpen(false);
                loadCards();
                // Reset form
                setName("");
                setLimit("");
            } else {
                toast.error("Falha ao cadastrar cartão.");
            }
        } catch (error) {
            toast.error("Erro interno ao cadastrar cartão.");
        } finally {
            setIsAddingCard(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CardIcon className="text-blue-500" /> Cartões de Crédito
                    </h1>
                    <p className="text-slate-400 mt-1">Gerencie seus cartões e unifique as despesas na fatura mensal.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> Novo Cartão
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : cards.length === 0 ? (
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-12 text-center">
                    <CardIcon className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-medium text-white mb-2">Nenhum cartão cadastrado</h3>
                    <p className="text-slate-400 mb-6">Comece cadastrando seu primeiro cartão de crédito para centralizar seus gastos.</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <Plus size={18} /> Adicionar Cartão
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map(card => {
                        const openInvoice = card.invoices.find(inv => inv.status === 'open');
                        
                        // Determina a cor visual
                        let bgGradient = "from-slate-700 to-slate-900";
                        if (card.color === 'purple') bgGradient = "from-purple-600 to-violet-900";
                        if (card.color === 'orange') bgGradient = "from-orange-500 to-red-600";
                        if (card.color === 'blue') bgGradient = "from-blue-600 to-indigo-900";
                        if (card.color === 'black') bgGradient = "from-slate-800 to-black";
                        if (card.color === 'green') bgGradient = "from-emerald-500 to-teal-800";

                        return (
                            <Link href={`/dashboard/financial/cards/${card.id}`} key={card.id}>
                                <motion.div 
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    className={`relative bg-gradient-to-br ${bgGradient} rounded-2xl p-6 shadow-xl border border-white/10 overflow-hidden group cursor-pointer h-56 flex flex-col justify-between`}
                                >
                                    {/* Chip and Brand */}
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-8 bg-yellow-400/80 rounded-md shadow-inner flex items-center justify-center overflow-hidden">
                                            <div className="w-8 h-6 border border-yellow-600/30 rounded-sm"></div>
                                        </div>
                                        <span className="text-white/80 font-bold italic tracking-wider">{card.brand}</span>
                                    </div>
                                    
                                    {/* Info */}
                                    <div>
                                        <h3 className="text-white text-lg font-semibold tracking-wide drop-shadow-md mb-4">{card.name}</h3>
                                        
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-white/60 text-xs mb-1 uppercase tracking-wider">Fatura Atual</p>
                                                <p className="text-2xl font-bold text-white drop-shadow-md">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(openInvoice?.totalValue || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-white/10 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                                                <ArrowRight className="text-white w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Add Card Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <h2 className="text-xl font-semibold text-white">Novo Cartão de Crédito</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleAddCard} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Cartão (Ex: Nubank, Itaú)</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Bandeira</label>
                                        <select 
                                            value={brand}
                                            onChange={e => setBrand(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="Mastercard">Mastercard</option>
                                            <option value="Visa">Visa</option>
                                            <option value="Elo">Elo</option>
                                            <option value="Amex">Amex</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Cor</label>
                                        <select 
                                            value={color}
                                            onChange={e => setColor(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="purple">Roxo (Nubank)</option>
                                            <option value="orange">Laranja (Inter)</option>
                                            <option value="blue">Azul</option>
                                            <option value="black">Preto (Black)</option>
                                            <option value="green">Verde</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Dia de Fechamento</label>
                                        <input 
                                            type="number" 
                                            min="1" max="31" 
                                            required 
                                            value={closingDay}
                                            onChange={e => setClosingDay(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Dia de Vencimento</label>
                                        <input 
                                            type="number" 
                                            min="1" max="31" 
                                            required 
                                            value={dueDay}
                                            onChange={e => setDueDay(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Limite Disponível (Opcional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: 5000,00"
                                        value={limit}
                                        onChange={e => setLimit(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isAddingCard}
                                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex justify-center items-center"
                                    >
                                        {isAddingCard ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Cartão"}
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
