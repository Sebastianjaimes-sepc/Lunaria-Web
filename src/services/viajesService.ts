import { supabase } from '@/lib/supabase';
import type { Viaje, Actividad, ViajeEstado, ActividadTipo } from '@/types/models';

// ── Viajes ─────────────────────────────────────────────────

export async function getViajes(userId: string): Promise<Viaje[]> {
  const { data, error } = await supabase
    .from('viajes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Viaje[];
}

export interface CreateViajeInput {
  nombre: string;
  pais?: string | null;
  ciudad?: string | null;
  estado: ViajeEstado;
  notas?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

export async function createViaje(
  userId: string,
  input: CreateViajeInput
): Promise<Viaje> {
  const { data, error } = await supabase
    .from('viajes')
    .insert({
      user_id: userId,
      nombre: input.nombre.trim(),
      pais: input.pais?.trim() || null,
      ciudad: input.ciudad?.trim() || null,
      estado: input.estado,
      notas: input.notas?.trim() || null,
      fecha_inicio: input.fecha_inicio ?? null,
      fecha_fin: input.fecha_fin ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Viaje;
}

export async function deleteViaje(id: string): Promise<void> {
  const { error } = await supabase.from('viajes').delete().eq('id', id);
  if (error) throw error;
}

// ── Actividades ────────────────────────────────────────────

export async function getActividades(viajeId: string): Promise<Actividad[]> {
  const { data, error } = await supabase
    .from('actividades')
    .select('*')
    .eq('viaje_id', viajeId)
    .order('dia_numero', { ascending: true })
    .order('orden', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Actividad[];
}

export interface CreateActividadInput {
  viaje_id: string;
  dia_numero: number;
  titulo: string;
  tipo?: ActividadTipo;
  hora?: string | null;
  notas?: string | null;
}

export async function createActividad(input: CreateActividadInput): Promise<Actividad> {
  const { data, error } = await supabase
    .from('actividades')
    .insert({
      viaje_id: input.viaje_id,
      dia_numero: input.dia_numero,
      titulo: input.titulo.trim(),
      tipo: input.tipo ?? 'otro',
      hora: input.hora?.trim() || null,
      notas: input.notas?.trim() || null,
      completada: false,
      orden: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Actividad;
}

export async function toggleActividadCompletada(
  id: string,
  completada: boolean
): Promise<void> {
  const { error } = await supabase
    .from('actividades')
    .update({ completada })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteActividad(id: string): Promise<void> {
  const { error } = await supabase.from('actividades').delete().eq('id', id);
  if (error) throw error;
}
