"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ArrowRight, AlertTriangle, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ClientLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isFirstAccess, setIsFirstAccess] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email || !password) { setError("Preencha todos os campos."); return; }
        setIsLoading(true);
        await new Promise((r) => setTimeout(r, 1000));
        // Mock: simulate first access detection
        if (password === "primeiro") {
            setIsFirstAccess(true);
            setIsLoading(false);
            return;
        }
        router.push("/client/proposal/abc123");
        setIsLoading(false);
    };

    const handleCreatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (newPassword.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
        if (newPassword !== confirmPassword) { setError("As senhas não coincidem."); return; }
        setIsLoading(true);
        await new Promise((r) => setTimeout(r, 1200));
        router.push("/client/proposal/abc123");
    };

    return (
        <div className="relative min-h-screen bg-slate-950 overflow-hidden flex items-center justify-center p-6">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/50">
                    {/* Brand Name */}
                    <div className="flex justify-center mb-8">
                        <span className="text-4xl font-bold tracking-tight text-white font-varela-round lowercase">cezani</span>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-xl font-bold text-white mb-1">Portal do Cliente</h1>
                        <p className="text-sm text-slate-400">
                            {isFirstAccess ? "Crie sua senha de acesso" : "Acesse sua proposta comercial"}
                        </p>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4 text-xs text-red-400">
                                <AlertTriangle size={14} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {!isFirstAccess ? (
                            <motion.form key="login" onSubmit={handleLogin} className="space-y-4" initial={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">E-mail</label>
                                    <div className="relative">
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20" />
                                        <Mail className="absolute left-3.5 top-[13px] w-4 h-4 text-slate-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Senha</label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20" />
                                        <Lock className="absolute left-3.5 top-[13px] w-4 h-4 text-slate-500" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[12px] text-slate-500 hover:text-slate-300" tabIndex={-1}>
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Entrar</span><ArrowRight size={16} /></>}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form key="first-access" onSubmit={handleCreatePassword} className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl mb-4">
                                    <p className="text-[11px] text-blue-300/70 leading-relaxed">Este é seu primeiro acesso. Crie uma senha segura para acessar suas propostas.</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nova Senha</label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20" />
                                        <Lock className="absolute left-3.5 top-[13px] w-4 h-4 text-slate-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Confirmar Senha</label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20" />
                                        <Lock className="absolute left-3.5 top-[13px] w-4 h-4 text-slate-500" />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="sr-only peer" />
                                    <div className="w-4 h-4 rounded border border-slate-600 bg-slate-800 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                                    </div>
                                    <span className="text-xs text-slate-400">Mostrar senhas</span>
                                </label>
                                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Criar Senha e Acessar</span><ArrowRight size={16} /></>}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer branding */}
                <p className="text-center text-[10px] text-slate-600 mt-6">
                    Desenvolvido por <span className="text-slate-400 font-medium">Cezani</span> · Todos os direitos reservados
                </p>
            </motion.div>
        </div>
    );
}
