import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { GroupAvatar } from '@/components/GroupAvatar';
import { RequestCard } from '@/components/RequestCard';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useUserId } from '@/lib/auth';
import { errorMessage, notify } from '@/lib/dialogs';
import {
  useGroup,
  useGroupFeed,
  useGroupMembers,
  useGroupRealtime,
  useJoinRequests,
} from '@/lib/queries/groups';
import { useCreateRequest } from '@/lib/queries/requests';
import { hitSize, radius, space, useAppTheme } from '@/theme';

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const { colors } = useAppTheme();
  const group = useGroup(id);
  const members = useGroupMembers(id);
  const feed = useGroupFeed(id);
  const requests = useJoinRequests();
  const create = useCreateRequest();
  const [body, setBody] = useState('');
  const [view, setView] = useState<'open' | 'answered'>('open');

  const isAdmin = members.data?.some((m) => m.user_id === userId && m.role === 'admin') ?? false;
  const waiting = (requests.data ?? []).filter((r) => r.group_id === id && r.user_id !== userId).length;
  useGroupRealtime(id, isAdmin);

  if (group.isPending) return <Screen>{null}</Screen>;
  if (!group.data) {
    return (
      <Screen>
        <EmptyState title="Not available" body="You're not a member of this group, or it no longer exists." />
      </Screen>
    );
  }
  const g = group.data;
  const allCards = feed.data?.pages.flat() ?? [];
  const cards = allCards.filter((c) => (view === 'answered' ? c.status === 'answered' : c.status !== 'answered'));

  async function add() {
    try {
      await create.mutateAsync({ body: body.trim(), kind: 'request', audiences: [], groupIds: [id] });
      setBody('');
      feed.refetch();
    } catch (e) {
      notify('Could not share', errorMessage(e));
    }
  }

  const openMembers = () => router.push({ pathname: '/group/[id]/members', params: { id } });

  return (
    <Screen padded={false} edges={['bottom']}>
      <Stack.Screen options={{ title: g.name }} />
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <RequestCard card={item} />}
        ItemSeparatorComponent={() => <View style={{ height: space.lg }} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <GroupAvatar icon={g.icon} size={64} />
              <View style={styles.flex}>
                <Text variant="heading">{g.name}</Text>
                {g.description ? <Text tone="muted">{g.description}</Text> : null}
              </View>
            </View>

            <Pressable
              onPress={openMembers}
              accessibilityRole="button"
              accessibilityLabel={
                waiting ? `Members and invites, ${waiting} waiting to join` : 'Members and invites'
              }
              style={[styles.membersLink, { borderColor: colors.border }]}
            >
              <Ionicons name="people-outline" size={20} color={colors.textMuted} />
              <Text style={styles.flex}>
                {members.data?.length ?? '…'} {members.data?.length === 1 ? 'member' : 'members'}
                {isAdmin ? ' · Invite' : ''}
              </Text>
              {waiting ? (
                <Text variant="label" tone="accent">
                  {waiting} waiting
                </Text>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextField
                label="Add to the prayer list"
                value={body}
                onChangeText={setBody}
                multiline
                serif
                maxLength={4000}
                placeholder="Only this group will see it"
                style={styles.composerInput}
              />
              <Button label="Share with the group" onPress={add} loading={create.isPending} disabled={!body.trim()} />
            </View>

            <View style={styles.viewRow}>
              <Chip label="Prayer list" selected={view === 'open'} onPress={() => setView('open')} />
              <Chip label="Answered" selected={view === 'answered'} onPress={() => setView('answered')} />
            </View>
          </View>
        }
        ListEmptyComponent={
          feed.isPending ? null : view === 'answered' ? (
            <EmptyState title="No answered prayers yet" body="When someone marks a request answered, it’s remembered here." />
          ) : (
            <EmptyState title="Nothing here yet" body="Be the first to share what's on your heart." />
          )
        }
        ListFooterComponent={
          feed.hasNextPage ? (
            <Button
              label="Show earlier requests"
              variant="secondary"
              onPress={() => feed.fetchNextPage()}
              loading={feed.isFetchingNextPage}
              style={styles.footer}
            />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: space.lg, paddingBottom: space.xxl },
  header: { gap: space.lg, paddingBottom: space.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingTop: space.sm },
  membersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: hitSize + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  composer: { padding: space.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: space.md },
  composerInput: { minHeight: 90 },
  footer: { marginTop: space.xl },
  viewRow: { flexDirection: 'row', gap: space.sm },
});
