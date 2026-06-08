import { supabase } from '@/lib/supabase';
import type { LumiMensaje, ChatMessage } from '@/types/models';

// Cuántos mensajes mostrar en el historial al abrir el chat.
// Cada "turno" es 2 filas (user + assistant), así que 40 filas = 20 turnos.
const DEFAULT_HISTORY_LIMIT = 40;

// Cuántos mensajes conservar en DB por usuario.
// La limpieza elimina todo lo que supere este umbral.
const KEEP_LAST_N_MESSAGES = 100;

// ─────────────────────────────────────────────────────────────
//  Conversión DB → estado local
// ─────────────────────────────────────────────────────────────

/**
 * Convierte una fila de `lumi_mensajes` (DB) al tipo `ChatMessage`
 * que usa `useLumiStore` en memoria.
 *
 * La separación existe por diseño:
 *  - LumiMensaje  → forma exacta de la tabla Supabase
 *  - ChatMessage  → forma ligera para el estado local del chat
 */
export function dbMensajeToChatMessage(row: LumiMensaje): ChatMessage {
  return {
    id: row.id,
    rol: row.rol,
    contenido: row.contenido,
    timestamp: new Date(row.created_at),
  };
}

// ─────────────────────────────────────────────────────────────
//  Lectura
// ─────────────────────────────────────────────────────────────

/**
 * Devuelve los últimos `limit` mensajes del usuario, ordenados
 * cronológicamente (el más antiguo primero) para renderizar
 * correctamente el hilo del chat de arriba hacia abajo.
 *
 * Supabase devuelve DESC para aprovechar el índice
 * idx_lumi_mensajes_created, y luego revertimos en memoria.
 * Esto evita un ORDER BY ASC que no usa el índice.
 */
export async function getMensajesRecientes(
  userId: string,
  limit: number = DEFAULT_HISTORY_LIMIT
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('lumi_mensajes')
    .select('id, rol, contenido, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Revertir: la query trae [más reciente ... más antiguo],
  // necesitamos [más antiguo ... más reciente] para el chat.
  return (data as LumiMensaje[])
    .reverse()
    .map(dbMensajeToChatMessage);
}

/**
 * Carga una página adicional de mensajes anteriores a `beforeId`.
 * Usada para el scroll hacia atrás ("cargar más").
 *
 * Devuelve los mensajes en orden cronológico (antiguo → reciente),
 * listos para añadir al inicio del hilo visible.
 */
export async function getMensajesAntesde(
  userId: string,
  beforeCreatedAt: string,
  limit: number = DEFAULT_HISTORY_LIMIT
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('lumi_mensajes')
    .select('id, rol, contenido, created_at')
    .eq('user_id', userId)
    .lt('created_at', beforeCreatedAt)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return (data as LumiMensaje[])
    .reverse()
    .map(dbMensajeToChatMessage);
}

// ─────────────────────────────────────────────────────────────
//  Limpieza
// ─────────────────────────────────────────────────────────────

/**
 * Elimina los mensajes más antiguos del usuario, conservando
 * solo los últimos `keepLast`.
 *
 * Cuándo llamarla:
 *  - Desde la Edge Function de Lumi después de cada inserción
 *    (ya incluido en supabase/functions/lumi/index.ts).
 *  - Desde LumiScreen cuando el usuario pulsa "Limpiar conversación"
 *    (en ese caso usar deleteAllMensajes en su lugar).
 *
 * Retorna el número de filas eliminadas (0 si no había excedente).
 */
export async function deleteMensajesAntiguos(
  userId: string,
  keepLast: number = KEEP_LAST_N_MESSAGES
): Promise<number> {
  // Paso 1: obtener el created_at del mensaje que marca el umbral.
  // Todo lo anterior a ese timestamp se elimina.
  const { data: boundary, error: boundaryError } = await supabase
    .from('lumi_mensajes')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(keepLast - 1, keepLast - 1)   // fila en posición keepLast (0-indexed)
    .maybeSingle();

  if (boundaryError) throw boundaryError;

  // Si hay menos filas que keepLast, no hay nada que eliminar.
  if (!boundary) return 0;

  const cutoff = boundary.created_at as string;

  // Paso 2: eliminar todo lo anterior al cutoff.
  const { error: deleteError, count } = await supabase
    .from('lumi_mensajes')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .lt('created_at', cutoff);

  if (deleteError) throw deleteError;

  return count ?? 0;
}

/**
 * Elimina TODOS los mensajes del usuario.
 * Llamada cuando pulsa "Limpiar conversación" en LumiScreen.
 */
export async function deleteAllMensajes(userId: string): Promise<void> {
  const { error } = await supabase
    .from('lumi_mensajes')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
//  Conteo (utilitario para UI)
// ─────────────────────────────────────────────────────────────

/**
 * Retorna el número total de mensajes guardados del usuario.
 * Útil para mostrar en Perfil ("X conversaciones con Lumi").
 */
export async function countMensajes(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('lumi_mensajes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;

  return count ?? 0;
}