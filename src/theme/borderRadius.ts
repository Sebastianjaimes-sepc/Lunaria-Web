export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

/**
 * En React Native no hay box-shadow CSS.
 * Usamos elevation (Android) + shadow* (iOS).
 * Lunaria es flat-first — las sombras son sutiles.
 */
export const shadows = {
  none: {},
  sm: {
    elevation: 1,
    shadowColor: '#2D2A26',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  md: {
    elevation: 3,
    shadowColor: '#2D2A26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
} as const;
