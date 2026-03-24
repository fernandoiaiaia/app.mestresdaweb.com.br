"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Settings,
    Key,
    Plus,
    Copy,
    Trash2,
    Eye,
    EyeOff,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Shield,
    X,
    Save,
} from "lucide-react";

interface ApiKey {
    id: string;
    name: string;
    key: string;
    createdAt: string;
    lastUsed: string | null;
    permissions: string[];
    status: "active" | "revoked";
}

const mockKeys: ApiKey[] = [
    { id: "k1", name: "Produção - Frontend", key: "pk_live_a8f3k2m9x7b4c1d6e0f5g8h2", createdAt: "15 Jan 2026", lastUsed: "04 Mar 2026", permissions: ["read:proposals", "write:proposals", "read:clients"], status: "active" },
    { id: "k2", name: "Webhook - Stripe", key: "sk_live_j4l7n0p3r6t9v2x5z8a1c4f7", createdAt: "20 Jan 2026", lastUsed: "04 Mar 2026", permissions: ["webhook:receive", "write:payments"], status: "active" },
    { id: "k3", name: "Integração CRM", key: "sk_live_h9i2k5m8o1q4s7u0w3y6b9d2", createdAt: "01 Fev 2026", lastUsed: null, permissions: ["read:clients", "write:clients"], status: "active" },
    { id: "k4", name: "App Mobile (Dev)", key: "pk_test_e6f9g2h5j8k1l4n7p0r3s6t9", createdAt: "10 Nov 2025", lastUsed: "15 Fev 2026", permissions: ["read:proposals"], status: "revoked" },
];

export default function ApiKeysPage() {
    const [keys, setKeys] = useState(mockKeys);
    const [visibleKey, setVisibleKey] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const handleCopy = (id: string, key: string) => {
        navigator.clipboard.writeText(key);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Chaves de API</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Key size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Chaves de API</h1>
                            <p className="text-sm text-slate-400">Gerencie tokens de acesso e webhooks</p>
                        </div>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={16} /> Nova Chave
                    </button>
                </div>
            </motion.div>

            {/* Warning */}
            <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl mb-6">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-300/80">Mantenha suas chaves em segredo. Nunca exponha chaves <code className="text-amber-300 font-mono bg-amber-500/10 px-1 rounded">sk_live_</code> no frontend.</p>
            </div>

            {/* Keys List */}
            <div className="space-y-3">
                {keys.map((k, i) => (
                    <motion.div key={k.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 ${k.status === "revoked" ? "opacity-50" : ""}`}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-bold text-white">{k.name}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${k.status === "active" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
                                        {k.status === "active" ? "Ativa" : "Revogada"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 font-mono text-sm">
                                    <span className="text-slate-400">
                                        {visibleKey === k.id ? k.key : `${k.key.slice(0, 12)}${"•".repeat(20)}`}
                                    </span>
                                    <button onClick={() => setVisibleKey(visibleKey === k.id ? null : k.id)} className="p-1 text-slate-600 hover:text-white transition-colors">
                                        {visibleKey === k.id ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                    <button onClick={() => handleCopy(k.id, k.key)} className="p-1 text-slate-600 hover:text-white transition-colors">
                                        {copied === k.id ? <CheckCircle2 size={12} className="text-blue-400" /> : <Copy size={12} />}
                                    </button>
                                </div>
                            </div>
                            {k.status === "active" && (
                                <button className="px-3 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-all">Revogar</button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {k.permissions.map((p) => (
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

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                                <h2 className="text-base font-bold text-white">Nova Chave de API</h2>
                                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome da Chave</label>
                                    <input type="text" placeholder="Ex: Integração CRM Externo" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Tipo</label>
                                    <div className="flex gap-2">
                                        <button className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Pública (pk_)</button>
                                        <button className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 border border-white/[0.06] hover:text-white hover:bg-white/5 transition-all">Secreta (sk_)</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Permissões</label>
                                    <div className="space-y-1.5">
                                        {["read:proposals", "write:proposals", "read:clients", "write:clients", "webhook:receive"].map((p) => (
                                            <label key={p} className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg cursor-pointer hover:bg-white/[0.02]">
                                                <input type="checkbox" className="accent-blue-500" />
                                                <span className="text-sm text-slate-300 font-mono">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
                                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
                                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all">
                                    <Key size={14} /> Gerar Chave
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
