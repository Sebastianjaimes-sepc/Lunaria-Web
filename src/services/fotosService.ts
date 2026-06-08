import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { STORAGE_BUCKETS } from '@/constants';
import { compressImage } from '@/utils/compressImage';
import type { Foto } from '@/types/models';

const SUPABASE_URL: string =
  (Constants.expoConfig?.extra?.supabaseUrl as string) ?? '';
const SUPABASE_ANON_KEY: string =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string) ?? '';

// ── Upload ─────────────────────────────────────────────────

export async function uploadFoto(
  userId: string,
  fileUri: string
): Promise<string> {
  const compressed = await compressImage(fileUri, { includeBase64: true });
  if (!compressed.base64) throw new Error('compressImage no devolvió base64.');

  const binary = atob(compressed.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Sin sesión activa.');

  const fileName = `${Date.now()}.jpg`;
  const filePath = `${userId}/${new Date().getFullYear()}/${fileName}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKETS.fotos}/${filePath}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
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

// ── CRUD ───────────────────────────────────────────────────

export async function getFotos(userId: string): Promise<Foto[]> {
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Foto[];
}

export async function createFoto(
  userId: string,
  storagePath: string,
  meta: { lugar?: string; notas?: string; fecha_foto?: string; viaje_id?: string }
): Promise<Foto> {
  const { data, error } = await supabase
    .from('fotos')
    .insert({
      user_id: userId,
      storage_path: storagePath,
      lugar: meta.lugar?.trim() || null,
      notas: meta.notas?.trim() || null,
      fecha_foto: meta.fecha_foto || null,
      viaje_id: meta.viaje_id || null,
      etiquetas: [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as Foto;
}

export async function deleteFoto(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from(STORAGE_BUCKETS.fotos).remove([storagePath]);
  const { error } = await supabase.from('fotos').delete().eq('id', id);
  if (error) throw error;
}

export async function getFotoSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.fotos)
    .createSignedUrl(storagePath, 60 * 60 * 24);

  if (error || !data?.signedUrl) {
    throw error ?? new Error('No se pudo generar la URL.');
  }
  return data.signedUrl;
}
