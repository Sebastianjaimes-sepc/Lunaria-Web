export const CULTURA_TIPOS = [
  'pelicula',
  'serie',
  'libro',
  'musica',
  'arte',
  'concierto',
] as const;

export const CULTURA_VALORACIONES = [
  'me marcó',
  'me gustó',
  'no era el momento',
] as const;

export const VIAJE_ESTADOS = [
  'sonado',
  'planificado',
  'realizado',
] as const;

export const ACTIVIDAD_TIPOS = [
  'llegada',
  'museo',
  'comida',
  'caminata',
  'transporte',
  'alojamiento',
  'compras',
  'otro',
] as const;

export const LUMI_MAX_DAILY_CALLS = 20;
export const LUMI_MAX_HISTORY_MESSAGES = 10;

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  fotos: 'fotos',
  viajesCovers: 'viajes-covers',
} as const;

export const IMAGE_COMPRESSION = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.7,
} as const;
