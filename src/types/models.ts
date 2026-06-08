/**
 * Tipos de dominio de Lunaria.
 * Reflejan exactamente el esquema de Supabase (lunaria_schema_v2.sql).
 */

// ── Perfil ─────────────────────────────────────────────────
export interface Profile {
  id: string;
  nombre: string | null;
  ciudad: string | null;
  avatar_url: string | null;
  created_at: string;
}

// ── Cultura ────────────────────────────────────────────────
export type CulturaTipo =
  | 'pelicula'
  | 'serie'
  | 'libro'
  | 'musica'
  | 'arte'
  | 'concierto';

export type CulturaValoracion =
  | 'me marcó'
  | 'me gustó'
  | 'no era el momento';

export interface CulturaRegistro {
  id: string;
  user_id: string;
  tipo: CulturaTipo;
  titulo: string;
  autor_director: string | null;
  anio: string | null;
  valoracion: CulturaValoracion | null;
  notas: string | null;
  emociones: string[];
  etiquetas: string[];
  fecha_consumo: string | null;
  created_at: string;
  updated_at: string;
}

// ── Viajes ─────────────────────────────────────────────────
export type ViajeEstado = 'sonado' | 'planificado' | 'realizado';

export interface Viaje {
  id: string;
  user_id: string;
  nombre: string;
  pais: string | null;
  ciudad: string | null;
  estado: ViajeEstado;
  notas: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Actividades ────────────────────────────────────────────
export type ActividadTipo =
  | 'llegada'
  | 'museo'
  | 'comida'
  | 'caminata'
  | 'transporte'
  | 'alojamiento'
  | 'compras'
  | 'otro';

export interface Actividad {
  id: string;
  viaje_id: string;
  dia_numero: number;
  titulo: string;
  tipo: ActividadTipo;
  hora: string | null;
  notas: string | null;
  completada: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

// ── Fotos ──────────────────────────────────────────────────
export interface Foto {
  id: string;
  user_id: string;
  viaje_id: string | null;
  storage_path: string;
  lugar: string | null;
  notas: string | null;
  etiquetas: string[];
  fecha_foto: string | null;
  created_at: string;
  updated_at: string;
  // URL firmada, resuelta en runtime (no viene de la DB)
  signed_url?: string;
}

// ── Lumi ───────────────────────────────────────────────────
export type LumiRol = 'user' | 'assistant';

export interface LumiMensaje {
  id: string;
  user_id: string;
  rol: LumiRol;
  contenido: string;
  contexto_snap: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface LumiUsoDiario {
  id: string;
  user_id: string;
  fecha: string;
  llamadas: number;
  created_at: string;
  updated_at: string;
}

// ── Chat (estado local, no persiste directamente) ──────────
export interface ChatMessage {
  id: string;
  rol: LumiRol;
  contenido: string;
  timestamp: Date;
}
