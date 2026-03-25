"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, KeyRound, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import MatrixRain from "@/components/shared/MatrixRain";
import { resetPasswordApi } from "@/lib/api";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Password strength
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const isValid = hasMinLength && passwordsMatch;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("Token de redefinição não encontrado. Solicite um novo link.");
            return;
        }

        if (!isValid) {
            setError("Por favor, atenda todos os requisitos da senha.");
            return;
        }

        setIsLoading(true);
        const result = await resetPasswordApi(token, password);
        setIsLoading(false);

        if (result.success) {
            setSuccess(true);
        } else {
            setError(
                result.error?.message || result.message || "Token inválido ou expirado. Solicite um novo link."
            );
        }
    };

    // No token provided
    if (!token) {
        return (
            <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={24} className="text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Link Inválido</h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                    Este link de redefinição de senha é inválido ou expirou. Por favor, solicite um novo link na tela de login.
                </p>
                <button
                    onClick={() => router.push("/login")}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all"
                >
                    Voltar ao Login
                </button>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={24} className="text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Senha Redefinida!</h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                    Sua senha foi alterada com sucesso. Você já pode fazer login com sua nova senha.
                </p>
                <button
                    onClick={() => router.push("/login")}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
                >
                    Ir para Login
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
                    >
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Password */}
            <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2 block">Nova Senha</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg pl-11 pr-11 py-3.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/50 transition-all hover:bg-slate-900/80"
                    />
                    <Lock className="absolute left-4 top-[14px] w-4 h-4 text-slate-500" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[13px] p-0.5 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            {/* Confirm Password */}
            <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2 block">Confirmar Senha</label>
                <div className="relative">
                    <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg pl-11 pr-11 py-3.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/50 transition-all hover:bg-slate-900/80"
                    />
                    <Lock className="absolute left-4 top-[14px] w-4 h-4 text-slate-500" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[13px] p-0.5 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-1.5 pt-1">
                {[
                    { met: hasMinLength, label: "Mínimo 6 caracteres" },
                    { met: hasUpperCase, label: "Uma letra maiúscula" },
                    { met: hasNumber, label: "Um número" },
                    { met: passwordsMatch, label: "Senhas coincidem" },
                ].map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${req.met ? "bg-blue-500/20 border-blue-500/40" : "bg-slate-800/50 border-slate-700/50"}`}>
                            {req.met && <CheckCircle2 size={10} className="text-blue-400" />}
                        </div>
                        <span className={`transition-colors ${req.met ? "text-blue-400" : "text-slate-500"}`}>{req.label}</span>
                    </div>
                ))}
            </div>

            {/* Submit */}
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={!isValid || isLoading}
                    className="button-custom w-full group shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:pointer-events-none"
                >
                    <div className="points_wrapper">
                        <i className="point"></i><i className="point"></i><i className="point"></i>
                        <i className="point"></i><i className="point"></i><i className="point"></i>
                        <i className="point"></i>
                    </div>
                    <div className="inner font-medium tracking-wide flex items-center gap-2 relative z-10">
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Redefinindo...</span>
                            </div>
                        ) : (
                            <>
                                <KeyRound size={16} />
                                <span>Redefinir Senha</span>
                            </>
                        )}
                    </div>
                </button>
            </div>

            {/* Back to Login */}
            <div className="text-center pt-2">
                <button type="button" onClick={() => router.push("/login")}
                    className="text-xs text-slate-500 hover:text-blue-400 transition-colors inline-flex items-center gap-1.5">
                    <ArrowLeft size={12} /> Voltar ao Login
                </button>
            </div>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="relative min-h-screen bg-slate-900 overflow-hidden selection:bg-blue-600/30 flex flex-col font-sans antialiased text-white">
            {/* Background */}
            <div className="fixed z-0 top-0 right-0 bottom-0 left-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/70 to-slate-900/95"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
                <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.5)]"></div>
            </div>

            <MatrixRain />

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
                    className="w-full max-w-[440px] bg-slate-800/60 rounded-xl border border-white/[0.06] backdrop-blur-2xl p-8 shadow-[0_15px_40px_rgb(0,0,0,0.5)]"
                >
                    {/* Brand Name */}
                    <div className="flex justify-center mb-8">
                        <span className="text-5xl font-bold tracking-tight text-white font-varela-round lowercase">cezani</span>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold text-white mb-1">Redefinir Senha</h1>
                        <p className="text-xs text-slate-400">Crie uma nova senha para sua conta.</p>
                    </div>

                    <Suspense fallback={
                        <div className="text-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-xs text-slate-500">Carregando...</p>
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>
                </motion.div>
            </main>
        </div>
    );
}
