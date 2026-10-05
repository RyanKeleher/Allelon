import { StyleSheet, View } from 'react-native';

import { space } from '@/theme';

import { Text } from './Text';

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.wrap}>
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      {body ? (
        <Text tone="muted" style={styles.center}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: space.xxl * 2, paddingHorizontal: space.xl, gap: space.sm, alignItems: 'center' },
  center: { textAlign: 'center' },
});
