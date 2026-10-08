import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { Text } from './Text';

export function GroupAvatar({ icon, size = 56 }: { icon: string; size?: number }) {
  const { colors } = useAppTheme();
  return (
    <View
      accessible={false}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSoft, borderColor: colors.accent },
      ]}
    >
      <Text allowFontScaling={false} style={{ fontSize: size * 0.45, lineHeight: size * 0.6 }}>
        {icon}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});
