"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Wallet,
    Building2,
    Shapes,
    ChevronLeft,
    ArrowRight,
    Tag,
    CreditCard,
    Sparkles,
    Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const financialCards = [
    {
        id: "accounts",
        title: "Contas",
        description: "Gerencie contas bancárias e saldos.",
        icon: Wallet,
        href: "/dashboard/management/settings/accounts",
        badge: null,
        badgeColor: null,
    },
    {
        id: "cost-centers",
        title: "Centro de Custos",
        description: "Configure os centros de custo da empresa.",
        icon: Building2,
        href: "/dashboard/management/settings/cost-centers",
        badge: null,
        badgeColor: null,
    },
    {
        id: "categories",
        title: "Categorias",
        description: "Categorias financeiras e contábeis.",
        icon: Shapes,
        href: "/dashboard/management/settings/categories",
        badge: null,
        badgeColor: null,
    },
    {
        id: "transaction-types",
        title: "Tipos de Lançamento",
        description: "Grupos financeiros (Receitas, Despesas, etc).",
        icon: Tag,
        href: "/dashboard/management/settings/transaction-types",
        badge: null,
        badgeColor: null,
    },
    {
        id: "payment-methods",
        title: "Formas de Pagamento",
        description: "Métodos de pagamento disponíveis.",
        icon: CreditCard,
        href: "/dashboard/management/settings/payment-methods",
        badge: null,
        badgeColor: null,
    }
];

export default function FinancialSettingsPage() {
    const { toast } = useToast();
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            const res = await api<{ bankAccounts: number; costCenters: number; paymentMethods: number; transactionTypes: number; categories: number }>("/api/financial/transactions/setup", {
                method: "POST",
            });
            if (res.success && res.data) {
                const total = Object.values(res.data).reduce((a, b) => a + b, 0);
                toast.success("Cadastros criados", `${total} registros padrão foram criados com sucesso.`);
            } else {
                toast.error("Erro", res.message || "Não foi possível criar os cadastros padrão.");
            }
        } catch (error: any) {
            console.error("[FINANCIAL_SEED_ERROR]", error);
            toast.error("Erro", error.message || "Falha ao criar cadastros padrão.");
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-10"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/management/settings" className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors text-sm mr-1">
                            <ChevronLeft size={16} />
                        </Link>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Wallet size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Cadastros Financeiros</h1>
                            <p className="text-sm text-slate-400">Configure suas contas, centros de custo e categorias.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSeed}
                        disabled={isSeeding}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all"
                    >
                        {isSeeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isSeeding ? "Criando..." : "Criar cadastros padrão"}
                    </button>
                </div>
            </motion.div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {financialCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link href={card.href}>
                                <div className="group relative bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 hover:bg-slate-800/60 hover:border-white/10 transition-all duration-300 cursor-pointer h-full">
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-11 h-11 rounded-xl bg-slate-700/50 border border-slate-600/30 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-300">
                                                <Icon size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
                                            </div>
                                        </div>

                                        <h3 className="text-[15px] font-semibold text-white mb-1.5 group-hover:text-blue-50 transition-colors">
                                            {card.title}
                                        </h3>

                                        <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                                            {card.description}
                                        </p>

                                        <div className="flex items-center gap-1.5 text-slate-600 group-hover:text-blue-500 transition-colors duration-300">
                                            <span className="text-[11px] font-semibold uppercase tracking-widest">Acessar</span>
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
