"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft, Plug, Settings, CheckCircle2, XCircle,
    RefreshCw, Zap, Save, Key, Eye, EyeOff, ArrowLeft,
    Clock, AlertCircle, Copy, X, Webhook, Calendar,
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from "@/lib/api";
import {
    findIntegration, initialIntegrations, statusConfig,
    providerMap, credentialKeyMap, isMappedIntegration,
    type Integration,
} from "../integrations-data";

export default function IntegrationDetailPage({ params }: { params: Promise<{ provider: string }> }) {
    const { provider: providerId } = use(params);

    // Find integration definition
    const definition = findIntegration(providerId);

    // State — lazy initializer runs exactly ONCE per mount, guaranteed non-null if definition exists
    const [integration, setIntegration] = useState<Integration | null>(() => {
        const def = findIntegration(providerId);
        return def ? { ...def } : null;
    });
    const [configValues, setConfigValues] = useState<Record<string, string>>(() => {
        const def = findIntegration(providerId);
        const vals: Record<string, string> = {};
        def?.configFields?.forEach(f => { vals[f.key] = f.value; });
        return vals;
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [configSaved, setConfigSaved] = useState(false);
    const [disconnectConfirm, setDisconnectConfirm] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
    const [testing, setTesting] = useState(false);
    
    // Webhook specifics
    const [systemUsers, setSystemUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState("");
    
    // Enrich with saved API data (if any) — does NOT block rendering
    const [googleLoading, setGoogleLoading] = useState(false);
    useEffect(() => {
        const apiProvider = providerMap[providerId];
        if (!apiProvider) return;

        let cancelled = false;
        api<any>(`/api/integrations/${apiProvider}`)
            .then(res => {
                if (cancelled) return;
                if (res.success && res.data) {
                    const def = findIntegration(providerId);
                    if (!def) return;
                    const creds = (res.data.credentials || {}) as Record<string, string>;
                    const updatedFields = def.configFields?.map(f => ({ ...f, value: creds[f.key] || f.value }));
                    const updatedVals: Record<string, string> = { ...creds };
                    updatedFields?.forEach(f => { updatedVals[f.key] = f.value; });

                    // For Google Calendar, only consider "connected" if real OAuth tokens exist
                    let resolvedStatus: "connected" | "disconnected" = res.data.isActive ? "connected" : "disconnected";
                    if (apiProvider === "google_calendar") {
                        const hasTokens = !!(creds.access_token && creds.refresh_token);
                        resolvedStatus = (res.data.isActive && hasTokens) ? "connected" : "disconnected";
                    }

                    setIntegration({
                        ...def,
                        status: resolvedStatus,
                        lastSync: res.data.lastSyncAt ? new Date(res.data.lastSyncAt).toLocaleDateString("pt-BR") : null,
                        configFields: updatedFields,
                    });
                    setConfigValues(updatedVals);
                }
            })
            .catch(() => { /* keep defaults */ });

        return () => { cancelled = true; };
    }, [providerId]);

    // Fetch users for Webhook Round-Robin
    useEffect(() => {
        if (providerId === "inbound_webhook" || providerId === "sdr_whatsapp") {
            api<any>("/api/users").then(res => {
                if (res.success && res.data) setSystemUsers(res.data);
            });
        }
    }, [providerId]);

    // Handlers
    const handleConnect = async () => {
        if (!integration) return;
        setIntegration(prev => prev ? { ...prev, status: "connected", lastSync: "Agora" } : prev);
        const apiProvider = providerMap[providerId];
        if (apiProvider) {
            try {
                // Collect current credentials to preserve them
                const credentials: Record<string, string> = {};
                const keys = credentialKeyMap[apiProvider] || [];
                keys.forEach(k => { if (configValues[k]) credentials[k] = configValues[k]; });
                await api(`/api/integrations/${apiProvider}`, {
                    method: "PUT",
                    body: { credentials, isActive: true },
                });
            } catch { /* ignore */ }
        }
    };

    const handleDisconnect = async () => {
        if (!integration) return;
        setIntegration(prev => prev ? { ...prev, status: "disconnected", lastSync: null } : prev);
        setDisconnectConfirm(false);
        const apiProvider = providerMap[providerId];
        if (apiProvider) {
            try {
                const credentials: Record<string, string> = {};
                const keys = credentialKeyMap[apiProvider] || [];
                keys.forEach(k => { if (configValues[k]) credentials[k] = configValues[k]; });
                await api(`/api/integrations/${apiProvider}`, {
                    method: "PUT",
                    body: { credentials, isActive: false },
                });
            } catch { /* ignore */ }
        }
    };

    const handleSync = async () => {
        if (!integration) return;
        setSyncing(true);
        const apiProvider = providerMap[providerId];
        if (apiProvider) {
            try {
                const data = await api<any>(`/api/integrations/${apiProvider}/test`, { method: "POST" });
                if (data.success) setTestResult(data.data);
            } catch { /* ignore */ }
        }
        setTimeout(() => {
            setIntegration(prev => prev ? { ...prev, lastSync: "Agora" } : prev);
            setSyncing(false);
        }, 1000);
    };

    const handleSaveConfig = async () => {
        if (!integration) return;
        // Update local state
        setIntegration(prev => {
            if (!prev) return prev;
            const updatedFields = prev.configFields?.map(f => ({ ...f, value: configValues[f.key] || f.value }));
            return { ...prev, configFields: updatedFields };
        });
        // Save to API — preserve current status (don't auto-activate)
        const apiProvider = providerMap[providerId];
        if (apiProvider) {
            try {
                const credentials: Record<string, string> = {};
                const keys = credentialKeyMap[apiProvider] || [];
                keys.forEach(k => { if (configValues[k]) credentials[k] = configValues[k]; });
                const res = await api(`/api/integrations/${apiProvider}`, {
                    method: "PUT",
                    body: { credentials, isActive: integration.status === "connected" },
                });
                if (!res.success) {
                    const errMsg = (res as any)?.error?.message || (res as any)?.message || "Erro ao salvar";
                    console.error("Erro ao salvar integração:", errMsg, res);
                    toast.error(`Erro ao salvar: ${errMsg}`);
                    setConfigSaved(false);
                    return;
                }
            } catch (err: any) {
                const msg = err?.message || err?.error?.message || "Erro de rede ao salvar";
                console.error("Erro ao salvar integração:", msg, err);
                toast.error(`Erro ao salvar: ${msg}`);
                setConfigSaved(false);
                return;
            }
        }
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 2000);
    };

    const handleTestConnection = async () => {
        if (!integration) return;
        const apiProvider = providerMap[providerId];
        if (!apiProvider) return;
        setTesting(true);
        setTestResult(null);
        try {
            // First save credentials
            const credentials: Record<string, string> = {};
            const keys = credentialKeyMap[apiProvider] || [];
            keys.forEach(k => { if (configValues[k]) credentials[k] = configValues[k]; });
            const saveRes = await api(`/api/integrations/${apiProvider}`, {
                method: "PUT",
                body: { credentials, isActive: integration.status === "connected" },
            });
            if (!saveRes.success) {
                const errMsg = (saveRes as any)?.error?.message || (saveRes as any)?.message || "Erro ao salvar credenciais";
                setTestResult({ valid: false, message: `Erro ao salvar: ${errMsg}` });
                return;
            }
            // Then test
            const data = await api<any>(`/api/integrations/${apiProvider}/test`, { method: "POST" });
            if (data.success && data.data) {
                setTestResult(data.data);
            } else {
                const errMsg = (data as any)?.error?.message || (data as any)?.message || "Teste falhou";
                setTestResult({ valid: false, message: errMsg });
            }
        } catch (err: any) {
            const msg = err?.message || "Erro de conexão com o servidor";
            setTestResult({ valid: false, message: msg });
        } finally {
            setTesting(false);
        }
    };

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    const webhookUrl = typeof window !== "undefined" 
        ? `${window.location.protocol}//${window.location.host}/api/webhooks/inbound` 
        : `/api/webhooks/inbound`;

    const getAssignees = (): string[] => {
        try {
            return JSON.parse(configValues["assignees"] || "[]");
        } catch { return []; }
    };

    const toggleAssignee = (userId: string) => {
        const curr = getAssignees();
        const next = curr.includes(userId) ? curr.filter(id => id !== userId) : [...curr, userId];
        setConfigValues(prev => ({ ...prev, assignees: JSON.stringify(next) }));
    };

    // Not found
    if (!definition) {
        return (
            <div className="p-6 md:p-10 max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                    <Link href="/dashboard/settings/integrations" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ArrowLeft size={16} /><Plug size={14} /><span>Integrações</span>
                    </Link>
                </div>
                <div className="text-center py-20">
                    <Plug size={36} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm text-slate-500">Integração não encontrada</p>
                </div>
            </div>
        );
    }

    // integration is guaranteed non-null here (lazy initializer), but keep guard for TS
    if (!integration) {
        return (
            <div className="p-6 md:p-10 max-w-3xl mx-auto flex items-center justify-center min-h-[400px]">
                <RefreshCw size={24} className="text-slate-600 animate-spin" />
            </div>
        );
    }

    const status = statusConfig[integration.status];
    const Icon = integration.icon;

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6">
                    <Link href="/dashboard/settings/integrations" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ArrowLeft size={16} /><Plug size={14} /><span>Integrações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">{integration.name}</span>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-white/[0.06] flex items-center justify-center">
                            <Icon size={28} className={integration.status === "connected" ? "text-blue-400" : "text-slate-400"} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold text-white">{integration.name}</h1>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${status.color}`}>{status.label}</span>
                            </div>
                            <p className="text-sm text-slate-400">{integration.description}</p>
                            <p className="text-[10px] text-slate-600 mt-1">{integration.category} · {integration.details}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {providerId !== "sdr_google_calendar" && (
                    <div className="flex items-center gap-3 mb-6">
                        {integration.status === "connected" ? (
                            <>
                                <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 border border-white/[0.08] rounded-xl hover:bg-white/5 transition-all">
                                    <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> {syncing ? "Sincronizando..." : "Sincronizar Agora"}
                                </button>
                                <button onClick={() => setDisconnectConfirm(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/5 transition-all">
                                    <XCircle size={14} /> Desconectar
                                </button>
                                {integration.lastSync && (
                                    <span className="text-[10px] text-slate-600 flex items-center gap-1 ml-2"><Clock size={10} /> Última sync: {integration.lastSync}</span>
                                )}
                            </>
                        ) : integration.status === "disconnected" ? (
                            <button onClick={handleConnect} className="flex items-center gap-2 px-5 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all">
                                <Plug size={14} /> Conectar
                            </button>
                        ) : (
                            <span className="text-sm text-amber-400 italic flex items-center gap-2"><AlertCircle size={14} /> Em breve — esta integração ainda não está disponível</span>
                        )}
                    </div>
                )}

                {/* Disconnect confirm */}
                <AnimatePresence>
                    {disconnectConfirm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                                <p className="text-sm text-red-400 mb-3">Tem certeza que deseja desconectar <strong>{integration.name}</strong>? Os dados de configuração serão preservados.</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setDisconnectConfirm(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                    <button onClick={handleDisconnect} className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-500 rounded-lg font-semibold">Confirmar Desconexão</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Config Fields */}
                {providerId === "inbound_webhook" && (
                    <div className="mb-6 bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
                        <h3 className="text-sm font-bold text-white mb-4">Aprenda a conectar com sua plataforma:</h3>
                        <div className="flex flex-wrap gap-2">
                            <a href="/dashboard/settings/integrations/tutorial-html" className="flex items-center gap-2 px-4 py-2 bg-[#E34F26]/10 hover:bg-[#E34F26]/20 border border-[#E34F26]/30 text-[#FF7F59] rounded-xl text-xs font-semibold transition-all">
                                HTML Personalizado
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#92003B]/10 hover:bg-[#92003B]/20 border border-[#92003B]/30 text-[#FF5D8F] rounded-xl text-xs font-semibold transition-all">
                                Elementor
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1C3646]/30 hover:bg-[#1C3646]/50 border border-[#276B8E]/50 text-[#3F9EBD] rounded-xl text-xs font-semibold transition-all">
                                RD Station
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#FF4F00]/10 hover:bg-[#FF4F00]/20 border border-[#FF4F00]/30 text-[#FF7033] rounded-xl text-xs font-semibold transition-all">
                                Zapier
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#5B10FF]/10 hover:bg-[#5B10FF]/20 border border-[#5B10FF]/30 text-[#8E5BFF] rounded-xl text-xs font-semibold transition-all">
                                Make (Integromat)
                            </a>
                        </div>
                    </div>
                )}
                
                {providerId === "sdr_google_calendar" && (
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Calendar size={14} className="text-blue-400" /> Autenticação OAuth2</h3>
                        {integration.status === "connected" ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                                    <CheckCircle2 className="text-blue-400" size={24} />
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-400">Google Calendar Conectado</h4>
                                        <p className="text-xs text-blue-300/80">O chatbot agora pode ler sua agenda e marcar reuniões automaticamente.</p>
                                    </div>
                                </div>
                                <button onClick={async () => {
                                    if(confirm("Tem certeza que deseja desconectar o Google Calendar?")) {
                                        try {
                                            await api("/api/integrations/google/disconnect", { method: "DELETE" });
                                            toast.success("Google Calendar desconectado.");
                                        } catch { /* ignore */ }
                                        window.location.reload();
                                    }
                                }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors border border-red-500/20">
                                    Desconectar Agenda
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400 mb-4">Para que a inteligência artificial possa agendar reuniões em seu nome, você precisa autorizar o acesso à sua agenda do Google.</p>
                                <button 
                                    disabled={googleLoading}
                                    onClick={async () => {
                                    setGoogleLoading(true);
                                    try {
                                        console.log("[Google Calendar] Requesting auth URL...");
                                        const res = await api<any>("/api/integrations/google/auth-url");
                                        console.log("[Google Calendar] Response:", JSON.stringify(res));
                                        if(res.success && res.data?.url) {
                                            toast.success("Redirecionando para o Google...");
                                            window.location.href = res.data.url;
                                            return; // Don't reset loading — page will redirect
                                        } else {
                                            const errMsg = (typeof res?.error === 'string' ? res.error : res?.error?.message) || res?.message || "Resposta inesperada do servidor";
                                            console.error("[Google Calendar] auth-url failed:", res);
                                            toast.error(`Falha ao conectar: ${errMsg}`);
                                        }
                                    } catch(e: any) {
                                        console.error("[Google Calendar] auth-url error:", e);
                                        toast.error(e?.message || "Falha ao gerar URL do Google. Verifique as credenciais OAuth no servidor.");
                                    }
                                    setGoogleLoading(false);
                                }} className={`flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors ${googleLoading ? 'opacity-60 cursor-wait' : ''}`}>
                                    {googleLoading ? (
                                        <RefreshCw size={18} className="animate-spin text-slate-600" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                                    )}
                                    {googleLoading ? "Conectando..." : "Conectar Google Calendar"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {integration.configFields && integration.configFields.length > 0 && integration.status !== "coming_soon" && (
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Key size={14} className="text-blue-400" /> Configuração</h3>
                        <div className="space-y-4">
                            {integration.configFields.filter(f => f.key !== "assignees").map(f => (
                                <div key={f.key}>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">{f.label}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type={f.key.includes("key") || f.key.includes("Key") || f.key.includes("secret") || f.key.includes("Secret") || f.key.includes("token") || f.key.includes("Token") || f.key === "sk" || f.key === "ak" ? (showApiKey ? "text" : "password") : "text"}
                                            value={configValues[f.key] || ""}
                                            onChange={e => setConfigValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                                            placeholder={f.placeholder}
                                            className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40"
                                        />
                                        {(f.key.includes("key") || f.key.includes("Key") || f.key.includes("secret") || f.key.includes("token") || f.key.includes("Token") || f.key === "sk" || f.key === "ak") && (
                                            <>
                                                <button onClick={() => setShowApiKey(!showApiKey)} className="px-3 py-2.5 rounded-xl border border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                                                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button onClick={() => copyToClipboard(configValues[f.key] || "", f.key)} className={`px-3 py-2.5 rounded-xl border transition-all ${copied === f.key ? 'border-blue-500/20 text-blue-400 bg-blue-500/5' : 'border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/5'}`}>
                                                    {copied === f.key ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* WEBHOOK CUSTOM / WHATSAPP: ASSIGNEES SELECTOR */}
                            {(providerId === "inbound_webhook" || providerId === "sdr_whatsapp") && (
                                <div className="mt-8 pt-6 border-t border-white/[0.06]">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Distribuir Leads para (Round-Robin)</label>
                                    <p className="text-xs text-slate-400 mb-3">Selecione os vendedores que receberão os leads. Se mais de um for escolhido, o sistema distribuirá igualmente um por vez.</p>
                                    
                                    <input 
                                        type="text" 
                                        placeholder="Buscar vendedor por nome..." 
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 mb-3"
                                    />

                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {systemUsers
                                            .filter(u => u.role !== "VIEWER") // exclude clients
                                            .filter(u => !(u.email === "fcesarf@hotmail.com" || (u.position && (u.position.toLowerCase().includes("dev") || u.position.toLowerCase().includes("programador") || u.position.toLowerCase().includes("tech") || u.position.toLowerCase().includes("fullstack") || u.position.toLowerCase().includes("engenheiro"))))) // exclude devs
                                            .filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()))
                                            .map(u => {
                                            const isSelected = getAssignees().includes(u.id);
                                            return (
                                                <div 
                                                    key={u.id} 
                                                    onClick={() => toggleAssignee(u.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-slate-800/50 border-white/[0.04] text-slate-400 hover:bg-slate-800'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-600'}`}>
                                                        {isSelected && <CheckCircle2 size={12} />}
                                                    </div>
                                                    <span className="text-sm font-medium">{u.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {getAssignees().length === 0 && (
                                        <div className="mt-2 text-xs flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                                            <AlertCircle size={14} /> Selecione pelo menos um vendedor para os leads não ficarem perdidos.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-6">
                            <button onClick={handleSaveConfig} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all text-white ${configSaved ? 'bg-blue-600' : 'bg-blue-600 hover:bg-blue-500'}`}>
                                {configSaved ? <><CheckCircle2 size={14} /> Salvo!</> : <><Save size={14} /> Salvar Configuração</>}
                            </button>
                            {isMappedIntegration(providerId) && (
                                <button onClick={handleTestConnection} disabled={testing} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50">
                                    {testing ? <><RefreshCw size={14} className="animate-spin" /> Testando...</> : <><Zap size={14} /> Testar Conexão</>}
                                </button>
                            )}
                        </div>
                        {testResult && (
                            <div className={`mt-3 p-3 rounded-xl border text-sm flex items-center gap-2 ${testResult.valid ? 'bg-blue-500/5 border-blue-500/20 text-blue-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                                {testResult.valid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                {testResult.message}
                            </div>
                        )}
                    </div>
                )}

                {/* WEBHOOK CUSTOM: MANUAL INSTRUCTIONS */}
                {providerId === "inbound_webhook" && integration.status === "connected" && configValues["secretToken"] && (
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Webhook size={14} className="text-purple-400" /> Manual de Integração</h3>
                        
                        <div className="mb-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">URL do Webhook (POST)</label>
                            <div className="flex gap-2">
                                <code className="flex-1 block px-3 py-2.5 bg-slate-900 border border-white/[0.08] rounded-xl text-xs text-blue-300 overflow-x-auto whitespace-nowrap">
                                    {webhookUrl}
                                </code>
                                <button onClick={() => copyToClipboard(webhookUrl, "wh-url")} className="px-3 py-2.5 rounded-xl border border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                                    {copied === "wh-url" ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Autenticação (Headers)</label>
                            <div className="flex gap-2">
                                <code className="flex-1 block px-3 py-2 bg-slate-900 border border-white/[0.08] rounded-xl text-xs text-green-300">
                                    "Authorization": "Bearer {configValues["secretToken"]}"
                                </code>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Exemplo de Payload Mínimo (JSON)</label>
                            <code className="block p-4 bg-slate-900 border border-white/[0.08] rounded-xl text-xs text-slate-300 font-mono whitespace-pre-wrap">
{`{
  "name": "João Silva"
}`}
                            </code>
                            <p className="text-[10px] text-slate-500 mt-2">Só o *name* (Nome do Contato) é obrigatório. Isso já é suficiente para criar o Lead e inserí-lo no Funil do vendedor atribuído.</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Exemplo de Payload Completo (JSON)</label>
                            <code className="block p-4 bg-slate-900 border border-white/[0.08] rounded-xl text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
{`{
  "name": "Maria Oliveira",
  "email": "maria@empresa.com",
  "phone": "11988887777",
  "role": "Diretora de Vendas",
  "city": "São Paulo",
  "state": "SP",
  "website": "https://empresa.com",
  "segment": "Tecnologia",
  "source": "Landing Page X",
  "notes": "Tentou ligar na parte da manhã.",
  
  "companyName": "Empresa TechCorp",
  "companyCnpj": "00.000.000/0001-00",
  
  "dealTitle": "Consultoria em Nuvem - TechCorp",
  "dealValue": 15000,
  "dealPriority": "high",
  "dealTags": ["Migração", "Urgente"],
  "dealMessage": "Gostaria de saber os valores para migrar nossos servidores."
}`}
                            </code>
                        </div>
                    </div>
                )}

                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl text-center">
                        <span className={`text-lg font-bold block ${integration.status === "connected" ? "text-blue-400" : "text-slate-500"}`}>
                            {integration.status === "connected" ? "Ativo" : "Inativo"}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">Status</span>
                    </div>
                    <div className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl text-center">
                        <span className="text-lg font-bold text-white block">{integration.lastSync || "—"}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">Última Sync</span>
                    </div>
                    <div className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl text-center">
                        <span className="text-lg font-bold text-white block">{integration.configFields?.length || 0}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">Campos Config</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
