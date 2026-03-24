"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, User, Lock, Shield, Save, CheckCircle, AlertCircle, Eye, EyeOff, Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    phone: string | null;
    position: string | null;
    twoFactorEnabled: boolean;
    createdAt: string;
}

// ═══════════════════════════════════════
// Toast Component
// ═══════════════════════════════════════

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    return (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-sm ${type === "success"
                ? "bg-blue-600/20 border-blue-500/30 text-blue-300"
                : "bg-red-600/20 border-red-500/30 text-red-300"
                }`}>
            {type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"><X size={14} /></button>
        </motion.div>
    );
}

// ═══════════════════════════════════════
// Role Labels
// ═══════════════════════════════════════

const ROLE_LABELS: Record<string, string> = {
    OWNER: "Proprietário", ADMIN: "Administrador", MANAGER: "Gerente", USER: "Usuário", VIEWER: "Visualizador",
};

// ═══════════════════════════════════════
// Masks
// ═══════════════════════════════════════

function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ═══════════════════════════════════════
// Main Page
// ═══════════════════════════════════════

export default function ProfilePage() {
    const { setUser } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Profile form
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [position, setPosition] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // 2FA
    const [twoFaEnabled, setTwoFaEnabled] = useState(false);
    const [toggling2fa, setToggling2fa] = useState(false);

    // Avatar
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";

    const loadProfile = useCallback(async () => {
        setLoading(true);
        const res = await api<UserProfile>("/api/users/me");
        if (res.success && res.data) {
            setProfile(res.data);
            setName(res.data.name || "");
            setPhone(res.data.phone ? maskPhone(res.data.phone) : "");
            setPosition(res.data.position || "");
            setTwoFaEnabled(res.data.twoFactorEnabled);
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    // ── Save Profile ──
    const handleSaveProfile = async () => {
        setSavingProfile(true);
        const res = await api<UserProfile>("/api/users/me", {
            method: "PATCH",
            body: { name, phone: phone || null, position: position || null },
        });
        if (res.success && res.data) {
            setProfile(res.data);
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    user.name = res.data.name;
                    user.avatar = res.data.avatar;
                    localStorage.setItem("user", JSON.stringify(user));
                    setUser(user);
                } catch { /* ignore */ }
            }
            setToast({ message: "Perfil atualizado com sucesso!", type: "success" });
        } else {
            setToast({ message: res.error?.message || "Erro ao atualizar perfil.", type: "error" });
        }
        setSavingProfile(false);
    };

    // ── Change Password ──
    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            setToast({ message: "A nova senha deve ter pelo menos 6 caracteres.", type: "error" });
            return;
        }
        if (newPassword !== confirmPassword) {
            setToast({ message: "As senhas não coincidem.", type: "error" });
            return;
        }
        setSavingPassword(true);
        const res = await api("/api/users/me/password", {
            method: "POST",
            body: { currentPassword, newPassword },
        });
        if (res.success) {
            setToast({ message: "Senha alterada com sucesso!", type: "success" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            setToast({ message: res.error?.message || "Erro ao alterar senha.", type: "error" });
        }
        setSavingPassword(false);
    };

    // ── Toggle 2FA ──
    const handleToggle2fa = async () => {
        setToggling2fa(true);
        const newVal = !twoFaEnabled;
        const res = await api("/api/users/me/2fa", {
            method: "PATCH",
            body: { enabled: newVal },
        });
        if (res.success) {
            setTwoFaEnabled(newVal);
            setToast({
                message: newVal ? "Autenticação de 2 fatores ativada!" : "Autenticação de 2 fatores desativada.",
                type: "success",
            });
        } else {
            setToast({ message: res.error?.message || "Erro ao alterar 2FA.", type: "error" });
        }
        setToggling2fa(false);
    };

    // ── Upload Avatar ──
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append("avatar", file);

        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        try {
            const res = await fetch(`${API_BASE}/api/users/me/avatar`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });
            const data = await res.json();
            if (data.success && data.data) {
                setProfile(prev => prev ? { ...prev, avatar: data.data.avatar } : prev);
                // Sync avatar to auth store so sidebar shows the new photo
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        user.avatar = data.data.avatar;
                        localStorage.setItem("user", JSON.stringify(user));
                        setUser(user);
                    } catch { /* ignore */ }
                }
                setToast({ message: "Foto atualizada com sucesso!", type: "success" });
            } else {
                setToast({ message: data.error?.message || "Erro ao enviar foto.", type: "error" });
            }
        } catch {
            setToast({ message: "Erro ao enviar foto.", type: "error" });
        }
        setUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ═══ Loading ═══
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-red-400 text-sm">Erro ao carregar perfil.</p>
            </div>
        );
    }

    const initials = profile.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
                <p className="text-slate-400 mt-1">Gerencie seus dados pessoais, senha e segurança.</p>
            </motion.div>

            {/* ═══ Profile Card ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-blue-500/10"><User size={20} className="text-blue-400" /></div>
                    <h2 className="text-lg font-bold">Informações Pessoais</h2>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-2xl overflow-hidden ring-2 ring-blue-500/20">
                            {profile.avatar ? (
                                <img src={`${API_BASE}${profile.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            {uploadingAvatar ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">{profile.name}</h3>
                        <p className="text-xs text-slate-400">{profile.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                            {ROLE_LABELS[profile.role] || profile.role}
                        </span>
                    </div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome completo</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">E-mail</label>
                        <input type="email" value={profile.email} disabled
                            className="w-full px-3 py-2.5 bg-slate-900/30 border border-white/[0.04] rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Telefone</label>
                        <input type="text" value={phone} onChange={e => setPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15}
                            className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cargo</label>
                        <input type="text" value={position} onChange={e => setPosition(e.target.value)} placeholder="Ex: Desenvolvedor Full Stack"
                            className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 transition-colors" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button onClick={handleSaveProfile} disabled={savingProfile}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition-colors flex items-center gap-2">
                        {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar Alterações
                    </button>
                </div>
            </motion.div>

            {/* ═══ Change Password ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/10"><Lock size={20} className="text-amber-400" /></div>
                    <h2 className="text-lg font-bold">Alterar Senha</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Senha atual</label>
                        <div className="relative">
                            <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Digite sua senha atual"
                                className="w-full px-3 py-2.5 pr-10 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 transition-colors" />
                            <button onClick={() => setShowCurrent(!showCurrent)} type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nova senha</label>
                            <div className="relative">
                                <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full px-3 py-2.5 pr-10 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 transition-colors" />
                                <button onClick={() => setShowNew(!showNew)} type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Confirmar nova senha</label>
                            <div className="relative">
                                <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a nova senha"
                                    className="w-full px-3 py-2.5 pr-10 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 transition-colors" />
                                <button onClick={() => setShowConfirm(!showConfirm)} type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> As senhas não coincidem.</p>
                    )}
                </div>

                <div className="flex justify-end">
                    <button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors flex items-center gap-2">
                        {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                        Alterar Senha
                    </button>
                </div>
            </motion.div>

            {/* ═══ 2FA Toggle ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-blue-500/10"><Shield size={20} className="text-blue-400" /></div>
                        <div>
                            <h2 className="text-lg font-bold">Autenticação de 2 Fatores</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {twoFaEnabled
                                    ? "Ativada — um código de verificação será enviado ao seu e-mail ao fazer login."
                                    : "Desativada — o login será feito apenas com e-mail e senha."
                                }
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleToggle2fa}
                        disabled={toggling2fa}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none shrink-0 ${twoFaEnabled ? "bg-blue-600" : "bg-slate-700"}`}
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md ${twoFaEnabled ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                </div>
            </motion.div>

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </div>
    );
}
