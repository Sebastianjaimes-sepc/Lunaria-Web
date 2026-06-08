import { useTheme } from './ThemeContext';

export interface Colors {
  cream: string; surface: string; surfaceSecondary: string;
  purple: string; purpleLight: string; purpleBorder: string; purpleDark: string;
  terra: string; terraLight: string; terraBorder: string;
  teal: string; tealLight: string; tealBorder: string; tealDark: string;
  textPrimary: string; textSecondary: string; textHint: string; textOnPurple: string;
  border: string; borderStrong: string;
  success: string; successLight: string; error: string; errorLight: string;
  warning: string; warningLight: string;
  overlay: string; transparent: string;
}

const light: Colors = {
  cream: '#FAF8F4', surface: '#FFFFFF', surfaceSecondary: '#F4F2EE',
  purple: '#6B4E71', purpleLight: '#F0EAF2', purpleBorder: '#D0B8D5', purpleDark: '#4A3350',
  terra: '#C4775A', terraLight: '#FAF0EB', terraBorder: '#E8C4B0',
  teal: '#1D9E75', tealLight: '#E1F5EE', tealBorder: '#9FE1CB', tealDark: '#0F6E56',
  textPrimary: '#2D2A26', textSecondary: '#7A7670', textHint: '#B0ABA3', textOnPurple: '#FFFFFF',
  border: '#E8E4DC', borderStrong: '#CFC9C0',
  success: '#1D9E75', successLight: '#E1F5EE', error: '#A32D2D', errorLight: '#FCEBEB',
  warning: '#854F0B', warningLight: '#FAEEDA',
  overlay: 'rgba(45, 42, 38, 0.45)', transparent: 'transparent',
};

const dark: Colors = {
  cream: '#1A1814', surface: '#242018', surfaceSecondary: '#2E2A24',
  purple: '#C4A4CC', purpleLight: '#2D1F30', purpleBorder: '#5A3D60', purpleDark: '#E0C0E8',
  terra: '#E09070', terraLight: '#2E1A10', terraBorder: '#6B3820',
  teal: '#4DD4A0', tealLight: '#0D2E22', tealBorder: '#1A6648', tealDark: '#7EECC4',
  textPrimary: '#F0EDE8', textSecondary: '#A09890', textHint: '#605A52', textOnPurple: '#FFFFFF',
  border: '#2E2A24', borderStrong: '#3E3830',
  success: '#4DD4A0', successLight: '#0D2E22', error: '#E06060', errorLight: '#2E1010',
  warning: '#E0A040', warningLight: '#2E1E08',
  overlay: 'rgba(0,0,0,0.6)', transparent: 'transparent',
};

export function useColors(): Colors {
  const { isDark } = useTheme();
  return isDark ? dark : light;
}

// Static export for files that don't need reactivity (navigators, StyleSheet constants)
export { light as colors };
