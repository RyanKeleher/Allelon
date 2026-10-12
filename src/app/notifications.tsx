import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import {
  describeNotification,
  useMarkNotificationsRead,
  useNotifications,
  type AppNotification,
} from '@/lib/queries/notifications';
import { timeAgo } from '@/lib/time';
import { hitSize, space, useAppTheme } from '@/theme';

const ICONS: Record<AppNotification['kind'], keyof typeof Ionicons.glyphMap> = {
  answered: 'sunny-outline',
  response: 'chatbubble-outline',
  checkin: 'heart-outline',
  follow_request: 'person-add-outline',
  join_request: 'people-outline',
};

function open(n: AppNotification) {
  if (n.request_id) router.push({ pathname: '/request/[id]', params: { id: n.request_id } });
  else if (n.kind === 'follow_request') router.push('/follow-requests');
  else if (n.group_id) router.push({ pathname: '/group/[id]/members', params: { id: n.group_id } });
}

export default function Notifications() {
  const { colors } = useAppTheme();
  const notes = useNotifications();
  const markRead = useMarkNotificationsRead();

  // Opening the inbox marks everything as seen.
  useFocusEffect(
    useCallback(() => {
      return () => markRead.mutate(undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <Screen padded={false} edges={['bottom']}>
      <FlatList
        data={notes.data ?? []}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.read_at ? '' : 'New. '}${describeNotification(item)}`}
            style={[styles.row, { borderColor: colors.border }]}
          >
            {item.actor ? (
              <Avatar name={item.actor.display_name} url={item.actor.avatar_url} size={40} />
            ) : (
              <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name={ICONS[item.kind]} size={20} color={colors.accent} />
              </View>
            )}
            <View style={styles.flex}>
              <Text>{describeNotification(item)}</Text>
              <Text variant="caption" tone="muted">
                {timeAgo(item.created_at)}
              </Text>
            </View>
            {item.read_at ? null : <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
          </Pressable>
        )}
        ListEmptyComponent={
          notes.isPending ? null : (
            <EmptyState title="All quiet" body="When someone responds, asks to follow you, or shares that a prayer was answered, you’ll see it here." />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: hitSize + 20, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  flex: { flex: 1, gap: 2 },
});
