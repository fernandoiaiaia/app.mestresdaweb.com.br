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
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterUser, setFilterUser] = useState("all");
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
        // Seed demo data if empty (first time)
        await api("/api/activity/seed", { method: "POST" });

        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (filterCategory !== "all") params.set("category", filterCategory);
        if (filterUser !== "all") params.set("userName", filterUser);

        const [logsRes, statsRes, usersRes] = await Promise.all([
            api<any>(`/api/activity/logs?${params.toString()}`),
            api<any>("/api/activity/stats"),
            api<any>("/api/activity/users"),
        ]);

        if (logsRes.success) setLogs(logsRes.data.logs || []);
        if (statsRes.success) setStats(statsRes.data);
        if (usersRes.success) setUsers(usersRes.data || []);
    }, [searchQuery, filterCategory, filterUser]);

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

    // Group logs by date
    const grouped = logs.reduce((acc, log) => {
        const date = formatDate(log.createdAt);
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
    }, {} as Record<string, ActivityLogEntry[]>);

    if (isLoading) {
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
                    <input type="text" placeholder="Buscar atividade..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40" />
                </div>
                <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none">
                    <option value="all">Todos usuários</option>
                    {users.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
                {Object.entries(grouped).map(([date, dateLogs]) => (
                    <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-3 mb-3">
                            <Calendar size={14} className="text-slate-600" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{date}</h2>
                            <div className="flex-1 h-px bg-white/[0.04]" />
                            <span className="text-[10px] text-slate-600">{dateLogs.length} eventos</span>
                        </div>
                        <div className="space-y-1.5">
                            {dateLogs.map((log) => {
                                const conf = categoryConfig[log.category] || categoryConfig.system;
                                const Icon = conf.icon;
                                return (
                                    <div key={log.id} className="flex items-start gap-3 p-3.5 bg-slate-800/40 border border-white/[0.06] rounded-xl hover:bg-white/[0.02] transition-all group">
                                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${conf.bg}`}>
                                            <Icon size={14} className={conf.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-semibold text-white">{log.action}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">{log.description}</p>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                                                <span className="flex items-center gap-1"><User size={10} /> {log.userName} <span className="text-slate-700">({log.userRole})</span></span>
                                                <span className="flex items-center gap-1"><Clock size={10} /> {formatTime(log.createdAt)}</span>
                                                {log.ip && <span>IP: {log.ip}</span>}
                                            </div>
                                        </div>
                                        <span className="text-[9px] px-2 py-0.5 rounded-full border text-slate-500 bg-slate-800/50 border-white/[0.06] shrink-0">{log.target}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
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
