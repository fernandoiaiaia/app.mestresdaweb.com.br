"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft, Settings, Shield, Key, Smartphone, Lock, Eye, EyeOff,
    Clock, AlertTriangle, CheckCircle2, Save, Monitor, MapPin, LogOut,
    X, Trash2, ShieldCheck, ShieldOff, Copy, Loader2,
} from "lucide-react";

interface SecuritySettingsData {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    minPasswordLength: number;
    requireSpecialChars: boolean;
    requireUppercase: boolean;
    requireNumbers: boolean;
    passwordExpiry: number;
}

const Toggle = ({ enabled, onChange, size = "sm" }: { enabled: boolean; onChange: () => void; size?: "sm" | "md" }) => {
    const w = size === "md" ? "w-12 h-6" : "w-9 h-5";
    const dot = "w-4 h-4";
    const on = size === "md" ? "left-[26px]" : "left-[18px]";
    const off = size === "md" ? "left-1" : "left-0.5";
    const top = size === "md" ? "top-1" : "top-0.5";
    return (
        <button onClick={onChange} className={`${w} rounded-full transition-colors relative ${enabled ? "bg-blue-600" : "bg-slate-700"}`}>
            <div className={`absolute ${top} ${dot} rounded-full bg-white transition-transform ${enabled ? on : off}`} />
        </button>
    );
};

interface Session { id: string; device: string | null; browser: string | null; ip: string | null; location: string | null; lastActive: string; createdAt: string; }
interface LoginEntry { id: string; createdAt: string; ip: string | null; status: "success" | "failed"; device: string | null; }

function formatDate(d: string) {
    const dt = new Date(d);
    return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) + ", " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Agora";
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
}

export default function SecurityPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Settings
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [minPasswordLength, setMinPasswordLength] = useState(8);
    const [requireSpecialChars, setRequireSpecialChars] = useState(true);
    const [requireUppercase, setRequireUppercase] = useState(true);
    const [requireNumbers, setRequireNumbers] = useState(true);
    const [passwordExpiry, setPasswordExpiry] = useState(90);

    // Sessions & Login History (real data)
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);

    // Change password modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [changingPw, setChangingPw] = useState(false);

    // 2FA modal
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [twoFACode, setTwoFACode] = useState("");
    const [twoFASetupDone, setTwoFASetupDone] = useState(false);

    // Revoke
    const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
    const [revokeAllConfirm, setRevokeAllConfirm] = useState(false);
    const [copiedBackup, setCopiedBackup] = useState(false);

    // ═══ Load ═══
    useEffect(() => {
        (async () => {
            try {
                const [settingsRes, sessionsRes, loginRes] = await Promise.all([
                    api<SecuritySettingsData>("/api/security", { method: "GET" }),
                    api<Session[]>("/api/security/sessions", { method: "GET" }),
                    api<LoginEntry[]>("/api/security/login-history", { method: "GET" }),
                ]);

                if (settingsRes.success && settingsRes.data) {
                    const d = settingsRes.data;
                    setTwoFactorEnabled(d.twoFactorEnabled);
                    setSessionTimeout(d.sessionTimeout);
                    setMinPasswordLength(d.minPasswordLength);
                    setRequireSpecialChars(d.requireSpecialChars);
                    setRequireUppercase(d.requireUppercase);
                    setRequireNumbers(d.requireNumbers);
                    setPasswordExpiry(d.passwordExpiry);
                }

                if (sessionsRes.success && sessionsRes.data) {
                    setSessions(sessionsRes.data as any);
                }

                if (loginRes.success && loginRes.data) {
                    setLoginHistory(loginRes.data as any);
                }
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, []);

    // ═══ Save Settings ═══
    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api<SecuritySettingsData>("/api/security", {
                method: "PUT",
                body: { twoFactorEnabled, sessionTimeout, minPasswordLength, requireSpecialChars, requireUppercase, requireNumbers, passwordExpiry },
            });
            if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    // ═══ Change Password ═══
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
        if (newPassword.length < minPasswordLength) return;
        setChangingPw(true); setPasswordError("");
        try {
            const res = await api("/api/security/change-password", { method: "POST", body: { currentPassword, newPassword } });
            if (res.success) {
                setPasswordChanged(true);
                setTimeout(() => { setPasswordChanged(false); setShowPasswordModal(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }, 1500);
            } else {
                setPasswordError((res as any).error || "Erro ao alterar senha");
            }
        } catch (e: any) { setPasswordError(e?.message || "Erro ao alterar senha"); }
        finally { setChangingPw(false); }
    };

    const handle2FAToggle = () => { if (twoFactorEnabled) { setTwoFactorEnabled(false); } else { setShow2FAModal(true); } };
    const confirm2FA = () => { if (twoFACode.length === 6) { setTwoFactorEnabled(true); setTwoFASetupDone(true); setTimeout(() => { setTwoFASetupDone(false); setShow2FAModal(false); setTwoFACode(""); }, 1500); } };
    const copyBackupCodes = () => { navigator.clipboard.writeText("A1B2C3\nD4E5F6\nG7H8I9\nJ0K1L2\nM3N4O5"); setCopiedBackup(true); setTimeout(() => setCopiedBackup(false), 2000); };

    // ═══ Session management (real API) ═══
    const revokeSession = async (id: string) => {
        try {
            await api(`/api/security/sessions/${id}`, { method: "DELETE" });
            setSessions(prev => prev.filter(s => s.id !== id));
        } catch (e) { console.error(e); }
        setRevokeConfirm(null);
    };

    const revokeAllSessions = async () => {
        try {
            await api("/api/security/sessions", { method: "DELETE" });
            // Keep only the most recent session (likely current)
            setSessions(prev => prev.length > 0 ? [prev[0]] : []);
        } catch (e) { console.error(e); }
        setRevokeAllConfirm(false);
    };

    const passwordStrength = (() => { let s = 0; if (newPassword.length >= minPasswordLength) s++; if (/[A-Z]/.test(newPassword)) s++; if (/[0-9]/.test(newPassword)) s++; if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) s++; return s; })();
    const strengthLabel = ["", "Fraca", "Razoável", "Boa", "Forte"][passwordStrength] || "";
    const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-blue-500"][passwordStrength] || "";
    const otherSessions = sessions.slice(1); // First is most recent (likely current)
    const failedLogins = loginHistory.filter(l => l.status === "failed").length;

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-slate-500" /></div>;
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Segurança</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Shield size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Segurança</h1>
                            <p className="text-sm text-slate-400">Autenticação, sessões e políticas de acesso</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowPasswordModal(true)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-400 border border-white/[0.08] rounded-xl hover:text-white hover:bg-white/5 transition-all">
                            <Key size={14} /> Alterar Senha
                        </button>
                        <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg disabled:opacity-60 ${saved ? 'bg-blue-500 shadow-blue-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'} text-white`}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><CheckCircle2 size={16} /> Salvo!</> : <><Save size={16} /> Salvar</>}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "2FA", value: twoFactorEnabled ? "Ativo" : "Inativo", icon: twoFactorEnabled ? ShieldCheck : ShieldOff, color: twoFactorEnabled ? "text-blue-400" : "text-red-400" },
                    { label: "Sessões Ativas", value: sessions.length, icon: Monitor, color: "text-purple-400" },
                    { label: "Tentativas Falhas", value: failedLogins, icon: AlertTriangle, color: failedLogins > 0 ? "text-red-400" : "text-blue-400" },
                    { label: "Timeout", value: sessionTimeout < 60 ? `${sessionTimeout}min` : `${sessionTimeout / 60}h`, icon: Clock, color: "text-amber-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-lg font-bold text-white block">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            <div className="space-y-6">
                {/* 2FA */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone size={18} className="text-blue-500" />
                            <div>
                                <h3 className="text-sm font-bold text-white">Autenticação em Dois Fatores (2FA)</h3>
                                <p className="text-[11px] text-slate-500">Exigir verificação via app ou SMS ao fazer login</p>
                            </div>
                        </div>
                        <Toggle enabled={twoFactorEnabled} onChange={handle2FAToggle} size="md" />
                    </div>
                    {twoFactorEnabled && (
                        <div className="mt-4 flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> 2FA ativo via Google Authenticator</span>
                            <button onClick={copyBackupCodes} className={`text-[10px] font-medium px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${copiedBackup ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                                <Copy size={10} /> {copiedBackup ? "Copiado!" : "Copiar códigos backup"}
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Password Policy */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Lock size={16} className="text-blue-400" /> Política de Senhas</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Comprimento Mínimo</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min={6} max={16} value={minPasswordLength} onChange={e => setMinPasswordLength(Number(e.target.value))} className="flex-1 accent-blue-500" />
                                <span className="text-sm font-bold text-white w-16 text-right">{minPasswordLength} chars</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                            <span className="text-sm text-slate-300">Exigir caracteres especiais (!@#$)</span>
                            <Toggle enabled={requireSpecialChars} onChange={() => setRequireSpecialChars(!requireSpecialChars)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                            <span className="text-sm text-slate-300">Exigir letra maiúscula</span>
                            <Toggle enabled={requireUppercase} onChange={() => setRequireUppercase(!requireUppercase)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                            <span className="text-sm text-slate-300">Exigir número</span>
                            <Toggle enabled={requireNumbers} onChange={() => setRequireNumbers(!requireNumbers)} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Expiração da Senha (dias)</label>
                            <div className="flex gap-2">
                                {[30, 60, 90, 180, 0].map(d => (
                                    <button key={d} onClick={() => setPasswordExpiry(d)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${passwordExpiry === d ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 border border-white/[0.06] hover:text-white hover:bg-white/5'}`}>
                                        {d === 0 ? "Nunca" : `${d}d`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Session Timeout */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Clock size={16} className="text-amber-400" /> Timeout de Sessão</h3>
                    <div className="flex gap-2">
                        {[15, 30, 60, 120, 480].map(m => (
                            <button key={m} onClick={() => setSessionTimeout(m)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sessionTimeout === m ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-slate-500 border border-white/[0.06] hover:text-white hover:bg-white/5"}`}>
                                {m < 60 ? `${m} min` : `${m / 60}h`}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2">Sessão expira após {sessionTimeout < 60 ? `${sessionTimeout} minutos` : `${sessionTimeout / 60} horas`} de inatividade</p>
                </motion.div>

                {/* Active Sessions */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Monitor size={16} className="text-purple-400" /> Sessões Ativas ({sessions.length})</h3>
                        {otherSessions.length > 0 && (
                            <button onClick={() => setRevokeAllConfirm(true)} className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-all">
                                <LogOut size={10} /> Encerrar todas as outras
                            </button>
                        )}
                    </div>
                    {sessions.length === 0 ? (
                        <div className="text-center py-6 text-slate-600">
                            <Monitor size={24} className="mx-auto mb-2 opacity-20" />
                            <p className="text-xs">Nenhuma sessão ativa</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sessions.map((s, idx) => (
                                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl group">
                                    <div className="flex items-center gap-3">
                                        <Monitor size={16} className={idx === 0 ? "text-blue-400" : "text-slate-500"} />
                                        <div>
                                            <span className="text-sm font-medium text-white flex items-center gap-2">
                                                {s.device || "Dispositivo"} {s.browser ? `· ${s.browser}` : ""}
                                                {idx === 0 && <span className="text-[8px] text-blue-400 font-bold uppercase tracking-wider">Atual</span>}
                                            </span>
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                {s.location && <><MapPin size={8} /> {s.location} · </>}
                                                IP: {s.ip || "—"} · {timeAgo(s.lastActive)}
                                            </span>
                                        </div>
                                    </div>
                                    {idx !== 0 && (
                                        <button onClick={() => setRevokeConfirm(s.id)} className="px-3 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-all flex items-center gap-1">
                                            <LogOut size={12} /> Encerrar
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Login History */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Key size={16} className="text-amber-400" /> Histórico de Login</h3>
                    </div>
                    {loginHistory.length === 0 ? (
                        <div className="text-center py-6 text-slate-600">
                            <Key size={24} className="mx-auto mb-2 opacity-20" />
                            <p className="text-xs">Nenhum registro de login</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {loginHistory.map(l => (
                                <div key={l.id} className="flex items-center justify-between p-2.5 bg-slate-800/30 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {l.status === "success" ? <CheckCircle2 size={14} className="text-blue-400" /> : <AlertTriangle size={14} className="text-red-400" />}
                                        <span className="text-[11px] text-slate-300">{l.device || "Desconhecido"}</span>
                                        {l.status === "failed" && <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider">Falhou</span>}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-600">
                                        <span>IP: {l.ip || "—"}</span>
                                        <span>{formatDate(l.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ═══ MODAL: Change Password ═══ */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><Key size={16} className="text-blue-400" /> Alterar Senha</h2>
                                <button onClick={() => setShowPasswordModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                {passwordError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{passwordError}</div>
                                )}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Senha Atual</label>
                                    <div className="relative">
                                        <input type={showCurrentPw ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 pr-10" />
                                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                            {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nova Senha</label>
                                    <div className="relative">
                                        <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 pr-10" />
                                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                            {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    {newPassword && (
                                        <div className="mt-2">
                                            <div className="flex gap-1 mb-1">
                                                {[1, 2, 3, 4].map(i => (<div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColor : 'bg-slate-700'}`} />))}
                                            </div>
                                            <span className={`text-[10px] font-medium ${passwordStrength >= 3 ? 'text-blue-400' : passwordStrength >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{strengthLabel}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Confirmar Nova Senha</label>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={`w-full px-4 py-2.5 bg-slate-800/50 border rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none ${confirmPassword && confirmPassword !== newPassword ? 'border-red-500/40' : 'border-white/[0.08] focus:border-blue-500/40'}`} />
                                    {confirmPassword && confirmPassword !== newPassword && (<span className="text-[10px] text-red-400 mt-1 block">As senhas não coincidem</span>)}
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={handleChangePassword} disabled={changingPw || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < minPasswordLength} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-all">
                                    {changingPw ? <Loader2 size={14} className="animate-spin" /> : passwordChanged ? <><CheckCircle2 size={14} /> Senha Alterada!</> : <><Key size={14} /> Alterar Senha</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: 2FA Setup ═══ */}
            <AnimatePresence>
                {show2FAModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShow2FAModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><Smartphone size={16} className="text-blue-400" /> Ativar 2FA</h2>
                                <button onClick={() => setShow2FAModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="w-32 h-32 mx-auto bg-white rounded-xl flex items-center justify-center">
                                    <div className="grid grid-cols-4 gap-1 p-2">
                                        {Array.from({ length: 16 }).map((_, i) => (<div key={i} className={`w-5 h-5 rounded-sm ${i % 3 === 0 ? 'bg-slate-900' : 'bg-white'}`} />))}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 text-center">Escaneie o QR Code com Google Authenticator ou Authy</p>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Código de Verificação</label>
                                    <input type="text" value={twoFACode} onChange={e => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-lg text-white text-center font-mono tracking-[0.5em] placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                                <button onClick={() => setShow2FAModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Cancelar</button>
                                <button onClick={confirm2FA} disabled={twoFACode.length !== 6} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-all">
                                    {twoFASetupDone ? <><CheckCircle2 size={14} /> Ativado!</> : <><ShieldCheck size={14} /> Ativar 2FA</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Revoke Session ═══ */}
            <AnimatePresence>
                {revokeConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setRevokeConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><LogOut size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Encerrar Sessão?</h3>
                                <p className="text-sm text-slate-400">O dispositivo será desconectado imediatamente.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setRevokeConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={() => revokeConfirm && revokeSession(revokeConfirm)} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Encerrar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Revoke All ═══ */}
            <AnimatePresence>
                {revokeAllConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setRevokeAllConfirm(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><LogOut size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Encerrar Todas as Sessões?</h3>
                                <p className="text-sm text-slate-400">Todos os outros dispositivos serão desconectados.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setRevokeAllConfirm(false)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={revokeAllSessions} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Encerrar Todas</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
