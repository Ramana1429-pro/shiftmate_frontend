// Design tokens from the Figma brief: indigo primary, amber accent, Inter, 16px cards, 12px buttons.
export const colors = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primarySoft: '#EEF2FF',
  accent: '#F59E0B',
  accentSoft: '#FEF3C7',
  accentDark: '#B45309',
  success: '#10B981',
  successSoft: '#D1FAE5',
  successDark: '#047857',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  dangerDark: '#B91C1C',
  info: '#0EA5E9',
  infoSoft: '#E0F2FE',
  bg: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  text: '#111827',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  overlay: 'rgba(17,24,39,0.5)',
  white: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { card: 16, button: 12, input: 12, chip: 999, sheet: 24 } as const;

export const shadow = {
  card: { boxShadow: '0 2px 10px rgba(17,24,39,0.06)' },
  raised: { boxShadow: '0 6px 20px rgba(17,24,39,0.12)' },
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
