"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

// ═══════════════════════════════════════════════════════════════════
// DEV MODE: AuthGuard desabilitado — acesso livre sem login.
// Quando conectar ao backend, restaurar a verificação original.
// ═══════════════════════════════════════════════════════════════════

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { hydrate } = useAuthStore();

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    return <>{children}</>;
}
