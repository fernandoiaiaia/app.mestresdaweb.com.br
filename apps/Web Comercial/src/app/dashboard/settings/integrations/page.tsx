"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, Settings, Plug, CheckCircle2,
    Search, X, Key, Eye, EyeOff, ChevronRight,
    Shield, Copy, Clock, Plus, AlertTriangle,
    Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
    initialIntegrations, statusConfig, categoryIcons,
    providerMap, type Integration,
} from "./integrations-data";

/* ═══ API KEYS (local mock) ═══ */

const uid = () => "id-" + Math.random().toString(36).slice(2, 9);

interface ApiKey {
    id: string;
    name: string;
    key: string;
    type: "public" | "secret";
    createdAt: string;
    lastUsed: string | null;
    permissions: string[];
    status: "active" | "revoked";
}

const allPerms = ["read:proposals", "write:proposals", "read:clients", "write:clients", "webhook:receive", "read:analytics"];

const initialApiKeys: ApiKey[] = [
    { id: uid(), name: "Produção - Frontend", key: "pk_live_a8f3k2m9x7b4c1d6e0f5g8h2", type: "public", createdAt: "15 Jan 2026", lastUsed: "04 Mar 2026", permissions: ["read:proposals", "write:proposals", "read:clients"], status: "active" },
    { id: uid(), name: "Webhook - Stripe", key: "sk_live_j4l7n0p3r6t9v2x5z8a1c4f7", type: "secret", createdAt: "20 Jan 2026", lastUsed: "04 Mar 2026", permissions: ["webhook:receive", "write:proposals"], status: "active" },
    { id: uid(), name: "Integração CRM", key: "sk_live_h9i2k5m8o1q4s7u0w3y6b9d2", type: "secret", createdAt: "01 Fev 2026", lastUsed: null, permissions: ["read:clients", "write:clients"], status: "active" },
    { id: uid(), name: "App Mobile (Dev)", key: "pk_test_e6f9g2h5j8k1l4n7p0r3s6t9", type: "public", createdAt: "10 Nov 2025", lastUsed: "15 Fev 2026", permissions: ["read:proposals"], status: "revoked" },
];

const ITEMS_PER_PAGE = 12;

/* ═══ COMPONENT ═══ */

export default function IntegrationsPage() {
    const router = useRouter();
    const [integrations, setIntegrations] = useState(initialIntegrations);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<"integrations" | "apikeys">("integrations");

    // API Keys state
    const [apiKeys, setApiKeys] = useState(initialApiKeys);
    const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [showCreateKey, setShowCreateKey] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [newKeyType, setNewKeyType] = useState<"public" | "secret">("public");
    const [newKeyPerms, setNewKeyPerms] = useState<string[]>(["read:proposals"]);
    const [revokeKeyConfirm, setRevokeKeyConfirm] = useState<string | null>(null);

    // Load integration statuses from API on mount
    useEffect(() => {
        async function loadStatuses() {
            try {
                const data = await api<any[]>("/api/integrations");
                if (data.success && data.data) {
                    setIntegrations(prev => prev.map(integ => {
                        const provider = providerMap[integ.id];
                        if (!provider) return integ;
                        const setting = (data.data as any[]).find((s: any) => s.provider === provider);
                        if (!setting) return integ;
                        return {
                            ...integ,
                            status: setting.isActive ? "connected" as const : "disconnected" as const,
                            lastSync: setting.lastSyncAt ? new Date(setting.lastSyncAt).toLocaleDateString("pt-BR") : null,
                        };
                    }));
                }
            } catch { /* API offline — use defaults */ }
        }
        loadStatuses();
    }, []);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(integrations.map(i => i.category)));
        const priority = ["Propostas", "SDR Automático"];
        return cats.sort((a, b) => {
            const ai = priority.indexOf(a);
            const bi = priority.indexOf(b);
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [integrations]);

    const filtered = useMemo(() => {
        let result = integrations;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
        }
        if (filterStatus !== "all") result = result.filter(i => i.status === filterStatus);
        if (filterCategory !== "all") result = result.filter(i => i.category === filterCategory);
        return result;
    }, [integrations, search, filterStatus, filterCategory]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const connectedCount = integrations.filter(i => i.status === "connected").length;

    const setSearchAndReset = (v: string) => { setSearch(v); setPage(1); };
    const setStatusAndReset = (v: string) => { setFilterStatus(v); setPage(1); };
    const setCategoryAndReset = (v: string) => { setFilterCategory(v); setPage(1); };

    // Card click → navigate to detail page
    const handleCardClick = (integ: Integration) => {
        if (integ.status === "coming_soon") return;
        router.push(`/dashboard/settings/integrations/${integ.id}`);
    };

    // API Keys handlers
    const handleCopyKey = (id: string, key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKeyId(id);
        setTimeout(() => setCopiedKeyId(null), 2000);
    };
    const handleRevokeKey = (id: string) => {
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: "revoked" as const } : k));
        setRevokeKeyConfirm(null);
    };
    const handleDeleteKey = (id: string) => {
        setApiKeys(prev => prev.filter(k => k.id !== id));
    };
    const togglePerm = (p: string) => {
        setNewKeyPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    };
    const handleCreateKey = () => {
        if (!newKeyName.trim()) return;
        const prefix = newKeyType === "public" ? "pk_live_" : "sk_live_";
        const randomKey = prefix + Array.from({ length: 24 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
        const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
        setApiKeys(prev => [...prev, { id: uid(), name: newKeyName.trim(), key: randomKey, type: newKeyType, createdAt: now, lastUsed: null, permissions: [...newKeyPerms], status: "active" }]);
        setShowCreateKey(false); setNewKeyName(""); setNewKeyType("public"); setNewKeyPerms(["read:proposals"]);
    };
    const activeKeys = apiKeys.filter(k => k.status === "active").length;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Integrações</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Plug size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Integrações & API</h1>
                            <p className="text-sm text-slate-400">{connectedCount} de {integrations.length} integrações ativas · {activeKeys} chaves de API</p>
                        </div>
                    </div>
                    {activeTab === "apikeys" && (
                        <button onClick={() => setShowCreateKey(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                            <Plus size={16} /> Nova Chave
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-800/40 border border-white/[0.06] rounded-xl mb-6">
                <button onClick={() => setActiveTab("integrations")} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "integrations" ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Plug size={14} /> Integrações ({integrations.length})
                </button>
                <button onClick={() => setActiveTab("apikeys")} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "apikeys" ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Key size={14} /> Chaves de API ({apiKeys.length})
                </button>
            </div>

            {activeTab === "integrations" ? (<>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: "Total", value: integrations.length, color: "text-white" },
                        { label: "Conectadas", value: connectedCount, color: "text-blue-400" },
                        { label: "Disponíveis", value: integrations.filter(i => i.status === "disconnected").length, color: "text-slate-400" },
                        { label: "Em Breve", value: integrations.filter(i => i.status === "coming_soon").length, color: "text-amber-400" },
                    ].map(stat => (
                        <div key={stat.label} className="p-3 bg-slate-800/40 border border-white/[0.06] rounded-xl text-center">
                            <span className={`text-xl font-bold block ${stat.color}`}>{stat.value}</span>
                            <span className="text-[9px] uppercase tracking-widest text-slate-600">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Search & Filters */}
                <div className="flex flex-wrap gap-3 mb-5">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input
                            type="text" value={search} onChange={e => setSearchAndReset(e.target.value)}
                            placeholder="Buscar integração..."
                            className="w-full pl-9 pr-8 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40"
                        />
                        {search && <button onClick={() => setSearchAndReset("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"><X size={14} /></button>}
                    </div>
                    <div className="flex gap-2">
                        {[{ key: "all", label: "Todas" }, { key: "connected", label: "Conectadas" }, { key: "disconnected", label: "Disponíveis" }, { key: "coming_soon", label: "Em Breve" }].map(f => (
                            <button key={f.key} onClick={() => setStatusAndReset(f.key)} className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${filterStatus === f.key ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-slate-500 border border-white/[0.06] hover:text-white hover:bg-white/5"}`}>{f.label}</button>
                        ))}
                    </div>
                    <select value={filterCategory} onChange={e => setCategoryAndReset(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-xs text-slate-300 focus:outline-none">
                        <option value="all">Todas categorias</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
                    <span className="text-[10px] text-slate-600">Página {page} de {totalPages}</span>
                </div>

                {/* Cards Grid */}
                {paginated.length === 0 ? (
                    <div className="text-center py-16 text-slate-600">
                        <Plug size={36} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm mb-1">Nenhuma integração encontrada</p>
                        <p className="text-xs text-slate-700">Tente ajustar os filtros ou busca</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        {paginated.map((integ, i) => {
                            const Icon = integ.icon;
                            const st = statusConfig[integ.status];
                            return (
                                <motion.div
                                    key={integ.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    onClick={() => handleCardClick(integ)}
                                    className={`bg-slate-800/40 border border-white/[0.06] rounded-xl p-4 transition-all group ${integ.status !== "coming_soon" ? "hover:bg-white/[0.03] hover:border-white/10 cursor-pointer" : "opacity-60"}`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-9 h-9 rounded-lg bg-slate-700/50 border border-slate-600/30 flex items-center justify-center shrink-0">
                                            <Icon size={16} className={integ.status === "connected" ? "text-blue-400" : "text-slate-400"} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-bold text-white truncate">{integ.name}</h3>
                                            <span className="text-[9px] text-slate-600">{integ.category}</span>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} title={st.label} />
                                    </div>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 mb-2">{integ.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border ${st.color}`}>{st.label}</span>
                                        {integ.status !== "coming_soon" && (
                                            <ChevronRight size={12} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-lg border border-white/[0.06] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            ← Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>{p}</button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-lg border border-white/[0.06] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            Próxima →
                        </button>
                    </div>
                )}
            </>) : (<>
                {/* ═══ API KEYS TAB ═══ */}

                {/* Warning */}
                <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl mb-6">
                    <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-300/80">Mantenha suas chaves em segredo. Nunca exponha chaves <code className="text-amber-300 font-mono bg-amber-500/10 px-1 rounded">sk_live_</code> no frontend.</p>
                </div>

                {/* Keys List */}
                <div className="space-y-3">
                    {apiKeys.length === 0 && (
                        <div className="text-center py-14 text-slate-600">
                            <Key size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm mb-2">Nenhuma chave de API criada</p>
                            <button onClick={() => setShowCreateKey(true)} className="text-sm text-blue-400 hover:text-blue-300">+ Criar primeira chave</button>
                        </div>
                    )}
                    {apiKeys.map((k, i) => (
                        <motion.div key={k.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 ${k.status === "revoked" ? "opacity-50" : ""}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-bold text-white">{k.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${k.status === "active" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
                                            {k.status === "active" ? "Ativa" : "Revogada"}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider ${k.type === "public" ? "text-blue-400 bg-blue-500/10" : "text-purple-400 bg-purple-500/10"}`}>
                                            {k.type === "public" ? "pk_" : "sk_"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono text-sm">
                                        <span className="text-slate-400">
                                            {visibleKeyId === k.id ? k.key : `${k.key.slice(0, 12)}${'•'.repeat(20)}`}
                                        </span>
                                        <button onClick={() => setVisibleKeyId(visibleKeyId === k.id ? null : k.id)} className="p-1 text-slate-600 hover:text-white transition-colors">
                                            {visibleKeyId === k.id ? <Eye size={12} /> : <EyeOff size={12} />}
                                        </button>
                                        <button onClick={() => handleCopyKey(k.id, k.key)} className="p-1 text-slate-600 hover:text-white transition-colors">
                                            {copiedKeyId === k.id ? <CheckCircle2 size={12} className="text-blue-400" /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {k.status === "active" && (
                                        <button onClick={() => setRevokeKeyConfirm(k.id)} className="px-3 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-all">Revogar</button>
                                    )}
                                    {k.status === "revoked" && (
                                        <button onClick={() => handleDeleteKey(k.id)} className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:bg-white/5 rounded-lg border border-white/[0.06] transition-all flex items-center gap-1"><Trash2 size={10} /> Remover</button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {k.permissions.map(p => (
                                    <span key={p} className="px-1.5 py-0.5 bg-slate-800 text-[8px] font-bold uppercase tracking-wider text-slate-500 rounded font-mono">{p}</span>
                                ))}
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-slate-600">
                                <span className="flex items-center gap-1"><Clock size={10} /> Criada: {k.createdAt}</span>
                                <span className="flex items-center gap-1"><Shield size={10} /> Último uso: {k.lastUsed || "Nunca"}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Create Key Modal */}
                <AnimatePresence>
                    {showCreateKey && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowCreateKey(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                                    <h2 className="text-base font-bold text-white flex items-center gap-2"><Key size={16} className="text-blue-400" /> Nova Chave de API</h2>
                                    <button onClick={() => setShowCreateKey(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                                </div>
                                <div className="px-6 py-5 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome da Chave <span className="text-red-400">*</span></label>
                                        <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Ex: Integração CRM Externo" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Tipo</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setNewKeyType("public")} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${newKeyType === "public" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-slate-500 border border-white/[0.06] hover:text-white hover:bg-white/5"}`}>Pública (pk_)</button>
                                            <button onClick={() => setNewKeyType("secret")} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${newKeyType === "secret" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-slate-500 border border-white/[0.06] hover:text-white hover:bg-white/5"}`}>Secreta (sk_)</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Permissões</label>
                                        <div className="space-y-1.5">
                                            {allPerms.map(p => (
                                                <label key={p} className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg cursor-pointer hover:bg-white/[0.02]">
                                                    <input type="checkbox" checked={newKeyPerms.includes(p)} onChange={() => togglePerm(p)} className="accent-blue-500" />
                                                    <span className="text-sm text-slate-300 font-mono">{p}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
                                    <button onClick={() => setShowCreateKey(false)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
                                    <button onClick={handleCreateKey} disabled={!newKeyName.trim() || newKeyPerms.length === 0} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-all">
                                        <Key size={14} /> Gerar Chave
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Revoke Key Confirm */}
                <AnimatePresence>
                    {revokeKeyConfirm && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setRevokeKeyConfirm(null)}>
                            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                                <div className="text-center mb-4">
                                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Shield size={20} className="text-red-400" /></div>
                                    <h3 className="text-base font-bold text-white mb-1">Revogar Chave?</h3>
                                    <p className="text-sm text-slate-400">A chave será desativada imediatamente. Aplicações que a usam perderão acesso.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setRevokeKeyConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                    <button onClick={() => revokeKeyConfirm && handleRevokeKey(revokeKeyConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Revogar</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>)}
        </div>
    );
}
