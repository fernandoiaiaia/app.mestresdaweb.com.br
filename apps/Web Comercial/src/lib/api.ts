// ═══════════════════════════════════════
// ProposalAI — API Service
// ═══════════════════════════════════════

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";

interface ApiOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: Record<string, string>;
    skipAuth?: boolean;
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        errors?: Record<string, string[]>;
    };
}

function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
}

export function setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
}

export async function api<T = unknown>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, skipAuth = false } = options;

    const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...headers,
    };

    // Add auth token if available and not skipped
    if (!skipAuth) {
        const token = getAccessToken();
        if (token) {
            requestHeaders["Authorization"] = `Bearer ${token}`;
        }
    }

    const url = `${API_BASE_URL}${endpoint}`;

    let response: Response;
    let data: ApiResponse<T>;

    try {
        response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });
        try {
            data = await response.json();
        } catch {
            // Backend returned non-JSON (HTML error, empty body, etc.)
            return {
                success: false,
                message: `Servidor retornou resposta inválida (HTTP ${response.status}). Tente novamente.`,
            };
        }
    } catch (error) {
        // Network error, CORS, or backend offline
        console.warn(`[API] Failed to fetch ${url}:`, error);
        return {
            success: false,
            message: "Não foi possível conectar ao servidor. Verifique sua conexão ou se a API está rodando.",
        };
    }

    // If 401 and we have a refresh token, try to refresh
    if (response.status === 401 && !skipAuth) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
                const refreshData: ApiResponse<{ accessToken: string; refreshToken: string }> =
                    await refreshResponse.json();

                if (refreshData.success && refreshData.data) {
                    setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);

                    // Retry original request with new token
                    requestHeaders["Authorization"] = `Bearer ${refreshData.data.accessToken}`;
                    const retryResponse = await fetch(url, {
                        method,
                        headers: requestHeaders,
                        body: body ? JSON.stringify(body) : undefined,
                    });
                    return retryResponse.json();
                }
            }

            // Refresh failed — clear tokens and redirect to login
            clearTokens();
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
    }

    return data;
}

// ═══ Auth Types ═══

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
    allowedApps?: string[];
    permissions?: { module: string; action: string; dataScope: "OWN" | "ALL" }[];
}

export interface LoginResponse {
    requires2fa: boolean;
    tempToken?: string;
    user?: AuthUser;
    accessToken?: string;
    refreshToken?: string;
}

export interface Verify2faResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
}

export interface RegisterResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
}

// ═══ Auth API ═══

export async function loginApi(email: string, password: string) {
    return api<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
    });
}

export async function verify2faApi(tempToken: string, code: string) {
    return api<Verify2faResponse>("/api/auth/verify-2fa", {
        method: "POST",
        body: { tempToken, code },
        skipAuth: true,
    });
}

export async function googleLoginApi(credential: string) {
    return api<LoginResponse>("/api/auth/google", {
        method: "POST",
        body: { credential },
        skipAuth: true,
    });
}

export async function registerApi(name: string, email: string, password: string) {
    return api<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
        skipAuth: true,
    });
}

export async function logoutApi() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
        await api("/api/auth/logout", {
            method: "POST",
            body: { refreshToken },
        });
    }
    clearTokens();
}

export async function getMeApi() {
    return api<{ user: AuthUser }>("/api/auth/me");
}

export async function forgotPasswordApi(email: string) {
    return api<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
        skipAuth: true,
    });
}

export async function resetPasswordApi(token: string, newPassword: string) {
    return api<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: { token, newPassword },
        skipAuth: true,
    });
}
