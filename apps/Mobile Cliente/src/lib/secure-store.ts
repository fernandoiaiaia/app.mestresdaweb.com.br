import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_DATA_KEY = "userData";
const CREDENTIALS_KEY = "savedCredentials";
const BIO_ENABLED_KEY = "biometricsEnabled";

export async function setTokens(accessToken: string, refreshToken: string) {
    try {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {
        console.error("[SecureStore] Failed to save tokens", e);
    }
}

export async function getAccessToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (e) {
        return null;
    }
}

export async function getRefreshToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (e) {
        return null;
    }
}

export async function clearTokens() {
    try {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_DATA_KEY);
    } catch (e) {
        console.error("[SecureStore] Failed to clear tokens", e);
    }
}

export async function saveUserData(data: any) {
    try {
        await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(data));
    } catch (e) {
        // ignore
    }
}

export async function getUserData() {
    try {
        const raw = await SecureStore.getItemAsync(USER_DATA_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export async function saveCredentials(email: string, pass: string) {
    try {
        await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ email, pass }));
    } catch (e) {}
}

export async function getCredentials(): Promise<{ email: string; pass: string } | null> {
    try {
        const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export async function setBiometricsEnabled(enabled: boolean) {
    try {
        await SecureStore.setItemAsync(BIO_ENABLED_KEY, enabled ? "TRUE" : "FALSE");
    } catch (e) {}
}

export async function getBiometricsEnabled(): Promise<boolean> {
    try {
        const val = await SecureStore.getItemAsync(BIO_ENABLED_KEY);
        return val === "TRUE";
    } catch (e) {
        return false;
    }
}
