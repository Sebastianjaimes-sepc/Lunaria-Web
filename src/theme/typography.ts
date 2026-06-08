/**
 * Sistema tipográfico de Lunaria.
 * Display/títulos: PlayfairDisplay (serif elegante).
 * UI/cuerpo: DMSans (limpia, moderna).
 */
export const fontFamily = {
  display: 'System',
  displayMedium: 'System',
  sans: 'System',
  sansMedium: 'System',
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 22,
  '4xl': 26,
  display: 32,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const typography = {
  // Títulos de pantalla
  screenTitle: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.tight,
  },
  // Títulos de sección
  sectionTitle: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.tight,
  },
  // Título de tarjeta
  cardTitle: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
  },
  // Cuerpo principal
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.relaxed,
  },
  // Cuerpo pequeño
  bodySmall: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.relaxed,
  },
  // Etiquetas y metadatos
  label: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  // Micro: contadores, badges
  micro: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  // Display para saludos
  greeting: {
    fontFamily: fontFamily.displayMedium,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.normal,
  },
} as const;
