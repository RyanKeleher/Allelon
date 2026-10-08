import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Globe } from '@/components/Globe';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { flagFor } from '@/lib/queries/lookups';
import { useWorldCountries, type CountryWithCount } from '@/lib/queries/world';
import { hitSize, radius, space, useAppTheme } from '@/theme';

export default function WorldTab() {
  const { colors } = useAppTheme();
  const countries = useWorldCountries();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const withRequests = useMemo(
    () => (countries.data ?? []).filter((c) => c.count > 0).sort((a, b) => b.count - a.count),
    [countries.data],
  );
  const markers = useMemo(
    () =>
      withRequests
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => ({ code: c.code, lat: c.lat!, lng: c.lng!, count: c.count })),
    [withRequests],
  );
  const q = query.trim().toLowerCase();
  const list = q ? (countries.data ?? []).filter((c) => c.name.toLowerCase().includes(q)) : withRequests;
  const current = countries.data?.find((c) => c.code === selected);

  const open = (c: CountryWithCount) => router.push({ pathname: '/country/[code]', params: { code: c.code } });

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="title">World</Text>
          <Text tone="muted">Pray for people you may never meet. Tap a light to see who’s asking.</Text>
        </View>

        <Globe
          markers={markers}
          selected={selected}
          onSelect={setSelected}
          accentColor={colors.accent}
          selectedColor="#ffffff"
        />

        {current ? (
          <View style={[styles.selected, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="heading">
              {flagFor(current.code)} {current.name}
            </Text>
            <Text tone="muted">
              {current.count === 0
                ? 'No open requests right now.'
                : `${current.count} open ${current.count === 1 ? 'request' : 'requests'}`}
            </Text>
            <Button label={`Pray for ${current.name}`} onPress={() => open(current)} />
          </View>
        ) : null}

        <TextField
          label="Find a country"
          value={query}
          onChangeText={setQuery}
          placeholder="Search all countries"
          autoCorrect={false}
          returnKeyType="search"
        />

        <View style={[styles.list, { borderColor: colors.border }]}>
          {!q && withRequests.length === 0 && !countries.isPending ? (
            <Text tone="muted" style={styles.empty}>
              No one has shared with the World yet. Search for a country, or be the first to share a request with the
              World.
            </Text>
          ) : null}
          {list.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => {
                setSelected(c.code);
                open(c);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${c.name}, ${c.count} open ${c.count === 1 ? 'request' : 'requests'}`}
              style={[styles.row, { borderColor: colors.border }]}
            >
              <Text style={styles.flag}>{flagFor(c.code)}</Text>
              <Text style={styles.flex}>{c.name}</Text>
              {c.count ? (
                <View style={[styles.count, { backgroundColor: colors.accentSoft }]}>
                  <Text variant="caption" tone="accent">
                    {c.count}
                  </Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },
  header: { gap: space.xs, paddingTop: space.lg },
  selected: { padding: space.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: space.sm },
  list: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: hitSize + 6, borderBottomWidth: StyleSheet.hairlineWidth },
  flag: { fontSize: 22 },
  count: { minWidth: 26, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, alignItems: 'center' },
  empty: { paddingVertical: space.lg },
});
