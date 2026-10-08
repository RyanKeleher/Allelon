import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { PersonRow } from '@/components/PersonRow';
import { Screen } from '@/components/Screen';
import { useUserId } from '@/lib/auth';
import { confirm } from '@/lib/dialogs';
import { useFollowers, useFollowing, useRemoveFollow, type PersonSummary } from '@/lib/queries/people';
import { space } from '@/theme';

export default function Connections() {
  const userId = useUserId();
  const [tab, setTab] = useState<'followers' | 'following'>('followers');
  const followers = useFollowers(userId);
  const following = useFollowing(userId);
  const remove = useRemoveFollow();

  async function confirmRemoval(person: PersonSummary, action: 'remove' | 'unfollow') {
    const ok = await confirm(
      action === 'remove' ? `Remove ${person.display_name}?` : `Unfollow ${person.display_name}?`,
      action === 'remove'
        ? "They won't be told, and they will stop seeing requests you share with followers."
        : undefined,
      action === 'remove' ? 'Remove' : 'Unfollow',
      { destructive: true },
    );
    if (!ok) return;
    remove.mutate(
      action === 'remove'
        ? { followerId: person.id, followeeId: userId }
        : { followerId: userId, followeeId: person.id },
    );
  }

  const data = tab === 'followers' ? (followers.data ?? []) : (following.data ?? []);

  return (
    <Screen padded={false} edges={['bottom']}>
      <View style={styles.tabs}>
        <Chip label="Followers" selected={tab === 'followers'} onPress={() => setTab('followers')} />
        <Chip label="Following" selected={tab === 'following'} onPress={() => setTab('following')} />
      </View>
      <FlatList
        data={data as (PersonSummary & { pending?: boolean })[]}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PersonRow
            person={item}
            trailing={
              <Button
                label={tab === 'followers' ? 'Remove' : item.pending ? 'Cancel request' : 'Unfollow'}
                variant="ghost"
                onPress={() => confirmRemoval(item, tab === 'followers' ? 'remove' : 'unfollow')}
              />
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState title={tab === 'followers' ? 'No followers yet' : "You're not following anyone yet"} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: space.sm, padding: space.xl, paddingBottom: space.md },
  list: { paddingHorizontal: space.xl },
});
