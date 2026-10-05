import { FlatList, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PersonRow } from '@/components/PersonRow';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useUserId } from '@/lib/auth';
import { useAcceptFollow, useFollowRequests, useRemoveFollow } from '@/lib/queries/people';
import { space } from '@/theme';

export default function FollowRequests() {
  const userId = useUserId();
  const requests = useFollowRequests(userId);
  const accept = useAcceptFollow(userId);
  const decline = useRemoveFollow();

  return (
    <Screen padded={false} edges={['bottom']}>
      <FlatList
        data={requests.data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text tone="muted" style={styles.intro}>
            People you accept will see the requests you share with all followers.
          </Text>
        }
        renderItem={({ item }) => (
          <PersonRow
            person={item}
            trailing={
              <>
                <Button label="Accept" onPress={() => accept.mutate(item.id)} />
                <Button
                  label="Decline"
                  variant="ghost"
                  onPress={() => decline.mutate({ followerId: item.id, followeeId: userId })}
                />
              </>
            }
          />
        )}
        ListEmptyComponent={requests.isPending ? null : <EmptyState title="No requests waiting" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.xl },
  intro: { paddingBottom: space.lg },
});
