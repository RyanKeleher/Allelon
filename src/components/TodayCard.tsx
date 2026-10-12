import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { quoted, useGrowItems, verseOfTheDay } from '@/lib/queries/grow';
import { useNotifications } from '@/lib/queries/notifications';
import { hitSize, radius, space, useAppTheme } from '@/theme';

import { Text } from './Text';

/** Top of Home: today's verse and up to three gentle check-ins. */
export function TodayCard() {
  const { colors } = useAppTheme();
  const { data: grow } = useGrowItems();
  const { data: notes } = useNotifications();
  const verse = verseOfTheDay(grow);
  const checkins = (notes ?? []).filter((n) => n.kind === 'checkin' && !n.read_at).slice(0, 3);

  if (!verse && !checkins.length) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text variant="caption" tone="accent" style={styles.kicker}>
        TODAY
      </Text>
      {verse ? (
        <Pressable onPress={() => router.push('/grow')} accessibilityRole="button" accessibilityHint="Opens Grow">
          <Text variant="prayer">{quoted(verse.body)}</Text>
          <Text variant="caption" tone="muted" style={styles.ref}>
            {verse.reference}
          </Text>
        </Pressable>
      ) : null}
      {checkins.map((n) => (
        <Pressable
          key={n.id}
          onPress={() => n.request_id && router.push({ pathname: '/request/[id]', params: { id: n.request_id } })}
          accessibilityRole="button"
          style={[styles.checkin, { borderColor: colors.border }]}
        >
          <Text style={styles.flex}>
            {n.actor ? `Check in with ${n.actor.display_name.split(' ')[0]}?` : 'Pray again for a request from a few days ago?'}
          </Text>
          <Text variant="label" tone="accent">
            Open
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, gap: space.md, marginBottom: space.xl },
  kicker: { letterSpacing: 1.5 },
  ref: { marginTop: space.xs },
  checkin: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: hitSize, borderTopWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1 },
});
