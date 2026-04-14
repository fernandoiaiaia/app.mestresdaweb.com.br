import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./secure-store";

// Use LAN IP for local testing, or environment variable
// Example for Android Emulator: "http://10.0.2.2:7777"
// Example for iOS Simulator or WiFi LAN: "http://<YOUR_IP>:7777"
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.68.100:7777"; 

export interface ApiOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: Record<string, string>;
    skipAuth?: boolean;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        errors?: Record<string, string[]>;
    };
}

export async function api<T = unknown>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, skipAuth = false } = options;

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const requestHeaders: Record<string, string> = { ...headers };

    if (!isFormData && !requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json";
    }

    if (!skipAuth) {
        const token = await getAccessToken();
        if (token) {
            requestHeaders["Authorization"] = `Bearer ${token}`;
        }
    }

    const url = `${API_BASE_URL}${endpoint}`;
    let response: Response;
    let data: ApiResponse<T>;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: isFormData ? (body as any) : (body ? JSON.stringify(body) : undefined),
            signal: controller.signal as RequestInit["signal"],
        });
        
        clearTimeout(timeoutId);
        
        // Tratar NoContent (204)
        if (response.status === 204) {
            return { success: true } as ApiResponse<T>;
        }
        
        data = await response.json();
    } catch (error) {
        console.warn(`[API] Failed to fetch ${url}:`, error);
        return {
            success: false,
            message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
        };
    }

    // Refresh Token auto-handling
    if (response.status === 401 && !skipAuth) {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
                const refreshData: ApiResponse<{ accessToken: string; refreshToken: string }> = await refreshResponse.json();

                if (refreshData.success && refreshData.data) {
                    await setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);

                    // Re-try original request
                    requestHeaders["Authorization"] = `Bearer ${refreshData.data.accessToken}`;
                    const retryController = new AbortController();
                    const retryTimeout = setTimeout(() => retryController.abort(), 15000);
                    const retryResponse = await fetch(url, {
                        method,
                        headers: requestHeaders,
                        body: isFormData ? (body as any) : (body ? JSON.stringify(body) : undefined),
                        signal: retryController.signal as RequestInit["signal"],
                    });
                    clearTimeout(retryTimeout);
                    
                    if (retryResponse.status === 204) {
                        return { success: true } as ApiResponse<T>;
                    }
                    return retryResponse.json();
                }
            }

            // Expirou tudo
            await clearTokens();
            // TODO: Redirection logic could be placed here or handled by the Context
        }
    }

    return data;
}
