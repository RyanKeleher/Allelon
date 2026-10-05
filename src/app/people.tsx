import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PersonRow } from '@/components/PersonRow';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useUserId } from '@/lib/auth';
import { useFollow, useFollowing, useSearchPeople } from '@/lib/queries/people';
import { space } from '@/theme';

export default function FindPeople() {
  const userId = useUserId();
  const [query, setQuery] = useState('');
  const results = useSearchPeople(query, userId);
  const following = useFollowing(userId);
  const follow = useFollow();

  const stateOf = (id: string) => {
    const f = following.data?.find((p) => p.id === id);
    return !f ? 'none' : f.pending ? 'pending' : 'following';
  };

  return (
    <Screen padded={false} edges={['bottom']}>
      <View style={styles.search}>
        <TextField
          label="Search by name or handle"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
        />
      </View>
      <FlatList
        data={results.data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const state = stateOf(item.id);
          return (
            <PersonRow
              person={item}
              trailing={
                state === 'none' ? (
                  <Button label="Follow" onPress={() => follow.mutate(item.id)} />
                ) : (
                  <Button label={state === 'pending' ? 'Requested' : 'Following'} variant="secondary" disabled />
                )
              }
            />
          );
        }}
        ListEmptyComponent={
          query.trim().length >= 2 && results.isFetched ? (
            <EmptyState title="No one found" body="Check the spelling, or ask them for their handle." />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { padding: space.xl, paddingBottom: space.md },
  list: { paddingHorizontal: space.xl },
});
