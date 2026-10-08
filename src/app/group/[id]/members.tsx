import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { PersonRow } from '@/components/PersonRow';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useUserId } from '@/lib/auth';
import { choose, confirm, errorMessage, notify } from '@/lib/dialogs';
import {
  useGroup,
  useGroupMembers,
  useInviteCode,
  useJoinRequests,
  useLeaveGroup,
  useRemoveMember,
  useResetInviteCode,
  useRespondToJoinRequest,
  useSetMemberRole,
  type GroupMember,
} from '@/lib/queries/groups';
import { radius, space, useAppTheme } from '@/theme';

export default function GroupMembers() {
  const { id, invite } = useLocalSearchParams<{ id: string; invite?: string }>();
  const userId = useUserId();
  const { colors } = useAppTheme();
  const group = useGroup(id);
  const members = useGroupMembers(id);
  const isAdmin = members.data?.some((m) => m.user_id === userId && m.role === 'admin') ?? false;
  const code = useInviteCode(id, isAdmin);
  const reset = useResetInviteCode(id);
  const requests = useJoinRequests();
  const respond = useRespondToJoinRequest();
  const remove = useRemoveMember(id);
  const setRole = useSetMemberRole(id);
  const leave = useLeaveGroup();

  const waiting = (requests.data ?? []).filter((r) => r.group_id === id && r.user_id !== userId);
  const name = group.data?.name ?? 'this group';

  async function shareInvite() {
    if (!code.data) return;
    const link = Linking.createURL(`join/${code.data}`);
    await Share.share({
      message: `Join "${name}" on Allelon so we can pray for each other.\n\nOpen ${link}\nor enter the code ${code.data} in the Groups tab.`,
    });
  }

  async function resetCode() {
    const ok = await confirm(
      'Make a new invite code?',
      'The old code and link will stop working. People already in the group are not affected.',
      'New code',
    );
    if (ok) reset.mutate();
  }

  async function manage(m: GroupMember) {
    const action = await choose(m.person.display_name, undefined, [
      m.role === 'member'
        ? { key: 'promote' as const, label: 'Make admin' }
        : { key: 'demote' as const, label: 'Remove as admin' },
      { key: 'remove' as const, label: 'Remove from group', destructive: true },
    ]);
    const onError = (e: unknown) => notify('Could not update', errorMessage(e));
    if (action === 'promote') setRole.mutate({ userId: m.user_id, role: 'admin' }, { onError });
    if (action === 'demote') setRole.mutate({ userId: m.user_id, role: 'member' }, { onError });
    if (
      action === 'remove' &&
      (await confirm(
        `Remove ${m.person.display_name}?`,
        "They'll lose access to this group's prayer list right away.",
        'Remove',
        { destructive: true },
      ))
    ) {
      remove.mutate(m.user_id, { onError });
    }
  }

  async function leaveGroup() {
    const ok = await confirm(
      `Leave ${name}?`,
      "You'll stop seeing this group's prayer list. You can ask to join again with an invite.",
      'Leave',
      { destructive: true },
    );
    if (!ok) return;
    try {
      await leave.mutateAsync(id);
      router.dismissTo('/groups');
    } catch (e) {
      notify('Could not leave', errorMessage(e));
    }
  }

  return (
    <Screen scroll edges={['bottom']}>
      {isAdmin ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text variant="heading">{invite === '1' ? 'Invite your people' : 'Invite'}</Text>
          <Text tone="muted">
            Share this code or link. Anyone who uses it asks to join, and you approve them here.
          </Text>
          <Text
            variant="title"
            selectable
            accessibilityLabel={code.data ? `Invite code ${code.data.split('').join(' ')}` : 'Loading invite code'}
            style={styles.code}
          >
            {code.data ?? '…'}
          </Text>
          <Button label="Share invite" onPress={shareInvite} disabled={!code.data} />
          <Button label="Make a new code" variant="ghost" onPress={resetCode} loading={reset.isPending} />
        </View>
      ) : null}

      {isAdmin && waiting.length ? (
        <View style={styles.section}>
          <Text variant="heading">Waiting to join</Text>
          {waiting.map((r) => (
            <PersonRow
              key={r.user_id}
              person={r.person}
              trailing={
                <>
                  <Button
                    label="Approve"
                    onPress={() => respond.mutate({ groupId: id, userId: r.user_id, approve: true })}
                  />
                  <Button
                    label="Decline"
                    variant="ghost"
                    onPress={() => respond.mutate({ groupId: id, userId: r.user_id, approve: false })}
                  />
                </>
              }
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="heading">Members</Text>
        {(members.data ?? []).map((m) => (
          <PersonRow
            key={m.user_id}
            person={m.person}
            trailing={
              <>
                {m.role === 'admin' ? (
                  <Text variant="caption" tone="accent">
                    Admin
                  </Text>
                ) : null}
                {isAdmin && m.user_id !== userId ? (
                  <Button label="Manage" variant="ghost" onPress={() => manage(m)} />
                ) : null}
              </>
            }
          />
        ))}
      </View>

      <Button label="Leave group" variant="ghost" onPress={leaveGroup} loading={leave.isPending} style={styles.leave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: space.md, marginTop: space.lg },
  code: { textAlign: 'center', letterSpacing: 4, paddingVertical: space.sm },
  section: { gap: space.sm, paddingTop: space.lg },
  leave: { marginTop: space.xl },
});
