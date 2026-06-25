/**
 * Design token constants for the Calorics app.
 * All colors, spacing, typography, and border radius values live here.
 * Import from this file — never hardcode values in components.
 */

export const Colors = {
  // Backgrounds
  background: '#09090F',
  surface: '#13131A',
  surfaceElevated: '#1C1C26',
  border: '#2A2A38',
  borderFocus: '#00FF87',

  // Brand / Accent
  accent: '#00FF87',       // vibrant neon green
  accentLight: '#5CFFB1',
  accentDark: '#00B35F',
  accentGlow: 'rgba(0, 255, 135, 0.25)',

  // Google brand
  google: '#EA4335',

  // Text
  textPrimary: '#F0F0FF',
  textSecondary: '#9494B0',
  textMuted: '#5A5A78',
  textOnAccent: '#FFFFFF',

  // Status
  error: '#FF5B74',
  errorBg: 'rgba(255, 91, 116, 0.12)',
  success: '#34D399',
  successBg: 'rgba(52, 211, 153, 0.12)',

  // Overlay
  overlay: 'rgba(9, 9, 15, 0.85)',
  shimmer: 'rgba(255, 255, 255, 0.05)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 34,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  accent: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
