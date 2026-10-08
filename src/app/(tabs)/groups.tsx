import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { GroupAvatar } from '@/components/GroupAvatar';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useUserId } from '@/lib/auth';
import { useJoinRequests, useMyGroups } from '@/lib/queries/groups';
import { hitSize, radius, space, useAppTheme } from '@/theme';

export default function GroupsTab() {
  const userId = useUserId();
  const { colors } = useAppTheme();
  const groups = useMyGroups();
  const requests = useJoinRequests();
  const [code, setCode] = useState('');

  const waitingByGroup = new Map<string, number>();
  for (const r of requests.data ?? []) {
    if (r.user_id !== userId) waitingByGroup.set(r.group_id, (waitingByGroup.get(r.group_id) ?? 0) + 1);
  }
  const myPending = (requests.data ?? []).filter((r) => r.user_id === userId).length;

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={groups.isRefetching}
            onRefresh={() => {
              groups.refetch();
              requests.refetch();
            }}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.header}>
          <Text variant="title">Groups</Text>
          <Button label="New group" variant="secondary" onPress={() => router.push('/group/new')} />
        </View>

        {groups.data?.length ? (
          <View style={[styles.list, { borderColor: colors.border }]}>
            {groups.data.map((g) => {
              const waiting = waitingByGroup.get(g.id) ?? 0;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => router.push({ pathname: '/group/[id]', params: { id: g.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={waiting ? `${g.name}, ${waiting} waiting to join` : g.name}
                  style={[styles.row, { borderColor: colors.border }]}
                >
                  <GroupAvatar icon={g.icon} size={48} />
                  <View style={styles.flex}>
                    <Text variant="label">{g.name}</Text>
                    {g.description ? (
                      <Text variant="caption" tone="muted" numberOfLines={1}>
                        {g.description}
                      </Text>
                    ) : null}
                  </View>
                  {waiting ? (
                    <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                      <Text variant="caption" style={{ color: colors.accentText }}>
                        {waiting}
                      </Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        ) : groups.isPending ? null : (
          <EmptyState
            title="Pray together"
            body="Start a group for your Bible study, team, or family. Each group keeps its own shared prayer list."
          />
        )}

        {myPending ? (
          <Text variant="caption" tone="muted">
            {myPending === 1 ? 'You have 1 request' : `You have ${myPending} requests`} waiting for a group admin to approve.
          </Text>
        ) : null}

        <View style={[styles.join, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextField
            label="Have an invite code?"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            placeholder="e.g. 7KQ2MXRT"
          />
          <Button
            label="Find group"
            variant="secondary"
            disabled={code.length < 6}
            onPress={() => router.push({ pathname: '/join/[code]', params: { code } })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, gap: space.xl, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space.lg },
  list: { borderTopWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: hitSize + 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  join: { padding: space.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: space.md },
});
