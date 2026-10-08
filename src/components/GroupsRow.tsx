import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useMyGroups } from '@/lib/queries/groups';
import { space, useAppTheme } from '@/theme';

import { GroupAvatar } from './GroupAvatar';
import { Text } from './Text';

/** Stories-style row of my prayer groups for the top of Home. */
export function GroupsRow() {
  const { colors } = useAppTheme();
  const { data: groups } = useMyGroups();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {(groups ?? []).map((g) => (
        <Pressable
          key={g.id}
          onPress={() => router.push({ pathname: '/group/[id]', params: { id: g.id } })}
          accessibilityRole="button"
          accessibilityLabel={`${g.name} prayer group`}
          style={styles.item}
        >
          <GroupAvatar icon={g.icon} size={60} />
          <Text variant="caption" numberOfLines={1} style={styles.label}>
            {g.name}
          </Text>
        </Pressable>
      ))}
      <Pressable
        onPress={() => router.push('/group/new')}
        accessibilityRole="button"
        accessibilityLabel="Start a prayer group"
        style={styles.item}
      >
        <View style={[styles.add, { borderColor: colors.border }]}>
          <Ionicons name="add" size={26} color={colors.textMuted} />
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1} style={styles.label}>
          New group
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.lg, paddingHorizontal: space.sm, paddingBottom: space.xl },
  item: { width: 72, alignItems: 'center', gap: space.xs },
  label: { textAlign: 'center', width: 72 },
  add: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
