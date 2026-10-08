import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { GroupsRow } from '@/components/GroupsRow';
import { RequestCard } from '@/components/RequestCard';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useUserId } from '@/lib/auth';
import { useFollowRequests } from '@/lib/queries/people';
import { useHomeFeed } from '@/lib/queries/requests';
import { hitSize, space, useAppTheme } from '@/theme';

export default function Home() {
  const userId = useUserId();
  const { colors } = useAppTheme();
  const feed = useHomeFeed();
  const requests = useFollowRequests(userId);
  const cards = feed.data?.pages.flat() ?? [];
  const pending = requests.data?.length ?? 0;

  return (
    <Screen padded={false}>
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <RequestCard card={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: space.lg }} />}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching}
            onRefresh={() => {
              feed.refetch();
              requests.refetch();
            }}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View>
          <View style={styles.header}>
            <Text variant="title">Allelon</Text>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push('/people')}
                accessibilityRole="button"
                accessibilityLabel="Find people"
                style={styles.iconButton}
              >
                <Ionicons name="person-add-outline" size={22} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/follow-requests')}
                accessibilityRole="button"
                accessibilityLabel={pending ? `Follow requests, ${pending} waiting` : 'Follow requests'}
                style={styles.iconButton}
              >
                <Ionicons name="mail-outline" size={22} color={colors.text} />
                {pending ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
              </Pressable>
            </View>
          </View>
          <GroupsRow />
          </View>
        }
        ListEmptyComponent={
          feed.isPending ? null : feed.isError ? (
            <EmptyState title="Couldn't load your feed" body="Pull down to try again." />
          ) : (
            <View>
              <EmptyState
                title="Quiet for now"
                body="Follow the people you love so you can carry each other's requests in prayer."
              />
              <Button label="Find people" onPress={() => router.push('/people')} />
            </View>
          )
        }
        ListFooterComponent={
          cards.length === 0 ? null : feed.hasNextPage ? (
            <Button
              label="Show earlier requests"
              variant="secondary"
              onPress={() => feed.fetchNextPage()}
              loading={feed.isFetchingNextPage}
              style={styles.footer}
            />
          ) : (
            <Text tone="muted" style={[styles.footer, styles.caughtUp]}>
              {"You're all caught up."}
            </Text>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.lg,
    paddingBottom: space.xl,
    paddingHorizontal: space.sm,
  },
  headerActions: { flexDirection: 'row' },
  iconButton: { width: hitSize, height: hitSize, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  footer: { marginTop: space.xl },
  caughtUp: { textAlign: 'center' },
});
