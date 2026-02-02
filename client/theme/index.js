/**
 * BSBS Design System – mobile-first barber shop app.
 * Supports light/dark themes; use useTheme() for reactive colors.
 * On web, uses boxShadow to avoid "shadow*" deprecation warnings.
 */
import { Platform } from 'react-native';

const SHADOWS_NATIVE = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
};

const SHADOWS_WEB = {
  sm: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  md: { boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
  lg: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
};

export const shadows = Platform.OS === 'web' ? SHADOWS_WEB : SHADOWS_NATIVE;

/** Theme color sets – use themes.light / themes.dark or useTheme() */
export const themes = {
  light: {
    colors: {
      background: '#FFFFFF',
      surface: '#F8F9FA',
      primary: '#1a1a2e',
      primaryLight: '#16213e',
      secondary: '#e94560',
      accent: '#0f3460',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      white: '#ffffff',
      black: '#000000',
      gray100: '#f8f9fa',
      gray200: '#e9ecef',
      gray300: '#dee2e6',
      gray400: '#ced4da',
      gray500: '#adb5bd',
      gray600: '#6c757d',
      gray700: '#495057',
      gray800: '#343a40',
      gray900: '#212529',
      card: '#ffffff',
      text: '#212529',
      textSecondary: '#6c757d',
      border: '#E5E5E5',
    },
  },
  dark: {
    colors: {
      background: '#0F0F0F',
      surface: '#1C1C1E',
      primary: '#0A84FF',
      primaryLight: '#409CFF',
      secondary: '#FF453A',
      accent: '#5E5CE6',
      success: '#32D74B',
      warning: '#FFD60A',
      error: '#FF453A',
      white: '#FFFFFF',
      black: '#000000',
      gray100: '#2C2C2E',
      gray200: '#38383A',
      gray300: '#48484A',
      gray400: '#636366',
      gray500: '#8E8E93',
      gray600: '#8E8E93',
      gray700: '#AEAEB2',
      gray800: '#C7C7CC',
      gray900: '#E5E5EA',
      card: '#1C1C1E',
      text: '#FFFFFF',
      textSecondary: '#8E8E93',
      border: '#38383A',
    },
  },
};

/** Default export colors = light theme (backward compatibility) */
export const colors = themes.light.colors;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 32,
};

/** Typography scale – hero, title, subtitle, body, caption, small */
export const typography = {
  hero: {
    fontSize: fontSizes.hero,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSizes.xxl,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
  },
  body: {
    fontSize: fontSizes.base,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: '400',
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: '400',
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const touchTargetMin = 44;

export default {
  colors,
  fontSizes,
  typography,
  spacing,
  borderRadius,
  shadows,
  touchTargetMin,
  themes,
};
