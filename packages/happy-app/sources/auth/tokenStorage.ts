import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_KEY = 'auth_credentials';

// Cache for synchronous access
let credentialsCache: string | null = null;

export interface AuthCredentials {
    token: string;
    secret: string;
}

function parseCredentials(raw: string): AuthCredentials | null {
    try {
        const parsed = JSON.parse(raw) as Partial<AuthCredentials> | null;
        if (!parsed || typeof parsed.token !== 'string' || typeof parsed.secret !== 'string') {
            return null;
        }
        return {
            token: parsed.token,
            secret: parsed.secret,
        };
    } catch {
        return null;
    }
}

export const TokenStorage = {
    async getCredentials(): Promise<AuthCredentials | null> {
        if (Platform.OS === 'web') {
            const stored = localStorage.getItem(AUTH_KEY);
            if (!stored) {
                credentialsCache = null;
                return null;
            }

            const parsed = parseCredentials(stored);
            if (!parsed) {
                credentialsCache = null;
                localStorage.removeItem(AUTH_KEY);
                return null;
            }

            credentialsCache = stored;
            return parsed;
        }
        try {
            const stored = await SecureStore.getItemAsync(AUTH_KEY);
            if (!stored) return null;
            const parsed = parseCredentials(stored);
            if (!parsed) {
                credentialsCache = null;
                await SecureStore.deleteItemAsync(AUTH_KEY);
                return null;
            }
            credentialsCache = stored; // Update cache
            return parsed;
        } catch (error) {
            console.error('Error getting credentials:', error);
            return null;
        }
    },

    async setCredentials(credentials: AuthCredentials): Promise<boolean> {
        if (Platform.OS === 'web') {
            const json = JSON.stringify(credentials);
            localStorage.setItem(AUTH_KEY, json);
            credentialsCache = json;
            return true;
        }
        try {
            const json = JSON.stringify(credentials);
            await SecureStore.setItemAsync(AUTH_KEY, json);
            credentialsCache = json; // Update cache
            return true;
        } catch (error) {
            console.error('Error setting credentials:', error);
            return false;
        }
    },

    async removeCredentials(): Promise<boolean> {
        if (Platform.OS === 'web') {
            localStorage.removeItem(AUTH_KEY);
            credentialsCache = null;
            return true;
        }
        try {
            await SecureStore.deleteItemAsync(AUTH_KEY);
            credentialsCache = null; // Clear cache
            return true;
        } catch (error) {
            console.error('Error removing credentials:', error);
            return false;
        }
    },
};
