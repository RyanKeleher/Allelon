import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { hitSize, radius, space, useAppTheme } from '@/theme';

import { Text } from './Text';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ label, variant = 'primary', loading, disabled, style, ...props }: Props) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;
  const bg = variant === 'primary' ? colors.accent : variant === 'secondary' ? colors.surfaceRaised : 'transparent';
  const fg = variant === 'primary' ? colors.accentText : colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1 },
        variant === 'secondary' && { borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text variant="label" style={{ color: fg }}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: hitSize + 4,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
