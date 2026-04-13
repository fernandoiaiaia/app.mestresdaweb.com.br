"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, Mail, X, AlertTriangle, CheckCircle2, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";

import { useRouter } from "next/navigation";
import MatrixRain from "@/components/shared/MatrixRain";
import { useAuthStore } from "@/stores/auth";
import { forgotPasswordApi } from "@/lib/api";

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 900; // 15 minutes
const CODE_LENGTH = 6;

type LoginStep = "credentials" | "2fa";

export default function LoginPage() {
    const router = useRouter();
    const { login, verify2fa, googleLogin } = useAuthStore();
    const [step, setStep] = useState<LoginStep>("credentials");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // 2FA state
    const [tempToken, setTempToken] = useState("");
    const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [codeCountdown, setCodeCountdown] = useState(600); // 10 min
    const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Lockout state
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState<number | null>(null);
    const [lockCountdown, setLockCountdown] = useState(0);

    // Forgot password modal
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    // Google Sign-In
    const [googleLoaded, setGoogleLoaded] = useState(false);

    // Lockout countdown timer
    useEffect(() => {
        if (!lockedUntil) return;
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
            setLockCountdown(remaining);
            if (remaining <= 0) {
                setLockedUntil(null);
                setAttempts(0);
                setError("");
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lockedUntil]);

    // 2FA countdown
    useEffect(() => {
        if (step !== "2fa") return;
        const interval = setInterval(() => {
            setCodeCountdown((prev) => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [step]);

    // Load Google Sign In script
    useEffect(() => {
        if (typeof window === "undefined") return;
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleLoaded(true);
        document.head.appendChild(script);
        return () => { document.head.removeChild(script); };
    }, []);

    // Initialize Google button when loaded
    useEffect(() => {
        if (!googleLoaded || step !== "credentials") return;
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId || clientId === "your_google_client_id_here") return;

        const w = window as any;
        if (w.google?.accounts?.id) {
            w.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCallback,
                auto_select: false,
            });
            const btnEl = document.getElementById("google-signin-btn");
            if (btnEl) {
                w.google.accounts.id.renderButton(btnEl, {
                    theme: "filled_black",
                    size: "large",
                    width: 392,
                    text: "signin_with",
                    shape: "rectangular",
                    logo_alignment: "center",
                });
            }
        }
    }, [googleLoaded, step]);

    const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

    const formatCountdown = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    // ═══ HANDLERS ═══

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (isLocked) return;
        if (!email || !password) {
            setError("Preencha todos os campos.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(email, password);

            if (result.requires2fa && result.tempToken) {
                // Move to 2FA step
                setTempToken(result.tempToken);
                setCodeDigits(Array(CODE_LENGTH).fill(""));
                setCodeCountdown(600);
                setStep("2fa");
                setIsLoading(false);
                setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
                return;
            }

            if (result.success) {
                router.push("/dashboard");
                return;
            }

            // Login failed
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            if (newAttempts >= MAX_ATTEMPTS) {
                const lockTime = Date.now() + LOCKOUT_SECONDS * 1000;
                setLockedUntil(lockTime);
                setError(`Conta bloqueada por ${LOCKOUT_SECONDS / 60} minutos após ${MAX_ATTEMPTS} tentativas.`);
            } else {
                setError(result.error || `Credenciais inválidas. ${MAX_ATTEMPTS - newAttempts} tentativa(s) restante(s).`);
            }
            setIsLoading(false);
        } catch (err) {
            setError("Erro de conexão com o servidor. Tente novamente.");
            setIsLoading(false);
        }
    };

    const handleGoogleCallback = useCallback(async (response: any) => {
        if (!response?.credential) return;
        setIsLoading(true);
        setError("");

        try {
            const result = await googleLogin(response.credential);

            if (result.requires2fa && result.tempToken) {
                setTempToken(result.tempToken);
                setCodeDigits(Array(CODE_LENGTH).fill(""));
                setCodeCountdown(600);
                setStep("2fa");
                setIsLoading(false);
                setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
                return;
            }

            if (result.success) {
                router.push("/dashboard");
                return;
            }

            setError(result.error || "Erro ao logar com Google.");
            setIsLoading(false);
        } catch {
            setError("Erro de conexão com o servidor.");
            setIsLoading(false);
        }
    }, [googleLogin, router]);

    const handleGoogleFallback = async () => {
        if (isLocked) return;
        setIsLoading(true);
        setError("");
        // Fallback: mock redirect when Google Client ID not configured
        await new Promise((r) => setTimeout(r, 800));
        router.push("/dashboard");
    };

    const handle2faSubmit = async () => {
        const code = codeDigits.join("");
        if (code.length !== CODE_LENGTH) {
            setError("Digite o código completo de 6 dígitos.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await verify2fa(tempToken, code);
            if (result.success) {
                router.push("/dashboard");
                return;
            }
            setError(result.error || "Código inválido ou expirado.");
            setCodeDigits(Array(CODE_LENGTH).fill(""));
            codeInputRefs.current[0]?.focus();
            setIsLoading(false);
        } catch {
            setError("Erro ao verificar código.");
            setIsLoading(false);
        }
    };

    const handleCodeInput = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newDigits = [...codeDigits];

        if (value.length > 1) {
            // Paste: distribute digits across inputs
            const digits = value.slice(0, CODE_LENGTH - index).split("");
            digits.forEach((d, i) => {
                if (index + i < CODE_LENGTH) newDigits[index + i] = d;
            });
            setCodeDigits(newDigits);
            const nextIdx = Math.min(index + digits.length, CODE_LENGTH - 1);
            codeInputRefs.current[nextIdx]?.focus();

            // Auto-submit if all filled
            if (newDigits.every((d) => d !== "")) {
                setTimeout(() => handle2faSubmit(), 200);
            }
            return;
        }

        newDigits[index] = value;
        setCodeDigits(newDigits);

        if (value && index < CODE_LENGTH - 1) {
            codeInputRefs.current[index + 1]?.focus();
        }

        // Auto-submit if all filled
        if (value && newDigits.every((d) => d !== "")) {
            setTimeout(() => handle2faSubmit(), 200);
        }
    };

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
        if (e.key === "Enter") {
            handle2faSubmit();
        }
    };

    const handleResend2fa = async () => {
        setError("");
        setIsLoading(true);
        // Re-trigger login to get a new code
        try {
            const result = await login(email, password);
            if (result.requires2fa && result.tempToken) {
                setTempToken(result.tempToken);
                setCodeDigits(Array(CODE_LENGTH).fill(""));
                setCodeCountdown(600);
                setError("");
                codeInputRefs.current[0]?.focus();
            }
        } catch {
            setError("Erro ao reenviar código.");
        }
        setIsLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) return;
        setResetLoading(true);
        try {
            await forgotPasswordApi(resetEmail);
            setResetSent(true);
        } catch {
            // Still show success for security (don't reveal if email exists)
            setResetSent(true);
        }
        setResetLoading(false);
    };

    const googleClientId = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID : null;
    const hasRealGoogle = googleClientId && googleClientId !== "your_google_client_id_here";

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
            <main className="relative z-10 flex-1 flex items-center">
                <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-10 items-center">

                    {/* Left Column - Hero */}
                    <div className="col-span-1 lg:col-span-6 flex flex-col justify-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
                            className="text-5xl md:text-7xl lg:text-7xl xl:text-8xl leading-[0.9] tracking-tighter text-white font-medium mb-6"
                        >
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-500">Dev Hub.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1], delay: 0.35 }}
                            className="leading-relaxed text-lg font-medium text-slate-400 max-w-lg mb-10"
                        >
                            Plataforma de gestão de projetos para o time interno. Controle total de tarefas, sprints e entrega.
                        </motion.p>
                    </div>

                    {/* Right Column - Login Card */}
                    <div className="col-span-1 lg:col-span-5 lg:col-start-8 flex justify-end">
                        <motion.div
                            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1], delay: 0.4 }}
                            className="w-full max-w-[440px] bg-transparent rounded-xl border border-slate-700/30 p-8 shadow-[0_15px_40px_rgb(0,0,0,0.2)] relative"
                        >
                            {/* Brand Name */}
                            <div className="flex justify-center mb-10">
                                <img src="/branding/logo-mdw.png" alt="Mestres da Web" className="w-full max-w-[340px] h-auto object-contain drop-shadow-[0_0_20px_rgba(34,255,181,0.2)]" />
                            </div>

                            {/* Error / Lockout Alert */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className={`flex items-start gap-2.5 p-3 rounded-lg mb-5 text-xs ${isLocked ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"}`}
                                    >
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <div>
                                            <span>{error}</span>
                                            {isLocked && (
                                                <span className="block font-mono font-bold text-sm mt-1">
                                                    {formatCountdown(lockCountdown)}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence mode="wait">
                                {/* ═══ STEP 1: CREDENTIALS ═══ */}
                                {step === "credentials" && (
                                    <motion.div
                                        key="credentials"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <form className="space-y-5" onSubmit={handleLogin}>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2 block">
                                                        E-mail Corporativo
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            placeholder="email@mestresdaweb.com.br"
                                                            disabled={isLocked}
                                                            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg pl-11 pr-4 py-3.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/50 transition-all hover:bg-slate-900/80 disabled:opacity-40 disabled:cursor-not-allowed"
                                                        />
                                                        <Mail className="absolute left-4 top-[14px] w-4 h-4 text-slate-500" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2 block">
                                                        Senha
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            placeholder="••••••••"
                                                            disabled={isLocked}
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
                                            </div>

                                            {/* Login Button */}
                                            <div className="pt-1">
                                                <button
                                                    className="button-custom w-full group shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:pointer-events-none"
                                                    type="submit"
                                                    disabled={isLocked || isLoading}
                                                >
                                                    <div className="points_wrapper">
                                                        <i className="point"></i><i className="point"></i><i className="point"></i>
                                                        <i className="point"></i><i className="point"></i><i className="point"></i>
                                                        <i className="point"></i>
                                                    </div>
                                                    <div className="inner font-medium tracking-wide flex items-center gap-2 relative z-10 transition-transform duration-300">
                                                        {isLoading ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                <span>Entrando...</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span>Acessar Portal</span>
                                                                <svg className="w-4 h-4 icon fill-white transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24">
                                                                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </>
                                                        )}
                                                    </div>
                                                </button>
                                            </div>

                                            {/* Divider */}
                                            <div className="flex items-center gap-3 my-1">
                                                <div className="flex-1 h-px bg-slate-700/50" />
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-600">ou</span>
                                                <div className="flex-1 h-px bg-slate-700/50" />
                                            </div>

                                            {/* Google OAuth */}
                                            {hasRealGoogle ? (
                                                <div id="google-signin-btn" className="flex justify-center" />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleGoogleFallback}
                                                    disabled={isLocked || isLoading}
                                                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-900/80 hover:border-slate-500/50 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                    </svg>
                                                    <span>Entrar com Google</span>
                                                </button>
                                            )}

                                            {/* Remember + Forgot */}
                                            <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1">
                                                <label className="flex items-center space-x-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={rememberMe}
                                                        onChange={(e) => setRememberMe(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-4 h-4 rounded border border-slate-600/50 bg-slate-900/50 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                                                        <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M20 6L9 17l-5-5" />
                                                        </svg>
                                                    </div>
                                                    <span className="group-hover:text-white transition-colors">Lembrar-me</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowForgotModal(true); setResetEmail(email); setResetSent(false); }}
                                                    className="hover:text-blue-500 transition-colors text-slate-400 uppercase tracking-widest text-[10px] font-bold"
                                                >
                                                    Esqueci minha senha
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}

                                {/* ═══ STEP 2: 2FA CODE ═══ */}
                                {step === "2fa" && (
                                    <motion.div
                                        key="2fa"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                                <ShieldCheck size={28} className="text-blue-400" />
                                            </div>
                                            <h2 className="text-lg font-bold text-white mb-1">Verificação em 2 Fatores</h2>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Enviamos um código de 6 dígitos para<br />
                                                <strong className="text-blue-400">{email}</strong>
                                            </p>
                                        </div>

                                        {/* Code Inputs */}
                                        <div className="flex gap-2.5 justify-center mb-6">
                                            {codeDigits.map((digit, i) => (
                                                <input
                                                    key={i}
                                                    ref={(el) => { codeInputRefs.current[i] = el; }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    value={digit}
                                                    onChange={(e) => handleCodeInput(i, e.target.value)}
                                                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                                                    onPaste={(e) => {
                                                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                                                        if (pasted) {
                                                            e.preventDefault();
                                                            handleCodeInput(0, pasted);
                                                        }
                                                    }}
                                                    disabled={isLoading}
                                                    className="w-12 h-14 text-center text-xl font-bold bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all hover:bg-slate-900/80 disabled:opacity-40 caret-blue-400"
                                                />
                                            ))}
                                        </div>

                                        {/* Timer */}
                                        <div className="text-center mb-5">
                                            {codeCountdown > 0 ? (
                                                <p className="text-xs text-slate-500">
                                                    Código expira em <span className="font-mono font-bold text-amber-400">{formatCountdown(codeCountdown)}</span>
                                                </p>
                                            ) : (
                                                <p className="text-xs text-red-400 font-semibold">Código expirado</p>
                                            )}
                                        </div>

                                        {/* Verify Button */}
                                        <button
                                            onClick={handle2faSubmit}
                                            disabled={isLoading || codeDigits.some((d) => !d)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Verificando...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <ShieldCheck size={16} />
                                                    <span>Verificar Código</span>
                                                </>
                                            )}
                                        </button>

                                        {/* Resend + Back */}
                                        <div className="flex items-center justify-between mt-4">
                                            <button
                                                type="button"
                                                onClick={() => { setStep("credentials"); setError(""); }}
                                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                                            >
                                                <ArrowLeft size={12} />
                                                Voltar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleResend2fa}
                                                disabled={isLoading}
                                                className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-40"
                                            >
                                                Reenviar Código
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                </div>
            </main>

            {/* ═══ FORGOT PASSWORD MODAL ═══ */}
            <AnimatePresence>
                {showForgotModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setShowForgotModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                                <h2 className="text-base font-bold text-white">Recuperar Senha</h2>
                                <button onClick={() => setShowForgotModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5">
                                {resetSent ? (
                                    <div className="text-center py-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 size={22} className="text-blue-400" />
                                        </div>
                                        <h3 className="text-sm font-bold text-white mb-2">E-mail Enviado!</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Enviamos um link de recuperação para <strong className="text-white">{resetEmail}</strong>. Verifique sua caixa de entrada e spam.
                                        </p>
                                        <button
                                            onClick={() => setShowForgotModal(false)}
                                            className="mt-5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all"
                                        >
                                            Voltar ao Login
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleForgotPassword}>
                                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                            Informe seu e-mail cadastrado. Enviaremos um link para redefinir sua senha.
                                        </p>
                                        <div className="mb-4">
                                            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 block mb-1.5">E-mail</label>
                                            <input
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                placeholder="seu@email.com"
                                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowForgotModal(false)}
                                                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!resetEmail || resetLoading}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all"
                                            >
                                                {resetLoading ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Mail size={14} />
                                                        Enviar Link
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
