/**
 * Paleta de colores de Lunaria.
 * Usar siempre estas constantes — nunca hardcodear hex en los componentes.
 */
export const colors = {
  // ── Fondos ──────────────────────────────────────────────
  cream: '#FAF8F4',         // fondo principal de la app
  surface: '#FFFFFF',       // fondo de tarjetas y modales
  surfaceSecondary: '#F4F2EE', // fondo de inputs y elementos hundidos

  // ── Acento principal: malva / ciruela ───────────────────
  purple: '#6B4E71',
  purpleLight: '#F0EAF2',
  purpleBorder: '#D0B8D5',
  purpleDark: '#4A3350',

  // ── Acento secundario: terra cotta ──────────────────────
  terra: '#C4775A',
  terraLight: '#FAF0EB',
  terraBorder: '#E8C4B0',

  // ── Teal: viajes y progreso ──────────────────────────────
  teal: '#1D9E75',
  tealLight: '#E1F5EE',
  tealBorder: '#9FE1CB',
  tealDark: '#0F6E56',

  // ── Texto ────────────────────────────────────────────────
  textPrimary: '#2D2A26',
  textSecondary: '#7A7670',
  textHint: '#B0ABA3',
  textOnPurple: '#FFFFFF',

  // ── Bordes ───────────────────────────────────────────────
  border: '#E8E4DC',
  borderStrong: '#CFC9C0',

  // ── Semánticos ───────────────────────────────────────────
  success: '#1D9E75',
  successLight: '#E1F5EE',
  error: '#A32D2D',
  errorLight: '#FCEBEB',
  warning: '#854F0B',
  warningLight: '#FAEEDA',

  // ── Transparentes ────────────────────────────────────────
  overlay: 'rgba(45, 42, 38, 0.45)',
  transparent: 'transparent',
} as const;

export type Color = keyof typeof colors;
