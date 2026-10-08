import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { RequestCard } from '@/components/RequestCard';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useUserId } from '@/lib/auth';
import { confirm } from '@/lib/dialogs';
import { useFollow, useFollowState, useProfile, useRemoveFollow } from '@/lib/queries/people';
import { usePrayedTogether, useRequestsByAuthor } from '@/lib/queries/requests';
import { timeAgo } from '@/lib/time';
import { hitSize, space, useAppTheme } from '@/theme';

export default function PersonProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const { colors } = useAppTheme();
  const profile = useProfile(id);
  const state = useFollowState(userId, id);
  const requests = useRequestsByAuthor(id);
  const together = usePrayedTogether(id);
  const follow = useFollow();
  const unfollow = useRemoveFollow();

  if (id === userId) return <Redirect href="/profile" />;
  if (profile.isPending) return <Screen>{null}</Screen>;
  if (!profile.data) {
    return (
      <Screen>
        <EmptyState title="Not available" body="This person can't be found." />
      </Screen>
    );
  }

  const person = profile.data;
  const outgoing = state.data?.outgoing ?? 'none';
  const firstName = person.display_name.split(' ')[0] || 'them';

  async function onFollowPress() {
    if (outgoing === 'none') {
      follow.mutate(id);
      return;
    }
    const pending = outgoing === 'pending';
    const ok = await confirm(
      pending ? 'Cancel follow request?' : `Unfollow ${person.display_name}?`,
      undefined,
      pending ? 'Cancel request' : 'Unfollow',
      { destructive: true, cancelLabel: 'Keep' },
    );
    if (ok) unfollow.mutate({ followerId: userId, followeeId: id });
  }

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.header}>
        <Avatar name={person.display_name} url={person.avatar_url} size={72} />
        <View style={styles.flex}>
          <Text variant="heading">{person.display_name}</Text>
          {person.handle ? <Text tone="muted">@{person.handle}</Text> : null}
          {state.data?.followsMe ? (
            <Text variant="caption" tone="muted">
              Follows you
            </Text>
          ) : null}
        </View>
      </View>
      {person.bio ? <Text>{person.bio}</Text> : null}
      <Button
        label={outgoing === 'none' ? 'Follow' : outgoing === 'pending' ? 'Requested' : 'Following'}
        variant={outgoing === 'none' ? 'primary' : 'secondary'}
        onPress={onFollowPress}
        loading={follow.isPending || unfollow.isPending}
      />
      {outgoing === 'pending' ? (
        <Text variant="caption" tone="muted">
          {firstName} will see your request and can accept it.
        </Text>
      ) : null}

      {together.data?.length ? (
        <View style={[styles.together, { borderColor: colors.border }]}>
          <Text variant="heading">What you’ve prayed through together</Text>
          {together.data.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push({ pathname: '/request/[id]', params: { id: r.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${r.status === 'answered' ? 'Answered: ' : ''}${r.body}`}
              style={styles.togetherRow}
            >
              <Ionicons
                name={r.status === 'answered' ? 'sunny' : 'ellipse-outline'}
                size={16}
                color={r.status === 'answered' ? colors.answered : colors.textMuted}
              />
              <Text numberOfLines={2} style={styles.flex}>
                {r.body}
              </Text>
              <Text variant="caption" tone="muted">
                {timeAgo(r.created_at)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text variant="heading" style={styles.sectionTitle}>
        Requests
      </Text>
      {requests.data?.length ? (
        requests.data.map((card) => <RequestCard key={card.id} card={card} />)
      ) : (
        <EmptyState
          title="Nothing to show"
          body={
            outgoing === 'following'
              ? `${firstName} hasn't shared anything with you yet.`
              : `When ${firstName} accepts your follow, requests they share with followers appear here.`
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingTop: space.lg },
  flex: { flex: 1 },
  sectionTitle: { paddingTop: space.lg },
  together: { gap: space.sm, paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth },
  togetherRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: hitSize },
});
