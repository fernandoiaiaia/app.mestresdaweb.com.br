"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, AlertTriangle, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordApi } from "@/lib/api";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Link de redefinição inválido. Solicite um novo link.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!newPassword || !confirmPassword) {
            setError("Preencha todos os campos.");
            return;
        }

        if (newPassword.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await resetPasswordApi(token, newPassword);
            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.error?.message || result.message || "Erro ao redefinir senha. O link pode ter expirado.");
            }
        } catch {
            setError("Erro de conexão com o servidor. Tente novamente.");
        }
        setIsLoading(false);
    };

    return (
        <div className="relative min-h-screen bg-slate-900 overflow-hidden flex flex-col font-sans antialiased text-white">
            {/* Background */}
            <div className="fixed z-0 top-0 right-0 bottom-0 left-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/70 to-slate-900/95"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
                <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.5)]"></div>
            </div>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
                    className="w-full max-w-[440px] bg-slate-800/60 rounded-xl border border-slate-700/50 backdrop-blur-2xl p-8 shadow-[0_15px_40px_rgb(0,0,0,0.5)] mx-4"
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-8 mt-4">
                        <div className="relative w-full h-40">
                            <Image
                                src="/branding/logo-mdw.png"
                                alt="Mestres da Web Logo"
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                    </div>

                    {success ? (
                        /* ═══ SUCCESS STATE ═══ */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-4"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={28} className="text-blue-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">Senha Redefinida!</h2>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                Sua senha foi redefinida com sucesso. Você já pode fazer login com a nova senha.
                            </p>
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
                            >
                                <ArrowLeft size={16} />
                                <span>Voltar ao Login</span>
                            </button>
                        </motion.div>
                    ) : (
                        /* ═══ RESET FORM ═══ */
                        <div>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck size={28} className="text-blue-400" />
                                </div>
                                <h2 className="text-lg font-bold text-white mb-1">Redefinir Senha</h2>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Digite sua nova senha abaixo.
                                </p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-2.5 p-3 rounded-lg mb-5 text-xs bg-red-500/10 border border-red-500/20 text-red-400"
                                >
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2 block">
                                        Nova Senha
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            disabled={!token}
                                            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg pl-11 pr-11 py-3.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/50 transition-all hover:bg-slate-900/80 disabled:opacity-40 disabled:cursor-not-allowed"
                                        />
                                        <Lock className="absolute left-4 top-[14px] w-4 h-4 text-slate-500" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-[13px] p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2 block">
                                        Confirmar Nova Senha
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            disabled={!token}
                                            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg pl-11 pr-11 py-3.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/50 transition-all hover:bg-slate-900/80 disabled:opacity-40 disabled:cursor-not-allowed"
                                        />
                                        <Lock className="absolute left-4 top-[14px] w-4 h-4 text-slate-500" />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-[13px] p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-1">
                                    <button
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
                                        type="submit"
                                        disabled={!token || isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Redefinindo...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <ShieldCheck size={16} />
                                                <span>Redefinir Senha</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/login")}
                                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mx-auto"
                                    >
                                        <ArrowLeft size={12} />
                                        Voltar ao Login
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
