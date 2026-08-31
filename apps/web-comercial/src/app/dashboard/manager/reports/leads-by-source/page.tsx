"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Loader2,
    Magnet,
    TrendingUp,
    TrendingDown,
    Minus,
    Trophy,
    CalendarRange,
    Radar,
} from "lucide-react";
import { api } from "@/lib/api";


type LeadSourceRow = {
    source: string;
    leads: number;
    percent: number;
    wonCount: number;
    wonValue: number;
    totalValue: number;
    previousLeads: number;
    /** null quando o período anterior não teve nenhum lead — não existe variação sobre zero. */
    changePercent: number | null;
};

type LeadsBySourceData = {
    range: { startDate: string; endDate: string; days: number };
    totals: {
        leads: number;
        previousLeads: number;
        changePercent: number | null;
        wonCount: number;
        wonValue: number;
        sourceCount: number;
    };
    sources: LeadSourceRow[];
    daily: Array<{ date: string; leads: number }>;
};

type LeadsPeriod = { days: number } | { startDate: string; endDate: string };

function buildQuery(period: LeadsPeriod) {
    return "days" in period
        ? `days=${period.days}`
        : `startDate=${encodeURIComponent(period.startDate)}&endDate=${encodeURIComponent(period.endDate)}`;
}

/** Janelas rápidas + o modo personalizado. */
const PRESETS = [
    { label: "7 dias", days: 7 },
    { label: "15 dias", days: 15 },
    { label: "30 dias", days: 30 },
] as const;

type RangeMode = 7 | 15 | 30 | "custom";

const isoToday = () => new Date().toISOString().slice(0, 10);
const isoDaysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

export default function LeadsBySourcePage() {
    const [mode, setMode] = useState<RangeMode>(30);
    const [customStart, setCustomStart] = useState(isoDaysAgo(30));
    const [customEnd, setCustomEnd] = useState(isoToday());
    const [data, setData] = useState<LeadsBySourceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Intervalo inválido não dispara requisição: a tela avisa e mantém o dado anterior.
    const invalidCustom = mode === "custom" && (!customStart || !customEnd || customStart > customEnd);

    useEffect(() => {
        if (invalidCustom) return;

        const period: LeadsPeriod = mode === "custom"
            ? { startDate: customStart, endDate: customEnd }
            : { days: mode };

        let active = true;
        const load = async () => {
            setIsLoading(true);
            setError(null);
            const res = await api<LeadsBySourceData>(`/api/reports/leads-by-source?${buildQuery(period)}`);
            if (!active) return;
            if (res.success && res.data) {
                setData(res.data);
            } else {
                setError(res.message || "Não foi possível carregar o relatório.");
            }
            setIsLoading(false);
        };
        load();
        return () => { active = false; };
    }, [mode, customStart, customEnd, invalidCustom]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

    const formatDay = (iso: string) => {
        const [, m, d] = iso.split("-");
        return `${d}/${m}`;
    };

    const topSource = data?.sources[0] ?? null;
    const maxLeads = data?.sources[0]?.leads || 1;
    const maxDaily = useMemo(
        () => Math.max(1, ...(data?.daily.map((d) => d.leads) ?? [0])),
        [data],
    );

    // Em janelas longas o eixo fica ilegível se todos os dias forem rotulados.
    const dayLabelStep = data ? Math.ceil(data.daily.length / 12) : 1;

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen pb-32">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8"
            >
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Link
                            href="/dashboard/manager/reports"
                            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm"
                        >
                            <ChevronLeft size={16} /><span>Relatórios</span>
                        </Link>
                        <span className="text-slate-700">/</span>
                        <span className="text-slate-300 text-sm font-medium">Entrada de Leads</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                            <Magnet size={24} className="text-sky-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Entrada de Leads por Fonte</h1>
                            <p className="text-sm text-slate-400">De onde vieram os leads que chegaram no período.</p>
                        </div>
                    </div>
                </div>

                {/* Filtros de período — uma linha só, acima do conteúdo */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-white/5">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.days}
                            onClick={() => setMode(preset.days)}
                            className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-colors border ${
                                mode === preset.days
                                    ? "bg-sky-500 text-slate-950 border-sky-400"
                                    : "bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700"
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setMode("custom")}
                        className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-colors border flex items-center gap-2 ${
                            mode === "custom"
                                ? "bg-sky-500 text-slate-950 border-sky-400"
                                : "bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700"
                        }`}
                    >
                        <CalendarRange size={14} /> Personalizado
                    </button>

                    {mode === "custom" && (
                        <div className="flex items-center gap-2 pl-1">
                            <input
                                type="date"
                                value={customStart}
                                max={customEnd || isoToday()}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="px-3 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl border border-white/10 focus:outline-none focus:border-sky-500/60"
                            />
                            <span className="text-slate-500 text-sm">até</span>
                            <input
                                type="date"
                                value={customEnd}
                                min={customStart}
                                max={isoToday()}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="px-3 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl border border-white/10 focus:outline-none focus:border-sky-500/60"
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {invalidCustom && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium">
                    A data inicial precisa ser anterior à data final.
                </div>
            )}

            {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* KPIs */}
            {data && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                >
                    <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Magnet size={90} className="text-sky-500" />
                        </div>
                        <span className="text-[11px] uppercase font-bold text-sky-400/80 tracking-wider block mb-1">
                            Leads no período
                        </span>
                        <div className="text-4xl font-black text-white tabular-nums">{data.totals.leads}</div>
                        <TrendBadge
                            change={data.totals.changePercent}
                            previous={data.totals.previousLeads}
                        />
                    </div>

                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.07]">
                            <Trophy size={90} className="text-amber-400" />
                        </div>
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            Fonte que mais trouxe
                        </span>
                        <div className="text-2xl font-black text-white truncate">{topSource?.source ?? "—"}</div>
                        <div className="text-sm text-slate-400 mt-2 font-medium">
                            {topSource ? `${topSource.leads} leads · ${topSource.percent.toFixed(0)}% do total` : "Sem leads no período"}
                        </div>
                    </div>

                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.07]">
                            <Radar size={90} className="text-slate-300" />
                        </div>
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            Fontes ativas
                        </span>
                        <div className="text-4xl font-black text-white tabular-nums">{data.totals.sourceCount}</div>
                        <div className="text-sm text-slate-400 mt-2 font-medium">
                            {data.totals.wonCount > 0
                                ? `${data.totals.wonCount} já fechados · ${formatCurrency(data.totals.wonValue)}`
                                : "Nenhum fechamento ainda"}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Volume diário — série única, por isso uma cor só e sem legenda */}
            {data && data.daily.length > 0 && (
                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 mb-8">
                    <div className="flex items-baseline justify-between mb-6">
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">Leads por dia</h2>
                        <span className="text-xs text-slate-500 font-medium">Pico de {maxDaily} no melhor dia</span>
                    </div>

                    <div className="flex items-end gap-[2px] h-40" role="img"
                        aria-label={`Volume diário de leads. Total de ${data.totals.leads} no período.`}>
                        {data.daily.map((day, idx) => {
                            const heightPercent = (day.leads / maxDaily) * 100;
                            return (
                                <div key={day.date} className="flex-1 h-full flex flex-col justify-end items-center group relative min-w-0">
                                    {/* Tooltip no hover */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 whitespace-nowrap
                                                    bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 shadow-xl">
                                        <div className="text-[11px] font-bold text-white">{day.leads} {day.leads === 1 ? "lead" : "leads"}</div>
                                        <div className="text-[10px] text-slate-400">{formatDay(day.date)}</div>
                                    </div>
                                    {day.leads > 0 ? (
                                        <div
                                            className="w-full rounded-t bg-sky-400/80 group-hover:bg-sky-300 transition-colors"
                                            style={{ height: `${Math.max(heightPercent, 3)}%` }}
                                        />
                                    ) : (
                                        // Dia sem lead ganha só um traço recessivo: com a cor da série ele
                                        // seria lido como volume, e sem marca nenhuma o dia sumiria do eixo.
                                        <div className="w-full h-[2px] bg-slate-700/60 rounded-full" />
                                    )}
                                    <span className="text-[9px] text-slate-600 mt-1.5 h-3 tabular-nums">
                                        {idx % dayLabelStep === 0 ? formatDay(day.date) : ""}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Ranking por fonte */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="animate-spin text-sky-500" />
                            <span className="text-sm font-bold text-sky-400 uppercase tracking-widest">Somando fontes...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-950 border-b border-white/[0.06] text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold text-center w-16">#</th>
                                <th className="p-4 font-bold">Fonte</th>
                                <th className="p-4 font-bold w-64">Leads no período</th>
                                <th className="p-4 font-bold text-center">Participação</th>
                                <th className="p-4 font-bold text-center">Período anterior</th>
                                <th className="p-4 font-bold text-center">Variação</th>
                                <th className="p-4 font-bold text-right bg-white/[0.02]">Fechados</th>
                            </tr>
                        </thead>
                        {data && data.sources.length > 0 ? (
                            <tbody>
                                {data.sources.map((row, idx) => (
                                    <tr key={row.source} className="border-b border-white/[0.02] hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-center text-sm font-bold text-slate-500">{idx + 1}º</td>
                                        <td className="p-4 font-black text-sm text-slate-200">{row.source}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-black text-white w-8 tabular-nums">{row.leads}</span>
                                                <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-sky-400 rounded-full"
                                                        style={{ width: `${(row.leads / maxLeads) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-sm font-bold text-slate-300 tabular-nums">
                                            {row.percent.toFixed(1)}%
                                        </td>
                                        <td className="p-4 text-center text-sm font-medium text-slate-500 tabular-nums">
                                            {row.previousLeads}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                <TrendBadge change={row.changePercent} compact />
                                            </div>
                                        </td>
                                        <td className="p-4 text-right bg-white/[0.01]">
                                            <div className="text-sm font-black text-white tabular-nums">{row.wonCount}</div>
                                            {row.wonValue > 0 && (
                                                <div className="text-[11px] text-emerald-400 font-bold tabular-nums">
                                                    {formatCurrency(row.wonValue)}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            !isLoading && (
                                <tbody>
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">
                                            Nenhum lead entrou no período selecionado.
                                        </td>
                                    </tr>
                                </tbody>
                            )
                        )}
                    </table>
                </div>
            </div>

            <p className="mt-4 text-xs text-slate-500 leading-relaxed max-w-3xl">
                Cada lead é contado uma vez, no dia em que entrou. Quando um contato já conhecido
                converte de novo, a oportunidade dele é reaproveitada em vez de gerar um card novo —
                por isso reconversões não somam aqui. Cards arquivados como duplicados também ficam de fora.
                A comparação usa o intervalo imediatamente anterior, de mesma duração.
            </p>
        </div>
    );
}

/**
 * Indicador de variação. A cor nunca carrega o sentido sozinha: vem sempre com seta e
 * sinal, para quem não distingue verde de vermelho ler igual.
 */
function TrendBadge({
    change,
    previous,
    compact = false,
}: {
    change: number | null;
    previous?: number;
    compact?: boolean;
}) {
    if (change === null) {
        return (
            <span className={`inline-flex items-center gap-1.5 font-bold text-slate-500 ${compact ? "text-xs" : "text-sm mt-2"}`}>
                <Minus size={compact ? 12 : 14} />
                {compact ? "novo" : "sem base de comparação"}
            </span>
        );
    }

    const up = change > 0;
    const flat = change === 0;
    const tone = flat ? "text-slate-400" : up ? "text-emerald-400" : "text-rose-400";
    const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;

    return (
        <span className={`inline-flex items-center gap-1.5 font-bold ${tone} ${compact ? "text-xs" : "text-sm mt-2"}`}>
            <Icon size={compact ? 12 : 14} />
            <span className="tabular-nums">{up ? "+" : ""}{change.toFixed(0)}%</span>
            {!compact && previous !== undefined && (
                <span className="text-slate-500 font-medium">vs {previous} no período anterior</span>
            )}
        </span>
    );
}
