"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
    Activity,
    Search,
    Calendar,
    User,
    FileText,
    MessageSquare,
    Settings,
    Clock,
    Shield,
    Download,
    Loader2,
    Palette,
} from "lucide-react";

interface ActivityLogEntry {
    id: string;
    action: string;
    description: string;
    userName: string;
    userRole: string;
    target: string;
    category: "proposal" | "auth" | "settings" | "client" | "system";
    ip: string;
    createdAt: string;
}

interface Stats {
    proposal: number;
    auth: number;
    settings: number;
    client: number;
    system: number;
    total: number;
}

const categoryConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    proposal: { icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Propostas" },
    auth: { icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Autenticação" },
    settings: { icon: Settings, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", label: "Config" },
    client: { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Cliente" },
    system: { icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", label: "Sistema" },
};

export default function ActivityLogPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 25;

    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterUser, setFilterUser] = useState("all");
    const [userSearchOpen, setUserSearchOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
        } catch { return d; }
    };
    const formatTime = (d: string) => {
        try {
            return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        } catch { return ""; }
    };

    // ═══ Load data ═══
    const loadData = useCallback(async () => {
        // Seed demo data se vazio (primeira vez)
        await api("/api/activity/seed", { method: "POST" });

        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (filterCategory !== "all") params.set("category", filterCategory);
        if (filterUser !== "all") params.set("userName", filterUser);
        
        params.set("limit", pageSize.toString());
        params.set("offset", ((page - 1) * pageSize).toString());

        const [logsRes, statsRes, usersRes] = await Promise.all([
            api<any>(`/api/activity/logs?${params.toString()}`),
            api<any>("/api/activity/stats"),
            api<any>("/api/activity/users"),
        ]);

        if (logsRes.success) {
            setLogs(logsRes.data.logs || []);
            setTotalLogs(logsRes.data.total || 0);
        }
        if (statsRes.success) setStats(statsRes.data);
        if (usersRes.success) setUsers(usersRes.data || []);
    }, [searchQuery, filterCategory, filterUser, page]);

    useEffect(() => {
        setIsLoading(true);
        loadData().finally(() => setIsLoading(false));
    }, [loadData]);

    // ═══ Export ═══
    const handleExport = async () => {
        setExporting(true);
        try {
            const token = document.cookie.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1]
                || localStorage.getItem("accessToken") || "";
            const params = new URLSearchParams();
            if (filterCategory !== "all") params.set("category", filterCategory);
            if (filterUser !== "all") params.set("userName", filterUser);
            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/activity/export?${params.toString()}`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "activity_logs.csv";
            a.click();
            URL.revokeObjectURL(url);
        } catch { /* handle err */ }
        setExporting(false);
    };

    // Effect Hook Reset Pagination on filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, filterCategory, filterUser]);

    if (isLoading && logs.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Activity size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Log de Atividades</h1>
                            <p className="text-sm text-slate-400">Trilha de auditoria de todas as ações do sistema</p>
                        </div>
                    </div>
                    <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50">
                        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Exportar
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {Object.entries(categoryConfig).map(([key, conf]) => {
                    const Icon = conf.icon;
                    const count = stats ? (stats as any)[key] || 0 : 0;
                    return (
                        <button key={key} onClick={() => setFilterCategory(filterCategory === key ? "all" : key)} className={`p-3 rounded-xl border transition-all text-left ${filterCategory === key ? conf.bg : "bg-slate-800/30 border-white/[0.04] hover:bg-white/[0.02]"}`}>
                            <Icon size={14} className={conf.color} />
                            <span className="text-lg font-bold text-white block mt-1">{count}</span>
                            <span className="text-[9px] uppercase tracking-widest text-slate-600">{conf.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar atividade..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 transition-colors" />
                </div>
                
                {/* Custom Searchable User Combobox */}
                <div className="relative min-w-[200px]" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setUserSearchOpen(false); }}>
                    <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Todos os usuários..."
                            value={filterUser === "all" ? "" : filterUser}
                            onChange={(e) => setFilterUser(e.target.value || "all")}
                            onFocus={() => setUserSearchOpen(true)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 transition-colors"
                        />
                    </div>
                    
                    {userSearchOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-full max-h-48 overflow-y-auto bg-slate-800 border border-white/[0.08] rounded-xl shadow-xl z-50 custom-scrollbar py-1">
                            <button
                                type="button"
                                onMouseDown={() => { setFilterUser("all"); setUserSearchOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterUser === "all" ? "bg-blue-500/10 text-blue-400 font-medium" : "text-slate-300 hover:bg-white/[0.04]"}`}
                            >
                                Limpar / Todos
                            </button>
                            {users.filter(u => filterUser === "all" || u.toLowerCase().includes(filterUser.toLowerCase())).map((u) => (
                                <button
                                    key={u}
                                    type="button"
                                    onMouseDown={() => { setFilterUser(u); setUserSearchOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterUser === u ? "bg-blue-500/10 text-blue-400 font-medium" : "text-slate-300 hover:bg-white/[0.04]"}`}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Flat Table List Log */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-slate-900/50">
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Data / Hora</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Usuário</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ação</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Categoria</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Target</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {logs.map((log) => {
                                const conf = categoryConfig[log.category] || categoryConfig.system;
                                return (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="block text-[11px] font-medium text-slate-300">{formatDate(log.createdAt)}</span>
                                            <span className="block text-[10px] text-slate-500">{formatTime(log.createdAt)}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="flex items-center gap-1.5 text-xs text-white">
                                                <User size={12} className="text-slate-500" /> {log.userName}
                                            </span>
                                            <span className="block text-[10px] text-slate-500 mt-0.5">{log.userRole}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="block text-sm font-semibold text-white mb-0.5">{log.action}</span>
                                            <span className="block text-xs text-slate-400 max-w-[320px] truncate" title={log.description}>{log.description}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${conf.bg} ${conf.color}`}>
                                                <conf.icon size={10} /> {conf.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="inline-block text-[10px] px-2 py-1 bg-slate-800 border border-white/[0.04] text-slate-400 rounded-md">
                                                {log.target || "N/A"}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalLogs > 0 && (
                    <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-between bg-slate-900/30">
                        <span className="text-xs text-slate-500">
                            Mostrando <strong className="text-white">{(page - 1) * pageSize + 1}</strong> até <strong className="text-white">{Math.min(page * pageSize, totalLogs)}</strong> de <strong className="text-white">{totalLogs}</strong> registros
                        </span>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 border border-white/[0.08] text-xs font-bold text-slate-300 rounded-lg hover:bg-white/5 disabled:opacity-30 transition-all">
                                Anterior
                            </button>
                            <button disabled={page * pageSize >= totalLogs} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-white/[0.08] text-xs font-bold text-slate-300 rounded-lg hover:bg-white/5 disabled:opacity-30 transition-all">
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {logs.length === 0 && (
                <div className="text-center py-16 text-slate-600">
                    <Activity size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nenhuma atividade encontrada</p>
                </div>
            )}
        </div>
    );
}
