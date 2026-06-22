/**
 * GymApp Design Tokens — Palette B: Violeta Profundo + Oro Élite
 * Fuente: Geist Sans / Geist Mono (Vercel)
 *
 * Usar estos valores como fuente de verdad en web (CSS variables) y mobile (StyleSheet).
 */

export const COLORS = {
  /* ── Primario: Violeta ────────────────────────────────────────── */
  violet50: '#F5F3FF',
  violet100: '#EDE9FE',
  violet200: '#DDD6FE',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet500: '#8B5CF6',
  violet600: '#7C3AED', // primary light mode
  violet700: '#6D28D9',
  violet800: '#5B21B6',
  violet900: '#4C1D95',
  violet950: '#2E1065',

  /* ── Acento / Oro: Amber ─────────────────────────────────────── */
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber300: '#FCD34D',
  amber400: '#FBBF24', // premium / oro élite
  amber500: '#F59E0B',
  amber600: '#D97706', // accent light mode
  amber700: '#B45309',
  amber800: '#92400E',

  /* ── Neutros: Zinc ───────────────────────────────────────────── */
  zinc50: '#FAFAFA', // background light
  zinc100: '#F4F4F5', // muted light
  zinc200: '#E4E4E7', // border light
  zinc300: '#D4D4D8',
  zinc400: '#A1A1AA', // sidebar-fg / muted dark
  zinc500: '#71717A', // muted-foreground light
  zinc600: '#52525B',
  zinc700: '#3F3F46',
  zinc800: '#27272A', // border dark
  zinc900: '#18181B', // sidebar bg / card dark
  zinc950: '#09090B', // background dark

  /* ── Semánticos ──────────────────────────────────────────────── */
  success: '#10B981', // emerald-500
  warning: '#D97706', // amber-600
  danger: '#EF4444', // red-500
  info: '#7C3AED', // mismo que primary

  /* ── Risk Score ──────────────────────────────────────────────── */
  riskLow: '#10B981',
  riskMedium: '#D97706',
  riskHigh: '#EF4444',
} as const;

export const TYPOGRAPHY = {
  fontSans: 'Geist, system-ui, sans-serif',
  fontMono: 'Geist Mono, monospace',

  /* Escala de tamaños */
  size: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    display: 40,
  },

  /* Pesos */
  weight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
  },
} as const;

export const SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  '2xl': 18,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: '0 1px 3px rgba(0,0,0,0.08)',
  md: '0 2px 8px rgba(0,0,0,0.10)',
  lg: '0 4px 20px rgba(0,0,0,0.12)',
  card: '0 1px 4px rgba(0,0,0,0.06)',
} as const;

export const ANIMATION = {
  durationFast: 150,
  durationNormal: 250,
  durationSlow: 400,
  durationCounter: 600,
  springBounciness: 8,
  springSpeed: 10,
} as const;

/* ── Theme objects (para pasar a ThemeProvider mobile) ─────────── */

export const THEME_LIGHT = {
  colors: {
    primary: COLORS.violet600,
    primaryFg: '#FFFFFF',
    accent: COLORS.amber600,
    premium: COLORS.amber400,
    background: COLORS.zinc50,
    surface: '#FFFFFF',
    border: COLORS.zinc200,
    text: COLORS.zinc950,
    textMuted: COLORS.zinc500,
    sidebar: COLORS.zinc900,
    sidebarFg: COLORS.zinc400,
    success: COLORS.success,
    warning: COLORS.warning,
    danger: COLORS.danger,
  },
} as const;

export const THEME_DARK = {
  colors: {
    primary: COLORS.violet400,
    primaryFg: COLORS.zinc950,
    accent: COLORS.amber400,
    premium: COLORS.amber400,
    background: COLORS.zinc950,
    surface: COLORS.zinc900,
    border: COLORS.zinc800,
    text: COLORS.zinc50,
    textMuted: COLORS.zinc400,
    sidebar: COLORS.zinc950,
    sidebarFg: COLORS.zinc400,
    success: COLORS.success,
    warning: COLORS.warning,
    danger: COLORS.danger,
  },
} as const;

export type AppTheme = typeof THEME_LIGHT;
