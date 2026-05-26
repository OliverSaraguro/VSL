export const colors = {
  primary: '#1B5E20',
  primaryLight: '#4C8C4A',
  primaryDark: '#003300',
  secondary: '#FF8F00',
  secondaryLight: '#FFC046',
  secondaryDark: '#C56000',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textInverse: '#FFFFFF',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  statusActive: '#4CAF50',
  statusPaused: '#FFC107',
  statusFinished: '#9E9E9E',
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  small: { fontSize: 12 },
  caption: { fontSize: 12 },
  body: { fontSize: 14 },
  h3: { fontSize: 20 },
  h2: { fontSize: 24 },
  h1: { fontSize: 32 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

const theme = { colors, typography, spacing, borderRadius, shadows } as const;

export type Theme = typeof theme;

export default theme;
