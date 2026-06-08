import { supabase } from '@/lib/supabase';
import type { CulturaRegistro, CulturaTipo, CulturaValoracion } from '@/types/models';

export async function getCulturaRegistros(userId: string): Promise<CulturaRegistro[]> {
  const { data, error } = await supabase
    .from('cultura_registros')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CulturaRegistro[];
}

export interface CreateCulturaInput {
  tipo: CulturaTipo;
  titulo: string;
  autor_director?: string | null;
  anio?: string | null;
  valoracion?: CulturaValoracion | null;
  notas?: string | null;
  emociones?: string[];
  etiquetas?: string[];
  fecha_consumo?: string | null;
}

export async function createCulturaRegistro(
  userId: string,
  input: CreateCulturaInput
): Promise<CulturaRegistro> {
  const { data, error } = await supabase
    .from('cultura_registros')
    .insert({
      user_id: userId,
      tipo: input.tipo,
      titulo: input.titulo.trim(),
      autor_director: input.autor_director?.trim() || null,
      anio: input.anio?.trim() || null,
      valoracion: input.valoracion ?? null,
      notas: input.notas?.trim() || null,
      emociones: input.emociones ?? [],
      etiquetas: input.etiquetas ?? [],
      fecha_consumo: input.fecha_consumo ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CulturaRegistro;
}

export async function updateCulturaRegistro(
  id: string,
  updates: Partial<CreateCulturaInput>
): Promise<CulturaRegistro> {
  const { data, error } = await supabase
    .from('cultura_registros')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CulturaRegistro;
}

export async function deleteCulturaRegistro(id: string): Promise<void> {
  const { error } = await supabase
    .from('cultura_registros')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
