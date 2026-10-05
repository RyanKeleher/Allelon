import { Redirect, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { RequestCard } from '@/components/RequestCard';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useUserId } from '@/lib/auth';
import { useFollow, useFollowState, useProfile, useRemoveFollow } from '@/lib/queries/people';
import { useRequestsByAuthor } from '@/lib/queries/requests';
import { space } from '@/theme';

export default function PersonProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const profile = useProfile(id);
  const state = useFollowState(userId, id);
  const requests = useRequestsByAuthor(id);
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

  function onFollowPress() {
    if (outgoing === 'none') {
      follow.mutate(id);
      return;
    }
    const title = outgoing === 'pending' ? 'Cancel follow request?' : `Unfollow ${person.display_name}?`;
    Alert.alert(title, undefined, [
      { text: 'Keep', style: 'cancel' },
      {
        text: outgoing === 'pending' ? 'Cancel request' : 'Unfollow',
        style: 'destructive',
        onPress: () => unfollow.mutate({ followerId: userId, followeeId: id }),
      },
    ]);
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
});
