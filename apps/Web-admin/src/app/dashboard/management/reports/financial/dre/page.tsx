"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Calendar, Loader2, Info, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { reportsService, DREData } from "@/services/reports.service";

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function DREPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [mode, setMode] = useState<'caixa' | 'competencia'>('caixa');
    const [dre, setDre] = useState<DREData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Estado para controlar quais categorias estão expandidas
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        receitaBruta: false,
        impostos: false,
        custos: false,
        despesas: false,
        pessoas: false
    });

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await reportsService.getDRE(year, mode);
            if (res.success && res.data) {
                setDre(res.data);
            }
            setIsLoading(false);
        };
        load();
    }, [year, mode]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const toggleExpand = (key: string) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const renderDataRow = (
        title: string, 
        data: any, 
        isSubRow = false, 
        isTotal = false, 
        invertColor = false,
        onExpand?: () => void,
        isExpanded?: boolean
    ) => {
        const textColor = isTotal ? (data.total >= 0 ? (invertColor ? 'text-emerald-400' : 'text-emerald-400') : 'text-rose-400') : (isSubRow ? 'text-slate-400' : 'text-slate-200');
        const bgColor = isTotal ? 'bg-slate-800/80' : (isSubRow ? 'bg-slate-900/30' : 'bg-slate-900/80');
        const titleClass = isTotal ? 'font-black text-white text-sm' : (isSubRow ? 'font-medium text-xs text-slate-400 pl-8' : 'font-bold text-sm text-slate-200 cursor-pointer hover:text-white transition-colors flex items-center gap-1.5');

        return (
            <tr className={`border-b border-white/[0.04] ${bgColor}`}>
                <td className={`p-3 sticky left-0 ${bgColor} whitespace-nowrap`} onClick={onExpand}>
                    <div className={titleClass}>
                        {onExpand && (isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />)}
                        {title}
                    </div>
                </td>
                {MONTHS.map(m => (
                    <td key={m} className={`p-3 text-right text-xs whitespace-nowrap ${isTotal ? textColor : 'text-slate-400'}`}>
                        {data[m] === 0 ? '-' : formatCurrency(data[m])}
                    </td>
                ))}
                <td className={`p-3 text-right font-bold text-sm whitespace-nowrap bg-indigo-500/5 ${textColor}`}>
                    {data.total === 0 ? '-' : formatCurrency(data.total)}
                </td>
            </tr>
        );
    };

    const renderGroup = (key: string, title: string, group: any, invertColor = false) => {
        const hasItems = Object.keys(group.items).length > 0;
        return (
            <>
                {renderDataRow(title, group.total, false, false, invertColor, hasItems ? () => toggleExpand(key) : undefined, expanded[key])}
                {expanded[key] && Object.entries(group.items).map(([catName, catData]: any) => (
                    renderDataRow(catName, catData, true, false, invertColor)
                ))}
            </>
        );
    };

    const getProfitMargin = () => {
        if (!dre || dre.receitaBruta.total.total === 0) return 0;
        return (dre.lucroLiquido.total / dre.receitaBruta.total.total) * 100;
    };

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Link href="/dashboard/management/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                            <ChevronLeft size={16} /><span>Relatórios</span>
                        </Link>
                        <span className="text-slate-700">/</span>
                        <span className="text-slate-300 text-sm font-medium">DRE</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <BarChart3 size={24} className="text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">DRE Gerencial</h1>
                            <p className="text-sm text-slate-400">Demonstrativo de Resultado do Exercício.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/80 p-2 rounded-2xl border border-white/5">
                    <div className="flex bg-slate-950 rounded-xl p-1 border border-white/5">
                        <button 
                            onClick={() => setMode('caixa')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'caixa' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Regime de Caixa
                        </button>
                        <button 
                            onClick={() => setMode('competencia')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'competencia' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Competência
                        </button>
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-1"></div>
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select 
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="pl-9 pr-8 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl border border-white/10 focus:outline-none appearance-none"
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* KPIs */}
            {dre && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <TrendingUp size={64} />
                        </div>
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Receita Bruta Total</span>
                        <div className="text-3xl font-black text-white mt-2">{formatCurrency(dre.receitaBruta.total.total)}</div>
                    </div>
                    <div className={`bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden`}>
                        <div className={`absolute top-0 right-0 p-6 opacity-10 ${dre.lucroLiquido.total >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {dre.lucroLiquido.total >= 0 ? <TrendingUp size={64} /> : <TrendingDown size={64} />}
                        </div>
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Lucro Líquido Acumulado</span>
                        <div className={`text-3xl font-black mt-2 ${dre.lucroLiquido.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(dre.lucroLiquido.total)}
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <span className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider">Margem de Lucro Real</span>
                        <div className="text-3xl font-black text-white mt-2">
                            {getProfitMargin().toFixed(1)}%
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Tabela DRE */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                            <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Calculando DRE...</span>
                        </div>
                    </div>
                )}

                {mode === 'caixa' && (
                    <div className="px-5 py-3 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2">
                        <Info size={14} className="text-indigo-400" />
                        <span className="text-xs text-indigo-300 font-medium">Você está visualizando o <b>Regime de Caixa</b>. Apenas transações com status "Pago" baseadas na Data de Pagamento estão sendo calculadas.</span>
                    </div>
                )}
                
                {mode === 'competencia' && (
                    <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                        <Info size={14} className="text-amber-400" />
                        <span className="text-xs text-amber-300 font-medium">Você está visualizando o <b>Regime de Competência</b>. Todas as transações (incluindo "Previsto") baseadas na Data de Vencimento estão sendo calculadas.</span>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 border-b border-white/[0.06] text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold min-w-[250px] sticky left-0 bg-slate-950 z-20">Descrição</th>
                                {MONTH_NAMES.map(m => <th key={m} className="p-4 font-bold text-right">{m}</th>)}
                                <th className="p-4 font-bold text-right bg-indigo-500/10 text-indigo-400">Total {year}</th>
                            </tr>
                        </thead>
                        {dre && (
                            <tbody>
                                {/* 1. Receita Operacional Bruta */}
                                {renderGroup('receitaBruta', '1. Receita Operacional Bruta', dre.receitaBruta, true)}

                                {/* 2. Deduções e Impostos */}
                                {renderGroup('impostos', '2. Deduções e Impostos (-)', dre.impostos)}

                                {/* 3. Receita Operacional Líquida */}
                                {renderDataRow('3. Receita Operacional Líquida (=)', dre.receitaLiquida, false, true, true)}

                                {/* 4. Custos (Despesas Variáveis) */}
                                {renderGroup('custos', '4. Custos Variáveis (-)', dre.custos)}

                                {/* 5. Despesas Fixas */}
                                {renderGroup('despesas', '5. Despesas Fixas (-)', dre.despesas)}

                                {/* 6. Despesas c/ Pessoal */}
                                {renderGroup('pessoas', '6. Despesas c/ Pessoal (-)', dre.pessoas)}

                                {/* RESULTADO FINAL */}
                                {renderDataRow('LUCRO LÍQUIDO DO EXERCÍCIO (=)', dre.lucroLiquido, false, true, true)}
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
