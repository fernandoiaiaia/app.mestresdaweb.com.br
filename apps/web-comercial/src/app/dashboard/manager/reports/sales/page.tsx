"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, CheckCircle2, Filter, Search, DollarSign, TrendingUp, PieChart as PieChartIcon, CalendarDays } from "lucide-react";
import { PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";

// Categorical palette (dark-mode, validated against this app's slate-900 chart surface),
// fixed order — never cycled past 8 slots. See dataviz skill's color-formula.md.
const CATEGORICAL_COLORS = ["#3987e5", "#199e70", "#c98500", "#008300", "#9085e9", "#e66767", "#d55181", "#d95926"];
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const tooltipStyle = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

interface SalesDeal {
    id: string;
    title: string;
    value: number;
    source: string;
    updatedAt: string;
    client?: { id: string; name: string; company?: string | null } | null;
    consultant?: { id: string; name: string; avatar?: string | null } | null;
    funnel?: { id: string; name: string } | null;
    stage?: { id: string; name: string; color: string } | null;
}

interface FilterOptions {
    consultants: { id: string; name: string }[];
    funnels: { id: string; name: string }[];
    sources: string[];
}

interface SalesReportData {
    deals: SalesDeal[];
    filterOptions: FilterOptions;
    summary: { count: number; totalValue: number; avgTicket: number };
}

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => {
    try {
        return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return d; }
};

export default function SalesReportPage() {
    const [data, setData] = useState<SalesReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [consultantId, setConsultantId] = useState("all");
    const [source, setSource] = useState("all");
    const [funnelId, setFunnelId] = useState("all");

    useEffect(() => {
        const timer = setTimeout(() => {
            const load = async () => {
                setIsLoading(true);
                try {
                    const params = new URLSearchParams();
                    if (search) params.set("search", search);
                    if (startDate) params.set("startDate", startDate);
                    if (endDate) params.set("endDate", endDate);
                    if (consultantId !== "all") params.set("consultantId", consultantId);
                    if (source !== "all") params.set("source", source);
                    if (funnelId !== "all") params.set("funnelId", funnelId);
                    const result = await api<SalesReportData>(`/api/deals/reports/sales?${params.toString()}`);
                    if (result.success && result.data) {
                        setData(result.data);
                    }
                } catch (err) {
                    console.error("Falha ao carregar relatório de vendas", err);
                } finally {
                    setIsLoading(false);
                }
            };
            load();
        }, 350);
        return () => clearTimeout(timer);
    }, [search, startDate, endDate, consultantId, source, funnelId]);

    const sourceBreakdown = useMemo(() => {
        if (!data) return [];
        const totals = new Map<string, { value: number; count: number }>();
        for (const d of data.deals) {
            const key = d.source || "Desconhecida";
            const entry = totals.get(key) || { value: 0, count: 0 };
            entry.value += d.value || 0;
            entry.count += 1;
            totals.set(key, entry);
        }
        const sorted = Array.from(totals.entries())
            .map(([name, v]) => ({ name, value: v.value, count: v.count }))
            .sort((a, b) => b.value - a.value);

        const MAX_SLICES = 6;
        if (sorted.length <= MAX_SLICES) return sorted;
        const top = sorted.slice(0, MAX_SLICES - 1);
        const rest = sorted.slice(MAX_SLICES - 1);
        const other = rest.reduce(
            (acc, r) => ({ name: "Outros", value: acc.value + r.value, count: acc.count + r.count }),
            { name: "Outros", value: 0, count: 0 }
        );
        return [...top, other];
    }, [data]);

    const totalSourceValue = sourceBreakdown.reduce((sum, s) => sum + s.value, 0);

    const monthlyBreakdown = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const totals = new Array(12).fill(0);
        if (data) {
            for (const d of data.deals) {
                const date = new Date(d.updatedAt);
                if (date.getFullYear() !== currentYear) continue;
                totals[date.getMonth()] += d.value || 0;
            }
        }
        return MONTH_LABELS.map((label, i) => ({ month: label, valor: totals[i] }));
    }, [data]);

    const hasActiveFilters = !!startDate || !!endDate || consultantId !== "all" || source !== "all" || funnelId !== "all";

    const clearFilters = () => {
        setStartDate(""); setEndDate(""); setConsultantId("all"); setSource("all"); setFunnelId("all");
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/dashboard/manager/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"><ChevronLeft size={16} /><BarChart3 size={14} /><span>Relatórios</span></Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={20} className="text-emerald-400" /></div>
                    <div><h1 className="text-2xl font-bold text-white">Vendas Realizadas</h1><p className="text-sm text-slate-400">Negócios fechados como venda, com filtros por período, vendedor, origem e funil</p></div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {isLoading || !data ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl h-20 animate-pulse"></div>
                    ))
                ) : (
                    [
                        { label: "Total de Vendas", value: data.summary.count.toString(), color: "text-emerald-400", icon: CheckCircle2 },
                        { label: "Valor Total", value: fmt(data.summary.totalValue), color: "text-blue-400", icon: DollarSign },
                        { label: "Ticket Médio", value: fmt(data.summary.avgTicket), color: "text-purple-400", icon: TrendingUp },
                    ].map((k, i) => (
                        <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <k.icon size={14} className={k.color} />
                                <span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span>
                            </div>
                            <span className={`text-xl font-bold block ${k.color}`}>{k.value}</span>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChartIcon size={14} className="text-slate-500" />
                        <h3 className="text-sm font-bold text-slate-300">Vendas por Origem</h3>
                    </div>
                    <div className="h-[280px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : sourceBreakdown.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-slate-500">Nenhuma venda encontrada para os filtros selecionados.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceBreakdown}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        strokeWidth={2}
                                        stroke="#0f172a"
                                        label={({ value }) => totalSourceValue > 0 ? `${((value / totalSourceValue) * 100).toFixed(0)}%` : ""}
                                        labelLine={false}
                                    >
                                        {sourceBreakdown.map((_, i) => (
                                            <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [fmt(Number(value)), String(name)]} />
                                    <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarDays size={14} className="text-slate-500" />
                        <h3 className="text-sm font-bold text-slate-300">Vendas por Mês ({new Date().getFullYear()})</h3>
                    </div>
                    <div className="h-[280px]">
                        {isLoading || !data ? (
                            <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyBreakdown}>
                                    <CartesianGrid stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [fmt(Number(value)), "Valor"]} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                    <Bar dataKey="valor" fill={CATEGORICAL_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={24} name="Valor" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou negócio..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${showFilters ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-slate-800/50 border-white/[0.08] text-slate-400 hover:text-white"}`}
                    >
                        <Filter size={16} />
                        Filtros
                        {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </button>
                </div>
                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="flex flex-wrap gap-4 mt-3 p-4 bg-slate-800/30 border border-white/[0.04] rounded-xl">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">De</label>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ colorScheme: "dark" }} className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Até</label>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ colorScheme: "dark" }} className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Vendedor</label>
                                    <select value={consultantId} onChange={(e) => setConsultantId(e.target.value)} className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40 min-w-[160px]">
                                        <option value="all">Todos</option>
                                        {(data?.filterOptions.consultants || []).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Origem</label>
                                    <select value={source} onChange={(e) => setSource(e.target.value)} className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40 min-w-[140px]">
                                        <option value="all">Todas</option>
                                        {(data?.filterOptions.sources || []).map((s) => (<option key={s} value={s}>{s}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Funil</label>
                                    <select value={funnelId} onChange={(e) => setFunnelId(e.target.value)} className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40 min-w-[160px]">
                                        <option value="all">Todos</option>
                                        {(data?.filterOptions.funnels || []).map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                                    </select>
                                </div>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="self-end px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors">
                                        Limpar filtros
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-white/[0.04] bg-slate-900/50">
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente</th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Vendedor</th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Funil / Etapa</th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Origem</th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor</th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Fechamento</th>
                        </tr></thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {isLoading || !data ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-500 text-sm">Carregando vendas...</td></tr>
                            ) : data.deals.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-500 text-sm">Nenhuma venda encontrada para os filtros selecionados.</td></tr>
                            ) : (
                                data.deals.map((d) => (
                                    <tr key={d.id} className="hover:bg-white/[0.02]">
                                        <td className="px-6 py-3 text-sm text-white font-medium">{d.client?.name || d.title}</td>
                                        <td className="px-6 py-3 text-sm text-slate-400">{d.consultant?.name || "—"}</td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-lg truncate block max-w-[180px]">{d.funnel?.name || "—"}{d.stage?.name ? ` · ${d.stage.name}` : ""}</span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-400">{d.source || "—"}</td>
                                        <td className="px-6 py-3 text-sm text-white font-semibold">{fmt(d.value)}</td>
                                        <td className="px-6 py-3 text-sm text-slate-400">{fmtDate(d.updatedAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
