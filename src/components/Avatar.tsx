import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { fonts, useAppTheme } from '@/theme';

import { Text } from './Text';

function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({ name, url, size = 40 }: { name?: string | null; url?: string | null; size?: number }) {
  const { colors } = useAppTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (url) {
    return <Image source={{ uri: url }} style={shape} accessibilityIgnoresInvertColors accessible={false} />;
  }
  return (
    <View
      accessible={false}
      style={[styles.fallback, shape, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
    >
      <Text
        allowFontScaling={false}
        style={{ fontFamily: fonts.sansBold, fontSize: size * 0.36, color: colors.accent }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});
