"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, isLoading, hydrate, user, logout } = useAuthStore();

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    // App-level access check: Cliente app expects CLIENT/VIEWER role, ADMIN/OWNER, or 'hub'/'client' in allowedApps
    const hasAppAccess =
        !user ||
        user.role === "OWNER" ||
        user.role === "ADMIN" ||
        user.role === "CLIENT" ||
        user.role === "VIEWER" ||
        (user.allowedApps && (user.allowedApps.includes("hub") || user.allowedApps.includes("client")));

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-blue-600/30 border-t-green-500 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400 font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    if (!hasAppAccess) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Sua conta não tem permissão para acessar o <span className="text-blue-400 font-semibold">Painel do Cliente</span>. 
                        Entre em contato com o suporte para solicitar acesso.
                    </p>
                    <button
                        onClick={async () => { await logout(); router.push("/login"); }}
                        className="mt-4 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors border border-white/10"
                    >
                        Voltar ao Login
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
