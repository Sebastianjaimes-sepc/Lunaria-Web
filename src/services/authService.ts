import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { STORAGE_BUCKETS } from '@/constants';
import { compressImage } from '@/utils/compressImage';
import type { Profile } from '@/types/models';

// Leer las credenciales del mismo origen que el cliente Supabase
const SUPABASE_URL: string =
  (Constants.expoConfig?.extra?.supabaseUrl as string) ?? '';
const SUPABASE_ANON_KEY: string =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string) ?? '';

// ── Auth ───────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  if (Platform.OS === 'web') {
    try { localStorage.clear(); } catch {}
    window.location.href = '/';
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ── Profile ────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'nombre' | 'ciudad' | 'avatar_url'>>
): Promise<Profile> {
  const clean = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as Partial<Pick<Profile, 'nombre' | 'ciudad' | 'avatar_url'>>;

  const { data, error } = await supabase
    .from('profiles')
    .update(clean)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

// ── Avatar Storage ─────────────────────────────────────────

/**
 * Sube el avatar a Supabase Storage usando fetch() con ArrayBuffer.
 *
 * Por qué NO usar el SDK de supabase-js para el upload:
 * supabase-js usa XMLHttpRequest internamente. En React Native (Expo SDK 54,
 * RN 0.81), XHR no maneja correctamente los objetos Blob producidos por
 * expo-image-manipulator: el body llega vacío o con Content-Type incorrecto.
 * fetch() con ArrayBuffer es la única vía confiable en este entorno.
 *
 * Por qué base64 → ArrayBuffer y no fetch(uri) directamente:
 * Las URIs de ImageManipulator son file:// locales. En Android, fetch() sobre
 * file:// puede fallar según la versión del JSC/Hermes. Pasar por base64
 * garantiza que el cuerpo sea binario puro independientemente del motor JS.
 */
export async function uploadAvatar(
  userId: string,
  fileUri: string,
  webFile?: File
): Promise<string> {
  // 1. Comprimir y obtener base64
  const compressed = await compressImage(fileUri, { includeBase64: true });
  if (!compressed.base64) {
    throw new Error('compressImage no devolvió base64.');
  }

  // 2. base64 → ArrayBuffer
  const b64 = compressed.base64;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  // 3. Sesión activa
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Sin sesión activa. Inicia sesión nuevamente.');

  // 4. Upload directo vía fetch
  const filePath = `${userId}/avatar.jpg`;
  const url = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKETS.avatars}/${filePath}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    },
    body: bytes.buffer,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.status.toString());
    throw new Error(`Upload falló (${res.status}): ${body}`);
  }

  return filePath;
}

/**
 * Genera una URL firmada de 7 días para mostrar el avatar.
 * Si ya es una URL completa, la devuelve sin cambios.
 */
export async function getAvatarUrl(avatarPathOrUrl: string): Promise<string> {
  if (avatarPathOrUrl.startsWith('http')) return avatarPathOrUrl;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.avatars)
    .createSignedUrl(avatarPathOrUrl, 60 * 60 * 24 * 7);

  if (error || !data?.signedUrl) {
    throw error ?? new Error('No se pudo generar la URL del avatar.');
  }
  return data.signedUrl;
}
