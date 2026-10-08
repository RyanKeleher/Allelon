import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { RequestCard } from '@/components/RequestCard';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { flagFor, useCountries } from '@/lib/queries/lookups';
import { useCountryFeed } from '@/lib/queries/world';
import { space, useAppTheme } from '@/theme';

export default function CountryScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { colors } = useAppTheme();
  const { data: countries } = useCountries();
  const feed = useCountryFeed(code);
  const name = countries?.find((c) => c.code === code)?.name ?? code;
  const cards = feed.data?.pages.flat() ?? [];

  return (
    <Screen padded={false} edges={['bottom']}>
      <Stack.Screen options={{ title: `${flagFor(code)} ${name}` }} />
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <RequestCard card={item} />}
        ItemSeparatorComponent={() => <View style={{ height: space.lg }} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={colors.accent} />}
        ListHeaderComponent={
          <Text tone="muted" style={styles.intro}>
            Requests shared with the whole Allelon family from {name}. Take a moment to pray, and let them know.
          </Text>
        }
        ListEmptyComponent={
          feed.isPending ? null : (
            <View>
              <EmptyState title="Quiet here for now" body={`No one in ${name} has shared with the World yet.`} />
              <Button label="Back to the globe" variant="secondary" onPress={() => router.back()} />
            </View>
          )
        }
        ListFooterComponent={
          feed.hasNextPage ? (
            <Button label="Show earlier requests" variant="secondary" onPress={() => feed.fetchNextPage()} loading={feed.isFetchingNextPage} style={styles.footer} />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingBottom: space.xxl },
  intro: { paddingBottom: space.lg },
  footer: { marginTop: space.xl },
});
