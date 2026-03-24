"use client";

import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    KeyRound,
    ArrowLeft,
    Mail,
    MessageSquare,
    Phone,
    CheckCircle2,
    XCircle,
    Flame,
    Wifi,
    WifiOff,
    Plus,
    Settings,
    Send,
} from "lucide-react";

export default function IdentitiesPage() {
    const { identities } = useSDRStore();

    const getEmailStatusConfig = (status: string, warmup: number) => {
        switch (status) {
            case "connected": return { label: "Conectado", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: <CheckCircle2 size={14} className="text-blue-400" /> };
            case "warming": return { label: `Aquecendo (${warmup}%)`, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <Flame size={14} className="text-amber-400" /> };
            default: return { label: "Desconectado", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: <XCircle size={14} className="text-red-400" /> };
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Hub SDR</Link>
                <span>/</span>
                <span className="text-white font-medium">Identidades</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <KeyRound size={20} className="text-teal-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Identidades</h1>
                        <p className="text-sm text-slate-400">E-mail, WhatsApp e telefone — quem fala em cada cadência</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                    <Plus size={16} /> Nova Identidade
                </button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {identities.map((identity, i) => {
                    const emailConfig = getEmailStatusConfig(identity.emailStatus, identity.warmupLevel);

                    return (
                        <motion.div key={identity.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-teal-500/20 transition-all">
                                {/* Header */}
                                <div className="p-6 border-b border-slate-700/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                                                {identity.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{identity.name}</h3>
                                                <p className="text-xs text-slate-400">{identity.email}</p>
                                            </div>
                                        </div>
                                        <button className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                            <Settings size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Channels */}
                                <div className="p-6 grid grid-cols-1 gap-4">
                                    {/* Email */}
                                    <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Mail size={18} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">E-mail</div>
                                                <div className="text-xs text-slate-400">{identity.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${emailConfig.bg} ${emailConfig.color}`}>
                                                {emailConfig.icon} {emailConfig.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Warmup bar */}
                                    {identity.emailStatus !== "disconnected" && (
                                        <div className="px-4">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                <span>Warmup</span>
                                                <span>{identity.warmupLevel}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${identity.warmupLevel >= 80 ? "bg-blue-500" : identity.warmupLevel >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${identity.warmupLevel}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* WhatsApp */}
                                    <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <MessageSquare size={18} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">WhatsApp</div>
                                                <div className="text-xs text-slate-400">{identity.whatsappNumber || "Não configurado"}</div>
                                            </div>
                                        </div>
                                        {identity.whatsappConnected ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400 text-[10px] font-bold">
                                                <Wifi size={12} /> Conectado
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-slate-800 border-slate-700 text-slate-400 text-[10px] font-bold">
                                                <WifiOff size={12} /> Desconectado
                                            </span>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Phone size={18} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">Telefone</div>
                                                <div className="text-xs text-slate-400">{identity.phoneNumber || "Não configurado"}</div>
                                            </div>
                                        </div>
                                        {identity.phoneConnected ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400 text-[10px] font-bold">
                                                <Wifi size={12} /> Conectado
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-slate-800 border-slate-700 text-slate-400 text-[10px] font-bold">
                                                <WifiOff size={12} /> Desconectado
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Daily Limits */}
                                <div className="px-6 pb-6">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Limites Diários</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                                            <Mail size={14} className="mx-auto text-blue-400 mb-1" />
                                            <div className="text-lg font-bold text-white">{identity.dailyLimits.email}</div>
                                            <div className="text-[10px] text-slate-500">e-mails/dia</div>
                                        </div>
                                        <div className="text-center p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                                            <MessageSquare size={14} className="mx-auto text-blue-400 mb-1" />
                                            <div className="text-lg font-bold text-white">{identity.dailyLimits.whatsapp}</div>
                                            <div className="text-[10px] text-slate-500">msgs/dia</div>
                                        </div>
                                        <div className="text-center p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                                            <Phone size={14} className="mx-auto text-blue-400 mb-1" />
                                            <div className="text-lg font-bold text-white">{identity.dailyLimits.phone}</div>
                                            <div className="text-[10px] text-slate-500">ligações/dia</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Signature Preview */}
                                <div className="px-6 pb-6">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Assinatura</div>
                                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-400 whitespace-pre-line font-mono">
                                        {identity.signature}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="px-6 pb-6 flex gap-2">
                                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-all font-medium">
                                        <Send size={14} /> Testar Conexão
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
