import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const supabaseUrl: string =
  (Constants.expoConfig?.extra?.supabaseUrl as string) ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

const supabaseAnonKey: string =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string) ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Adaptador de storage multiplataforma.
 * - Web: usa localStorage (disponible en todos los navegadores)
 * - Native: usa expo-secure-store
 */
const getStorageAdapter = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch {
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {}
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {}
        return Promise.resolve();
      },
    };
  }

  // Native: expo-secure-store con fallback a memoria
  const memoryFallback: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SecureStore = require('expo-secure-store');

  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        const val = await SecureStore.getItemAsync(key);
        return val ?? memoryFallback[key] ?? null;
      } catch {
        return memoryFallback[key] ?? null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        if (value.length > 1800) {
          memoryFallback[key] = value;
        } else {
          await SecureStore.setItemAsync(key, value);
        }
      } catch {
        memoryFallback[key] = value;
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {}
      delete memoryFallback[key];
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
