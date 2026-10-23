// Design tokens: modern slate canvas, rich indigo primary, warm amber accent, native elevation & crisp borders.
export const colors = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primarySoft: '#EEF2FF',
  accent: '#F59E0B',
  accentSoft: '#FEF3C7',
  accentDark: '#D97706',
  success: '#10B981',
  successSoft: '#D1FAE5',
  successDark: '#047857',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  dangerDark: '#B91C1C',
  info: '#0EA5E9',
  infoSoft: '#E0F2FE',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  overlay: 'rgba(15, 23, 42, 0.55)',
  white: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { card: 18, button: 14, input: 14, chip: 999, sheet: 24 } as const;

export const shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 5,
  },
  glowPrimary: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  glowAccent: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Minimum tap target from the brief */
export const TAP = 48;
export const GUTTER = 16;
