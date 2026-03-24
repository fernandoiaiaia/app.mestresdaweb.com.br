"use client";

import { create } from "zustand";
import {
    type AuthUser,
    type LoginResponse,
    loginApi,
    verify2faApi,
    googleLoginApi,
    logoutApi,
    setTokens,
    clearTokens,
    api,
} from "@/lib/api";

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (email: string, password: string) => Promise<{
        success: boolean;
        requires2fa?: boolean;
        tempToken?: string;
        error?: string;
    }>;
    verify2fa: (tempToken: string, code: string) => Promise<{ success: boolean; error?: string }>;
    googleLogin: (credential: string) => Promise<{
        success: boolean;
        requires2fa?: boolean;
        tempToken?: string;
        error?: string;
    }>;
    logout: () => Promise<void>;
    setUser: (user: AuthUser) => void;
    hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email: string, password: string) => {
        const result = await loginApi(email, password);

        if (result.success && result.data) {
            const data = result.data;

            // 2FA required
            if (data.requires2fa && data.tempToken) {
                return { success: false, requires2fa: true, tempToken: data.tempToken };
            }

            // Direct login (no 2FA)
            if (data.user && data.accessToken && data.refreshToken) {
                setTokens(data.accessToken, data.refreshToken);
                localStorage.setItem("user", JSON.stringify(data.user));
                set({ user: data.user, isAuthenticated: true });
                return { success: true };
            }
        }

        return {
            success: false,
            error: result.error?.message || result.message || "Credenciais inválidas.",
        };
    },

    verify2fa: async (tempToken: string, code: string) => {
        const result = await verify2faApi(tempToken, code);

        if (result.success && result.data) {
            const { user, accessToken, refreshToken } = result.data;
            setTokens(accessToken, refreshToken);
            localStorage.setItem("user", JSON.stringify(user));
            set({ user, isAuthenticated: true });
            return { success: true };
        }

        return {
            success: false,
            error: result.error?.message || result.message || "Código inválido ou expirado",
        };
    },

    googleLogin: async (credential: string) => {
        const result = await googleLoginApi(credential);

        if (result.success && result.data) {
            const data = result.data;

            if (data.requires2fa && data.tempToken) {
                return { success: false, requires2fa: true, tempToken: data.tempToken };
            }

            if (data.user && data.accessToken && data.refreshToken) {
                setTokens(data.accessToken, data.refreshToken);
                localStorage.setItem("user", JSON.stringify(data.user));
                set({ user: data.user, isAuthenticated: true });
                return { success: true };
            }
        }

        return {
            success: false,
            error: result.error?.message || result.message || "Erro ao logar com Google",
        };
    },

    logout: async () => {
        await logoutApi();
        clearTokens();
        set({ user: null, isAuthenticated: false });
    },

    setUser: (user: AuthUser) => {
        set({ user, isAuthenticated: true });
    },

    hydrate: () => {
        if (typeof window === "undefined") {
            set({ isLoading: false });
            return;
        }

        const token = localStorage.getItem("accessToken");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr) as AuthUser;
                set({ user, isAuthenticated: true, isLoading: false });

                // Refresh user data from API in background to keep allowedApps etc. in sync
                api<AuthUser>("/api/users/me").then((res) => {
                    if (res.success && res.data) {
                        localStorage.setItem("user", JSON.stringify(res.data));
                        set({ user: res.data });
                    }
                }).catch(() => { /* silently ignore — user stays with cached data */ });
            } catch {
                clearTokens();
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } else {
            set({ isLoading: false });
        }
    },
}));
