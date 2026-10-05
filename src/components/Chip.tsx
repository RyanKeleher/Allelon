import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { hitSize, radius, space, useAppTheme } from '@/theme';

import { Text } from './Text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  color?: string;
  accessibilityHint?: string;
};

/** Toggleable pill. Uses checkbox semantics so screen readers announce state. */
export function Chip({ label, selected, onPress, icon, color, accessibilityHint }: Props) {
  const { colors } = useAppTheme();
  const tint = color ?? colors.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? tint : colors.border,
          backgroundColor: selected ? colors.accentSoft : 'transparent',
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text variant="label" style={{ color: selected ? tint : colors.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: hitSize - 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  icon: { marginRight: space.xs },
});
