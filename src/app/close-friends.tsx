import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, StyleSheet, Switch, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { PersonRow } from '@/components/PersonRow';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useUserId } from '@/lib/auth';
import { errorMessage, notify } from '@/lib/dialogs';
import { useCloseFriends, useFollowers, useSetCloseFriend } from '@/lib/queries/people';
import { space, useAppTheme } from '@/theme';

export default function CloseFriends() {
  const userId = useUserId();
  const { colors } = useAppTheme();
  const followers = useFollowers(userId);
  const closeFriends = useCloseFriends();
  const setCloseFriend = useSetCloseFriend();
  const selected = new Set(closeFriends.data ?? []);

  return (
    <Screen padded={false} edges={['bottom']}>
      <FlatList
        data={followers.data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Ionicons name="lock-closed" size={20} color={colors.close} />
            <Text tone="muted" style={styles.flex}>
              Requests you share with Close friends are seen only by the people you turn on here. This list is
              private; nobody else can see who is on it, including the people on it.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const on = selected.has(item.id);
          return (
            <PersonRow
              person={item}
              trailing={
                <Switch
                  value={on}
                  onValueChange={(v) =>
                    setCloseFriend.mutate(
                      { friendId: item.id, on: v },
                      { onError: (e) => notify('Could not update', errorMessage(e)) },
                    )
                  }
                  trackColor={{ true: colors.close }}
                  accessibilityLabel={`${item.display_name} is ${on ? 'a close friend' : 'not a close friend'}`}
                />
              }
            />
          );
        }}
        ListEmptyComponent={
          followers.isPending ? null : (
            <EmptyState
              title="No followers yet"
              body="Close friends are chosen from people who follow you. Once someone's follow request is accepted, they'll appear here."
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.xl },
  intro: { flexDirection: 'row', gap: space.md, paddingBottom: space.lg },
  flex: { flex: 1 },
});
