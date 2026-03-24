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
            error: result.error?.message || result.message || "Erro ao fazer login",
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
        // Try to restore from localStorage (real login)
        const stored = localStorage.getItem("user");
        const token = localStorage.getItem("accessToken");
        if (stored && token) {
            try {
                const user = JSON.parse(stored) as AuthUser;
                set({ user, isAuthenticated: true, isLoading: false });
                return;
            } catch {
                // Invalid JSON — fall through to mock
            }
        }
        // Fallback: mock user for dev
        const mockUser: AuthUser = {
            id: "mock-client-001",
            name: "Cliente Exemplo",
            email: "cliente@empresa.com",
            role: "CLIENT",
            avatar: null,
            allowedApps: ["client"],
        };
        set({ user: mockUser, isAuthenticated: true, isLoading: false });
    },
}));
