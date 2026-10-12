import { FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useMyProfile } from '@/lib/auth';
import { errorMessage, notify } from '@/lib/dialogs';
import { REPORT_REASONS, useModerationQueue, useResolveReport } from '@/lib/queries/safety';
import { radius, space, useAppTheme } from '@/theme';

/** Report queue for moderators: hide content or dismiss the reports. */
export default function Moderation() {
  const { colors } = useAppTheme();
  const { data: me } = useMyProfile();
  const queue = useModerationQueue(Boolean(me?.is_moderator));
  const resolve = useResolveReport();

  if (!me?.is_moderator) {
    return (
      <Screen>
        <EmptyState title="Moderators only" />
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['bottom']}>
      <FlatList
        data={queue.data ?? []}
        keyExtractor={(q) => `${q.target_type}:${q.target_id}`}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: space.lg }} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="caption" tone="muted">
              {item.target_type.toUpperCase()} · {REPORT_REASONS.find((r) => r.key === item.reason)?.label ?? item.reason} ·{' '}
              {item.report_count} {item.report_count === 1 ? 'report' : 'reports'}
            </Text>
            <Text variant="prayer">{item.content ?? '(content no longer exists)'}</Text>
            {item.details ? <Text tone="muted">“{item.details}”</Text> : null}
            <View style={styles.row}>
              <Button
                label={item.target_type === 'profile' ? 'Hide their World posts' : 'Hide'}
                onPress={() =>
                  resolve.mutate(
                    { targetType: item.target_type, targetId: item.target_id, action: 'hide' },
                    { onError: (e) => notify('Could not update', errorMessage(e)) },
                  )
                }
              />
              <Button
                label="Dismiss"
                variant="ghost"
                onPress={() => resolve.mutate({ targetType: item.target_type, targetId: item.target_id, action: 'dismiss' })}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={queue.isPending ? null : <EmptyState title="No open reports" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.xl },
  card: { padding: space.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
});
