import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { useMyProfile } from '@/lib/auth';
import { crisisLines } from '@/lib/crisis';
import { hitSize, radius, space, useAppTheme } from '@/theme';

import { Text } from './Text';

/**
 * Shown when a request or response mentions suicide or self-harm. Gentle,
 * private to whoever is looking at it, and never posts or alerts anyone.
 */
export function CrisisCard({ forAuthor }: { forAuthor: boolean }) {
  const { colors } = useAppTheme();
  const { data: me } = useMyProfile();
  const lines = crisisLines(me?.country_code);

  return (
    <View
      accessibilityRole="summary"
      style={[styles.card, { backgroundColor: colors.surfaceRaised, borderColor: colors.private }]}
    >
      <View style={styles.header}>
        <Ionicons name="heart-circle-outline" size={22} color={colors.private} />
        <Text variant="label" style={styles.flex}>
          {forAuthor ? 'You don’t have to carry this alone' : 'If someone may be in danger'}
        </Text>
      </View>
      <Text tone="muted">
        {forAuthor
          ? 'If you are thinking about ending your life or hurting yourself, please talk to someone now. These lines are free and confidential.'
          : 'Keep praying, and reach out to them directly. If you think they are in immediate danger, contact local emergency services. These lines can help too.'}
      </Text>
      {lines.map((l) => (
        <Pressable
          key={l.url}
          onPress={() => Linking.openURL(l.url)}
          accessibilityRole="link"
          accessibilityLabel={`${l.label}. ${l.detail}`}
          style={[styles.line, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Ionicons name={l.url.startsWith('tel:') ? 'call-outline' : 'globe-outline'} size={18} color={colors.private} />
          <View style={styles.flex}>
            <Text variant="label">{l.label}</Text>
            <Text variant="caption" tone="muted">
              {l.detail}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, borderRadius: radius.lg, borderWidth: 1, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: hitSize + 8,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
