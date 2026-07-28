"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "default";
}

interface ToastContextValue {
    toast: {
        success: (title: string, description?: string) => void;
        error: (title: string, description?: string) => void;
        warning: (title: string, description?: string) => void;
        info: (title: string, description?: string) => void;
    };
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

const iconMap: Record<ToastType, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const styleMap: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
    success: { bg: "bg-slate-800/95", border: "border-blue-500/30", icon: "text-blue-400", bar: "bg-green-500" },
    error: { bg: "bg-slate-800/95", border: "border-red-500/30", icon: "text-red-400", bar: "bg-red-500" },
    warning: { bg: "bg-slate-800/95", border: "border-amber-500/30", icon: "text-amber-400", bar: "bg-amber-500" },
    info: { bg: "bg-slate-800/95", border: "border-blue-500/30", icon: "text-blue-400", bar: "bg-blue-500" },
};

let uid = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmState, setConfirmState] = useState<{
        options: ConfirmOptions;
        resolve: (value: boolean) => void;
    } | null>(null);
    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const removeToast = useCallback((id: string) => {
        const timer = timersRef.current.get(id);
        if (timer) clearTimeout(timer);
        timersRef.current.delete(id);
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, title: string, description?: string, duration = 4000) => {
        const id = `toast-${++uid}`;
        setToasts(prev => [...prev.slice(-4), { id, type, title, description, duration }]);
        const timer = setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
    }, [removeToast]);

    const toast: ToastContextValue["toast"] = {
        success: (title, desc) => addToast("success", title, desc),
        error: (title, desc) => addToast("error", title, desc, 6000),
        warning: (title, desc) => addToast("warning", title, desc, 5000),
        info: (title, desc) => addToast("info", title, desc),
    };

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setConfirmState({ options, resolve });
        });
    }, []);

    const handleConfirm = (value: boolean) => {
        confirmState?.resolve(value);
        setConfirmState(null);
    };

    const confirmVariantStyles = {
        danger: { btn: "bg-red-600 hover:bg-red-500 shadow-red-600/20", icon: "text-red-400", iconBg: "bg-red-500/15", bar: "bg-red-500" },
        warning: { btn: "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20", icon: "text-amber-400", iconBg: "bg-amber-500/15", bar: "bg-amber-500" },
        default: { btn: "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20", icon: "text-blue-400", iconBg: "bg-blue-500/15", bar: "bg-blue-500" },
    };

    return (
        <ToastContext.Provider value={{ toast, confirm }}>
            {children}

            {/* Toast Stack */}
            <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: 420 }}>
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => {
                        const Icon = iconMap[t.type];
                        const style = styleMap[t.type];
                        return (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className={`pointer-events-auto relative overflow-hidden ${style.bg} backdrop-blur-xl border ${style.border} rounded-2xl shadow-2xl shadow-black/40 cursor-pointer`}
                                onClick={() => removeToast(t.id)}
                            >
                                <div className={`absolute top-0 left-0 right-0 h-[2px] ${style.bar}`} />
                                <div className="flex items-start gap-3 p-4 pr-10">
                                    <div className={`mt-0.5 ${style.icon}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white leading-tight">{t.title}</p>
                                        {t.description && (
                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.description}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeToast(t.id); }}
                                    className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                                <motion.div
                                    initial={{ scaleX: 1 }}
                                    animate={{ scaleX: 0 }}
                                    transition={{ duration: (t.duration || 4000) / 1000, ease: "linear" }}
                                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${style.bar} opacity-40 origin-left`}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Confirm Dialog */}
            <AnimatePresence>
                {confirmState && (() => {
                    const v = confirmState.options.variant || "default";
                    const vs = confirmVariantStyles[v];
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[99999] flex items-center justify-center"
                            onClick={() => handleConfirm(false)}
                        >
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                onClick={e => e.stopPropagation()}
                                className="relative w-full max-w-sm mx-4 bg-slate-800/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 right-0 h-1 ${vs.bar}`} />
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 ${vs.iconBg} rounded-xl flex items-center justify-center`}>
                                            <AlertTriangle size={20} className={vs.icon} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">{confirmState.options.title}</h3>
                                    </div>
                                    {confirmState.options.description && (
                                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">{confirmState.options.description}</p>
                                    )}
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleConfirm(false)}
                                            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                                        >
                                            {confirmState.options.cancelLabel || "Cancelar"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleConfirm(true)}
                                            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-lg ${vs.btn}`}
                                        >
                                            {confirmState.options.confirmLabel || "Confirmar"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </ToastContext.Provider>
    );
}
