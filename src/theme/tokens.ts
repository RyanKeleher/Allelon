// Calm, warm, personal: a letter between friends. Colors carry over from the
// prototype's evening palette (dark) with a paper-and-ink light theme.
// Text/background pairs are chosen to meet WCAG AA (4.5:1) for body text.

export type Palette = {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string; // gold: primary actions, "I prayed"
  accentText: string; // text placed on accent backgrounds
  accentSoft: string;
  close: string; // close friends
  answered: string; // sage
  private: string; // lavender: private responses
  danger: string;
};

export const light: Palette = {
  background: '#FAF6EF',
  surface: '#FFFDF9',
  surfaceRaised: '#F3ECE0',
  border: '#E4DACB',
  text: '#2A2622',
  textMuted: '#675E54',
  accent: '#8A6516',
  accentText: '#FFFDF9',
  accentSoft: '#F1E4C6',
  close: '#8A6516',
  answered: '#3F6E4B',
  private: '#5E5296',
  danger: '#A63A2E',
};

export const dark: Palette = {
  background: '#0B1825',
  surface: '#0F2030',
  surfaceRaised: '#15293C',
  border: '#22384C',
  text: '#E9E4DB',
  textMuted: '#A3B2C1',
  accent: '#D8B65C',
  accentText: '#0B1825',
  accentSoft: '#3A3320',
  close: '#E6C97A',
  answered: '#8CC29A',
  private: '#B3A8E0',
  danger: '#F08A7E',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

// Minimum touch target (iOS HIG 44pt, Material 48dp).
export const hitSize = 44;

export const fonts = {
  serif: 'CormorantGaramond_500Medium',
  serifBold: 'CormorantGaramond_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansBold: 'Inter_600SemiBold',
} as const;
