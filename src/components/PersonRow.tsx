import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { PersonSummary } from '@/lib/queries/people';
import { hitSize, space } from '@/theme';

import { Avatar } from './Avatar';
import { Text } from './Text';

export function PersonRow({ person, trailing }: { person: PersonSummary; trailing?: ReactNode }) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.who}
        accessibilityRole="link"
        accessibilityLabel={`${person.display_name}'s profile`}
        onPress={() => router.push({ pathname: '/profile/[id]', params: { id: person.id } })}
      >
        <Avatar name={person.display_name} url={person.avatar_url} size={44} />
        <View style={styles.text}>
          <Text variant="label">{person.display_name || 'Unnamed'}</Text>
          {person.handle ? (
            <Text variant="caption" tone="muted">
              @{person.handle}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: hitSize },
  text: { flexShrink: 1 },
  trailing: { flexDirection: 'row', gap: space.sm },
});
