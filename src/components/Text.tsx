import { Text as RNText, type TextProps } from 'react-native';

import { fonts, useAppTheme } from '@/theme';

type Variant = 'title' | 'heading' | 'prayer' | 'body' | 'label' | 'caption';
type Tone = 'default' | 'muted' | 'accent' | 'answered' | 'private' | 'danger';

// Sizes are base sizes: they scale with the system text size (dynamic type).
const variants = {
  title: { fontFamily: fonts.serifBold, fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 28 },
  prayer: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 28 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.sansBold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
} as const;

export function Text({
  variant = 'body',
  tone = 'default',
  style,
  ...props
}: TextProps & { variant?: Variant; tone?: Tone }) {
  const { colors } = useAppTheme();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    accent: colors.accent,
    answered: colors.answered,
    private: colors.private,
    danger: colors.danger,
  }[tone];
  return (
    <RNText
      maxFontSizeMultiplier={2}
      accessibilityRole={variant === 'title' || variant === 'heading' ? 'header' : undefined}
      {...props}
      style={[variants[variant], { color }, style]}
    />
  );
}
