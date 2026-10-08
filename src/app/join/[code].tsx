import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { GroupAvatar } from '@/components/GroupAvatar';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { errorMessage, notify } from '@/lib/dialogs';
import { useCancelJoinRequest, useInvitePreview, useRequestToJoin } from '@/lib/queries/groups';
import { space } from '@/theme';

/** Opened from an invite link (allelon://join/CODE) or a typed code. */
export default function JoinGroup() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const preview = useInvitePreview(code ?? '');
  const join = useRequestToJoin();
  const cancel = useCancelJoinRequest();

  if (preview.isPending) return <Screen>{null}</Screen>;
  const g = preview.data;
  if (!g) {
    return (
      <Screen>
        <EmptyState
          title="Invite not found"
          body="This code isn't valid anymore. Ask the group's admin for a new invite."
        />
      </Screen>
    );
  }

  async function ask() {
    try {
      await join.mutateAsync(code);
      preview.refetch();
    } catch (e) {
      notify('Could not send your request', errorMessage(e));
    }
  }

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.hero}>
        <GroupAvatar icon={g.icon} size={88} />
        <Text variant="title" style={styles.center}>
          {g.name}
        </Text>
        {g.description ? (
          <Text tone="muted" style={styles.center}>
            {g.description}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted">
          {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
        </Text>
      </View>

      {g.is_member ? (
        <Button
          label="Open group"
          onPress={() => router.replace({ pathname: '/group/[id]', params: { id: g.group_id } })}
        />
      ) : g.has_pending_request ? (
        <View style={styles.pending}>
          <Text style={styles.center}>Your request has been sent. You’ll see the group once an admin approves you.</Text>
          <Button
            label="Cancel request"
            variant="ghost"
            onPress={() => cancel.mutate(g.group_id, { onSuccess: () => preview.refetch() })}
          />
        </View>
      ) : (
        <View style={styles.pending}>
          <Text tone="muted" style={styles.center}>
            The group’s admin approves each new member before they can see the prayer list.
          </Text>
          <Button label="Ask to join" onPress={ask} loading={join.isPending} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  center: { textAlign: 'center' },
  pending: { gap: space.md },
});
