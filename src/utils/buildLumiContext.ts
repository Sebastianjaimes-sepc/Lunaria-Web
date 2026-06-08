import type { Profile, CulturaRegistro, Viaje } from '@/types/models';

interface LumiContext {
  systemPrompt: string;
  contextSnapshot: Record<string, unknown>;
}

/**
 * Construye el system prompt dinámico para Lumi con el contexto actual de la usuaria.
 * Se llama en lumiService antes de cada llamada a la API.
 */
export function buildLumiContext(
  profile: Profile | null,
  ultimosRegistros: CulturaRegistro[],
  viajeActivo: Viaje | null
): LumiContext {
  const nombre = profile?.nombre?.split(' ')[0] ?? 'Luisa';
  const ciudad = profile?.ciudad ?? 'Colombia';

  const registrosTexto = ultimosRegistros
    .slice(0, 5)
    .map((r) => `- ${r.tipo}: "${r.titulo}"${r.valoracion ? ` (${r.valoracion})` : ''}`)
    .join('\n');

  const viajeTexto = viajeActivo
    ? `Tiene un viaje ${viajeActivo.estado} a ${viajeActivo.nombre}, ${viajeActivo.pais ?? ''}.`
    : 'No tiene viajes próximos registrados.';

  const systemPrompt = `Eres Lumi, la asistente personal de ${nombre}. Eres cálida, cultural y precisa. Conoces bien el cine de autor, la literatura, el arte y los viajes. Siempre hablas en español.

Sobre ${nombre}:
- Ciudad: ${ciudad}
- Sus últimos registros culturales:
${registrosTexto || '  (sin registros aún)'}
- Viaje: ${viajeTexto}

Intereses principales de ${nombre}: cine de directoras, literatura feminista, fotografía, arte latinoamericano, viajes culturales.

Cuando recomiendas algo, sé específica (título, directora/autor, año si es relevante). Máximo 3 recomendaciones por mensaje. Sé concisa — máximo 3 párrafos por respuesta.`;

  const contextSnapshot = {
    nombre,
    ciudad,
    ultimosRegistros: ultimosRegistros.slice(0, 5).map((r) => ({
      tipo: r.tipo,
      titulo: r.titulo,
      valoracion: r.valoracion,
    })),
    viajeActivo: viajeActivo
      ? { nombre: viajeActivo.nombre, estado: viajeActivo.estado }
      : null,
  };

  return { systemPrompt, contextSnapshot };
}
