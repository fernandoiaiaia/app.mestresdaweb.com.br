import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { api } from "../lib/api";
import { setTokens, clearTokens, saveUserData, getUserData } from "../lib/secure-store";

interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    appleLogin: (identityToken: string, fullName?: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    updateSession: (updatedUser: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => ({ success: false }),
    appleLogin: async () => ({ success: false }),
    logout: async () => {},
    updateSession: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    // Application Bootstrap Check
    useEffect(() => {
        async function loadStorage() {
            try {
                // Try to get cached user quickly for initial UI
                const cachedUser = await getUserData();
                if (cachedUser) {
                    setUser(cachedUser);
                }

                // Verify session with backend silently
                const res = await api<{ user: AuthUser }>("/api/auth/me");
                if (res.success && res.data) {
                    setUser(res.data.user);
                    saveUserData(res.data.user);
                } else {
                    // Session expired or no token
                    setUser(null);
                    clearTokens();
                }
            } catch (err) {
                // Network error, fall back to cached user if exists
            } finally {
                setIsLoading(false);
            }
        }
        loadStorage();
    }, []);

    // Route Guard logic
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "login";
        
        if (!user && !inAuthGroup) {
            // Redirect to login if unauthenticated
            router.replace("/login");
        } else if (user && inAuthGroup) {
            // Redirect to dashboard if trying to access login while authenticated
            router.replace("/(dashboard)");
        }
    }, [user, isLoading, segments]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        const res = await api<any>("/api/auth/login", {
            method: "POST",
            body: { email, password },
            skipAuth: true,
        });

        if (res.success && res.data) {
            // Support normal login that returns tokens directly
            if (res.data.accessToken) {
                await setTokens(res.data.accessToken, res.data.refreshToken);
                setUser(res.data.user);
                saveUserData(res.data.user);
                setIsLoading(false);
                return { success: true };
            }
            // Missing 2FA support in simple mock:
            // if (res.data.requires2fa) ...
        }
        
        setIsLoading(false);
        return { success: false, message: res.message || "Credenciais inválidas" };
    };

    const appleLogin = async (identityToken: string, fullName?: string) => {
        setIsLoading(true);
        try {
            const res = await api<{ requires2fa?: boolean; tempToken?: string; accessToken?: string; refreshToken?: string; user?: AuthUser }>(
                "/api/auth/apple",
                {
                    method: "POST",
                    body: { identityToken, fullName },
                    skipAuth: true,
                }
            );

            if (res.success && res.data) {
                if (res.data.requires2fa) {
                    setIsLoading(false);
                    return { success: true, message: "2FA" };
                }
                if (res.data.accessToken && res.data.refreshToken) {
                    await setTokens(res.data.accessToken, res.data.refreshToken);
                    if (res.data.user) {
                        setUser(res.data.user);
                        await saveUserData(res.data.user);
                    }
                    setIsLoading(false);
                    return { success: true };
                }
            }
            setIsLoading(false);
            return { success: false, message: "Credenciais da Apple recusadas" };
        } catch (err: any) {
            setIsLoading(false);
            return {
                success: false,
                message: err.message || "Erro de conexão. Servidor inacessível.",
            };
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await api("/api/auth/logout", { method: "POST" });
        } catch { } // ignore if offline or already expired
        await clearTokens();
        setUser(null);
        setIsLoading(false);
    };

    const updateSession = (updatedUser: Partial<AuthUser>) => {
        if (!user) return;
        const newUser = { ...user, ...updatedUser };
        setUser(newUser);
        saveUserData(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, appleLogin, logout, updateSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
