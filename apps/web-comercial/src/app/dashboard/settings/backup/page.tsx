"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft,
    Settings,
    Database,
    Save,
    CheckCircle2,
    Download,
    Upload,
    Clock,
    HardDrive,
    Cloud,
    Trash2,
    RefreshCw,
    AlertTriangle,
    X,
    FileText,
    Users,
    FileDown,
    ShieldCheck,
    Eye,
    RotateCcw,
    Loader2,
} from "lucide-react";

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? "bg-blue-600" : "bg-slate-700"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "left-[22px]" : "left-0.5"}`} />
    </button>
);

interface BackupEntry {
    id: string;
    date: string;
    size: string;
    type: "Automático" | "Manual";
    status: "success" | "failed";
    includes: string[];
}

interface Stats {
    storageUsed: string;
    storageLimit: string;
    storagePct: number;
    proposalCount: number;
    clientCount: number;
    backupCount: number;
    successCount: number;
    failedCount: number;
    lastBackup: { date: string; type: string } | null;
}

export default function BackupPage() {
    const [isLoading, setIsLoading] = useState(true);

    // Settings
    const [autoBackup, setAutoBackup] = useState(true);
    const [retentionDays, setRetentionDays] = useState(30);
    const [backupTime, setBackupTime] = useState("03:00");
    const [includeProposals, setIncludeProposals] = useState(true);
    const [includeClients, setIncludeClients] = useState(true);
    const [includeConfig, setIncludeConfig] = useState(true);
    const [includeUsers, setIncludeUsers] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    // Stats
    const [stats, setStats] = useState<Stats | null>(null);

    // Backup
    const [backingUp, setBackingUp] = useState(false);
    const [backupDone, setBackupDone] = useState(false);
    const [history, setHistory] = useState<BackupEntry[]>([]);

    // Export
    const [showExport, setShowExport] = useState(false);
    const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
    const [exportProposals, setExportProposals] = useState(true);
    const [exportClients, setExportClients] = useState(true);
    const [exportConfig, setExportConfig] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportDone, setExportDone] = useState(false);

    // Delete
    const [showDelete, setShowDelete] = useState(false);
    const [deleteProposals, setDeleteProposals] = useState(false);
    const [deleteClients, setDeleteClients] = useState(false);
    const [deleteHistory, setDeleteHistory] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteDone, setDeleteDone] = useState(false);

    // Download / Restore
    const [downloading, setDownloading] = useState<string | null>(null);
    const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [restoreDone, setRestoreDone] = useState(false);
    const [restoreMsg, setRestoreMsg] = useState("");

    // Detail view
    const [detailBackup, setDetailBackup] = useState<BackupEntry | null>(null);

    // Delete entry
    const [deleteEntryConfirm, setDeleteEntryConfirm] = useState<string | null>(null);

    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch { return d; }
    };

    // ═══ Load data ═══
    const loadData = useCallback(async () => {
        const [settingsRes, statsRes, historyRes] = await Promise.all([
            api<any>("/api/backup/settings"),
            api<any>("/api/backup/stats"),
            api<any>("/api/backup/history"),
        ]);
        if (settingsRes.success && settingsRes.data) {
            const s = settingsRes.data;
            setAutoBackup(s.autoBackup);
            setRetentionDays(s.retentionDays);
            setBackupTime(s.backupTime);
            setIncludeProposals(s.includeProposals);
            setIncludeClients(s.includeClients);
            setIncludeConfig(s.includeConfig);
            setIncludeUsers(s.includeUsers);
        }
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (historyRes.success && historyRes.data) {
            setHistory(historyRes.data.map((b: any) => ({
                ...b,
                date: formatDate(b.date),
            })));
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        loadData().finally(() => setIsLoading(false));
    }, [loadData]);

    // ═══ Save Settings ═══
    const handleSave = async () => {
        setSaving(true);
        const res = await api<any>("/api/backup/settings", {
            method: "PUT",
            body: JSON.stringify({ autoBackup, retentionDays, backupTime, includeProposals, includeClients, includeConfig, includeUsers }),
        });
        setSaving(false);
        if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    };

    // ═══ Manual Backup ═══
    const handleBackup = async () => {
        setBackingUp(true);
        const res = await api<any>("/api/backup/create", { method: "POST" });
        setBackingUp(false);
        if (res.success && res.data) {
            setHistory(prev => [{ ...res.data, date: formatDate(res.data.date) }, ...prev]);
            setBackupDone(true);
            setTimeout(() => setBackupDone(false), 3000);
            // Refresh stats
            const statsRes = await api<any>("/api/backup/stats");
            if (statsRes.success) setStats(statsRes.data);
        }
    };

    // ═══ Export ═══
    const handleExport = async () => {
        setExporting(true);
        try {
            const token = document.cookie.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1]
                || localStorage.getItem("accessToken") || "";
            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/backup/export`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ format: exportFormat, proposals: exportProposals, clients: exportClients, config: exportConfig }),
            });
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `export.${exportFormat}`;
            a.click();
            URL.revokeObjectURL(url);
            setExportDone(true);
            setTimeout(() => { setExportDone(false); setShowExport(false); }, 2000);
        } catch { /* handle err */ }
        setExporting(false);
    };

    // ═══ Delete Data ═══
    const handleDelete = async () => {
        if (deleteConfirmText !== "EXCLUIR") return;
        setDeleting(true);
        await api<any>("/api/backup/delete-data", {
            method: "POST",
            body: JSON.stringify({ proposals: deleteProposals, clients: deleteClients, backupHistory: deleteHistory }),
        });
        setDeleting(false);
        setDeleteDone(true);
        setTimeout(() => {
            setDeleteDone(false);
            setShowDelete(false);
            setDeleteConfirmText("");
            setDeleteProposals(false);
            setDeleteClients(false);
            setDeleteHistory(false);
            loadData();
        }, 2000);
    };

    // ═══ Download ═══
    const handleDownload = async (id: string) => {
        setDownloading(id);
        try {
            const token = document.cookie.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1]
                || localStorage.getItem("accessToken") || "";
            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/backup/download/${id}`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `backup_${id}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { /* handle err */ }
        setTimeout(() => setDownloading(null), 500);
    };

    // ═══ Restore ═══
    const handleRestore = async (id: string) => {
        setRestoring(true);
        const res = await api<any>(`/api/backup/restore/${id}`, { method: "POST" });
        setRestoring(false);
        setRestoreDone(true);
        setRestoreMsg(res.data?.message || "Backup restaurado");
        setRestoreConfirm(null);
        setTimeout(() => setRestoreDone(false), 3000);
    };

    // ═══ Delete Entry ═══
    const handleDeleteEntry = async (id: string) => {
        await api(`/api/backup/history/${id}`, { method: "DELETE" });
        setHistory(prev => prev.filter(b => b.id !== id));
        setDeleteEntryConfirm(null);
        const statsRes = await api<any>("/api/backup/stats");
        if (statsRes.success) setStats(statsRes.data);
    };

    const successCount = history.filter(b => b.status === "success").length;
    const failedCount = history.filter(b => b.status === "failed").length;
    const canDelete = (deleteProposals || deleteClients || deleteHistory) && deleteConfirmText === "EXCLUIR";

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Backup & Dados</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Database size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Backup & Dados</h1>
                            <p className="text-sm text-slate-400">Exportação, backups e política de retenção</p>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60">
                        {saved ? <><CheckCircle2 size={16} /> Salvo!</> : saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar</>}
                    </button>
                </div>
            </motion.div>

            <div className="space-y-6">
                {/* Storage Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Armazenamento", value: stats?.storageUsed || "0 B", sub: `de ${stats?.storageLimit || "50 GB"}`, pct: stats?.storagePct || 0, icon: HardDrive, color: "text-blue-400" },
                        { label: "Total Backups", value: String(stats?.backupCount || history.length), sub: `${stats?.successCount ?? successCount} OK · ${stats?.failedCount ?? failedCount} falha`, pct: 0, icon: Cloud, color: "text-purple-400" },
                        { label: "Propostas", value: String(stats?.proposalCount || 0), sub: "Ilimitado", pct: 0, icon: FileText, color: "text-blue-400" },
                        { label: "Último Backup", value: stats?.lastBackup ? formatDate(stats.lastBackup.date).split(",")[0] : history[0]?.date.split(",")[0] || "—", sub: stats?.lastBackup?.type || history[0]?.type || "", pct: 0, icon: Clock, color: "text-amber-400" },
                    ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                            <s.icon size={16} className={`${s.color} mb-2`} />
                            <span className="text-xl font-bold text-white block">{s.value}</span>
                            <span className="text-[10px] text-slate-600">{s.sub}</span>
                            <span className="text-[10px] uppercase tracking-widest text-slate-600 block mt-0.5">{s.label}</span>
                            {s.pct > 0 && (
                                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                                    <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${s.pct}%` }} />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Auto Backup Config */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <RefreshCw size={16} className="text-blue-400" />
                            <h3 className="text-sm font-bold text-white">Backup Automático Diário</h3>
                        </div>
                        <Toggle enabled={autoBackup} onChange={() => setAutoBackup(!autoBackup)} />
                    </div>
                    {autoBackup && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Retenção (dias)</label>
                                    <div className="flex gap-2">
                                        {[7, 15, 30, 60, 90].map(d => (
                                            <button key={d} onClick={() => setRetentionDays(d)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${retentionDays === d ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-slate-500 border border-white/[0.06] hover:text-white"}`}>{d}d</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Horário</label>
                                    <select value={backupTime} onChange={e => setBackupTime(e.target.value)} className="px-4 py-2 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none">
                                        {["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00"].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Incluir no Backup</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {[
                                        { label: "Propostas", enabled: includeProposals, toggle: () => setIncludeProposals(!includeProposals), icon: FileText },
                                        { label: "Clientes", enabled: includeClients, toggle: () => setIncludeClients(!includeClients), icon: Users },
                                        { label: "Configurações", enabled: includeConfig, toggle: () => setIncludeConfig(!includeConfig), icon: Settings },
                                        { label: "Usuários", enabled: includeUsers, toggle: () => setIncludeUsers(!includeUsers), icon: Users },
                                    ].map(item => (
                                        <button key={item.label} onClick={item.toggle} className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold transition-all ${item.enabled ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 border border-white/[0.06] hover:text-white hover:bg-white/5'}`}>
                                            <item.icon size={12} /> {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Manual Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={handleBackup} disabled={backingUp} className="flex items-center gap-3 p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl hover:bg-white/[0.02] hover:border-white/10 transition-all text-left disabled:opacity-60">
                        {backingUp ? <RefreshCw size={18} className="text-blue-400 animate-spin" /> : backupDone ? <CheckCircle2 size={18} className="text-blue-400" /> : <Upload size={18} className="text-blue-400" />}
                        <div>
                            <span className="text-sm font-bold text-white block">{backingUp ? "Criando backup..." : backupDone ? "Backup criado!" : "Backup Manual"}</span>
                            <span className="text-[10px] text-slate-500">{backingUp ? "Aguarde..." : "Criar backup agora"}</span>
                        </div>
                    </button>
                    <button onClick={() => setShowExport(true)} className="flex items-center gap-3 p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl hover:bg-white/[0.02] hover:border-white/10 transition-all text-left">
                        <Download size={18} className="text-blue-400" />
                        <div>
                            <span className="text-sm font-bold text-white block">Exportar Dados</span>
                            <span className="text-[10px] text-slate-500">JSON / CSV</span>
                        </div>
                    </button>
                    <button onClick={() => setShowDelete(true)} className="flex items-center gap-3 p-4 bg-slate-800/40 border border-red-500/10 rounded-xl hover:bg-red-500/5 transition-all text-left">
                        <Trash2 size={18} className="text-red-400" />
                        <div>
                            <span className="text-sm font-bold text-red-400 block">Excluir Dados</span>
                            <span className="text-[10px] text-slate-500">LGPD compliance</span>
                        </div>
                    </button>
                </div>

                {/* Restore success */}
                <AnimatePresence>
                    {restoreDone && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <CheckCircle2 size={16} className="text-blue-400" />
                            <p className="text-sm text-blue-400 font-semibold">{restoreMsg || "Backup restaurado com sucesso!"}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Backup History */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Clock size={16} className="text-amber-400" /> Histórico de Backups</h3>
                        <span className="text-[10px] text-slate-600">{history.length} registro{history.length !== 1 ? "s" : ""}</span>
                    </div>
                    {history.length === 0 ? (
                        <div className="text-center py-10 text-slate-600">
                            <Database size={28} className="mx-auto mb-2 opacity-20" />
                            <p className="text-xs">Nenhum backup encontrado</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.03]">
                            {history.map(b => (
                                <div key={b.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors group">
                                    <div className="flex items-center gap-3">
                                        {b.status === "success" ? <CheckCircle2 size={14} className="text-blue-400" /> : <AlertTriangle size={14} className="text-red-400" />}
                                        <div>
                                            <span className="text-sm text-white">{b.date}</span>
                                            <span className="text-[10px] text-slate-600 block">{b.type} · {b.size}{b.includes.length > 0 ? ` · ${b.includes.join(", ")}` : ""}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {b.status === "success" && (
                                            <>
                                                <button onClick={() => setDetailBackup(b)} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all" title="Detalhes"><Eye size={14} /></button>
                                                <button onClick={() => handleDownload(b.id)} className={`p-1.5 rounded-lg transition-all ${downloading === b.id ? 'text-blue-400' : 'text-slate-600 hover:text-blue-400 hover:bg-blue-500/5 opacity-0 group-hover:opacity-100'}`} title="Download">
                                                    {downloading === b.id ? <CheckCircle2 size={14} /> : <Download size={14} />}
                                                </button>
                                                <button onClick={() => setRestoreConfirm(b.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-all" title="Restaurar"><RotateCcw size={14} /></button>
                                                <button onClick={() => setDeleteEntryConfirm(b.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/5 opacity-0 group-hover:opacity-100 transition-all" title="Excluir"><Trash2 size={14} /></button>
                                            </>
                                        )}
                                        {b.status === "failed" && (
                                            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Falhou</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ═══ MODAL: Export ═══ */}
            <AnimatePresence>
                {showExport && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowExport(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><FileDown size={16} className="text-blue-400" /> Exportar Dados</h2>
                                <button onClick={() => setShowExport(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Formato</label>
                                    <div className="flex gap-2">
                                        {(["json", "csv"] as const).map(f => (
                                            <button key={f} onClick={() => setExportFormat(f)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${exportFormat === f ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 border border-white/[0.06] hover:text-white'}`}>{f.toUpperCase()}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Dados para Exportar</label>
                                    <div className="space-y-2">
                                        {[
                                            { label: `Propostas (${stats?.proposalCount || 0})`, enabled: exportProposals, toggle: () => setExportProposals(!exportProposals) },
                                            { label: `Clientes (${stats?.clientCount || 0})`, enabled: exportClients, toggle: () => setExportClients(!exportClients) },
                                            { label: "Configurações", enabled: exportConfig, toggle: () => setExportConfig(!exportConfig) },
                                        ].map(item => (
                                            <label key={item.label} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-white/[0.02]">
                                                <input type="checkbox" checked={item.enabled} onChange={item.toggle} className="accent-blue-500" />
                                                <span className="text-sm text-slate-300">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setShowExport(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={handleExport} disabled={(!exportProposals && !exportClients && !exportConfig) || exporting} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all text-white disabled:opacity-40 ${exportDone ? 'bg-blue-600' : 'bg-blue-600 hover:bg-blue-500'}`}>
                                    {exporting ? <><Loader2 size={14} className="animate-spin" /> Exportando...</> : exportDone ? <><CheckCircle2 size={14} /> Baixado!</> : <><Download size={14} /> Exportar {exportFormat.toUpperCase()}</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Delete Data ═══ */}
            <AnimatePresence>
                {showDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-red-400 flex items-center gap-2"><Trash2 size={16} /> Excluir Dados</h2>
                                <button onClick={() => setShowDelete(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                                    <p className="text-[11px] text-red-300/80">Esta ação é <strong>irreversível</strong>. Os dados excluídos não podem ser recuperados. Em conformidade com a LGPD.</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Selecione o que excluir</label>
                                    <div className="space-y-2">
                                        {[
                                            { label: "Todas as Propostas", desc: `${stats?.proposalCount || 0} propostas serão excluídas`, enabled: deleteProposals, toggle: () => setDeleteProposals(!deleteProposals) },
                                            { label: "Todos os Clientes", desc: `${stats?.clientCount || 0} clientes serão excluídos`, enabled: deleteClients, toggle: () => setDeleteClients(!deleteClients) },
                                            { label: "Histórico de Backups", desc: `${history.length} registros serão excluídos`, enabled: deleteHistory, toggle: () => setDeleteHistory(!deleteHistory) },
                                        ].map(item => (
                                            <label key={item.label} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-white/[0.02]">
                                                <input type="checkbox" checked={item.enabled} onChange={item.toggle} className="accent-red-500 mt-0.5" />
                                                <div>
                                                    <span className="text-sm text-slate-300 block">{item.label}</span>
                                                    <span className="text-[10px] text-slate-600">{item.desc}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {(deleteProposals || deleteClients || deleteHistory) && (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Digite <span className="text-red-400">EXCLUIR</span> para confirmar</label>
                                        <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="EXCLUIR" className="w-full px-4 py-2.5 bg-slate-800/50 border border-red-500/20 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 font-mono" />
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setShowDelete(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={handleDelete} disabled={!canDelete || deleting} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all text-white disabled:opacity-40 ${deleteDone ? 'bg-blue-600' : 'bg-red-600 hover:bg-red-500'}`}>
                                    {deleting ? <><Loader2 size={14} className="animate-spin" /> Excluindo...</> : deleteDone ? <><CheckCircle2 size={14} /> Excluído!</> : <><Trash2 size={14} /> Excluir Permanentemente</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Backup Detail ═══ */}
            <AnimatePresence>
                {detailBackup && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setDetailBackup(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><ShieldCheck size={16} className="text-blue-400" /> Detalhes do Backup</h2>
                                <button onClick={() => setDetailBackup(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-3">
                                {[
                                    { label: "Data", value: detailBackup.date },
                                    { label: "Tipo", value: detailBackup.type },
                                    { label: "Tamanho", value: detailBackup.size },
                                    { label: "Status", value: detailBackup.status === "success" ? "✅ Sucesso" : "❌ Falhou" },
                                    { label: "Inclui", value: detailBackup.includes.join(", ") || "—" },
                                ].map(r => (
                                    <div key={r.label} className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{r.label}</span>
                                        <span className="text-sm text-white">{r.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex gap-2">
                                <button onClick={() => { handleDownload(detailBackup.id); setDetailBackup(null); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/5"><Download size={14} /> Download</button>
                                <button onClick={() => { setRestoreConfirm(detailBackup.id); setDetailBackup(null); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-amber-400 border border-amber-500/20 rounded-xl hover:bg-amber-500/5"><RotateCcw size={14} /> Restaurar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Restore Confirm ═══ */}
            <AnimatePresence>
                {restoreConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setRestoreConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-amber-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3"><RotateCcw size={20} className="text-amber-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Restaurar Backup?</h3>
                                <p className="text-sm text-slate-400">Os dados atuais serão substituídos pelo conteúdo deste backup. Esta ação não pode ser desfeita.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setRestoreConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => restoreConfirm && handleRestore(restoreConfirm)} disabled={restoring} className="flex-1 px-4 py-2.5 text-sm text-white bg-amber-600 hover:bg-amber-500 rounded-xl font-semibold flex items-center justify-center gap-2">
                                    {restoring ? <><Loader2 size={14} className="animate-spin" /> Restaurando...</> : <><RotateCcw size={14} /> Restaurar</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Delete Entry Confirm ═══ */}
            <AnimatePresence>
                {deleteEntryConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setDeleteEntryConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Excluir Backup?</h3>
                                <p className="text-sm text-slate-400">Este backup será removido permanentemente do histórico.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteEntryConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => deleteEntryConfirm && handleDeleteEntry(deleteEntryConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
