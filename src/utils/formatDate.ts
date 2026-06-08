/**
 * Formatea una fecha ISO a texto relativo ("hace 2 días") o absoluto ("10 jul 2025").
 */
export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
  return `hace ${Math.floor(diffDays / 365)} años`;
}

export function formatShortDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDayMonth(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatFullDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
