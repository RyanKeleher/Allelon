import { getLocales } from 'expo-localization';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { notify } from '@/lib/dialogs';
import { useAuth, useMyProfile, useUserId } from '@/lib/auth';
import { flagFor, useCountries } from '@/lib/queries/lookups';
import { useUpdateProfile } from '@/lib/queries/people';
import { hitSize, radius, space, useAppTheme } from '@/theme';

const HANDLE = /^[a-z0-9_]{3,24}$/;

export default function Onboarding() {
  const userId = useUserId();
  const { colors } = useAppTheme();
  const { session } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: countries } = useCountries();
  const update = useUpdateProfile(userId);
  const locale = getLocales()[0];

  const [name, setName] = useState(
    // Apple shares the name only after the profile row exists, so fall back to auth metadata.
    profile?.display_name || (session?.user.user_metadata?.full_name as string | undefined) || '',
  );
  const [handle, setHandle] = useState('');
  const [country, setCountry] = useState<string | null>(locale?.regionCode ?? null);
  const [countryQuery, setCountryQuery] = useState('');

  const matches = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return [];
    return (countries ?? []).filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [countries, countryQuery]);
  const countryName = countries?.find((c) => c.code === country)?.name;

  const valid = name.trim().length > 0 && HANDLE.test(handle);

  async function finish() {
    try {
      await update.mutateAsync({
        display_name: name.trim(),
        handle,
        country_code: countryName ? country : null,
        preferred_language: locale?.languageCode ?? 'en',
        onboarded_at: new Date().toISOString(),
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      notify(
        'Could not save',
        err.code === '23505' ? 'That handle is taken. Try another.' : (err.message ?? 'Please try again.'),
      );
    }
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.intro}>
        <Text variant="title">Welcome</Text>
        <Text tone="muted">A few details so the people you pray with can find you.</Text>
      </View>
      <TextField label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" maxLength={60} />
      <TextField
        label="Handle"
        value={handle}
        onChangeText={(t) => setHandle(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={24}
        hint="3–24 letters, numbers, or underscores. Friends search for this."
      />
      <View style={styles.country}>
        <TextField
          label="Country"
          value={countryQuery}
          onChangeText={setCountryQuery}
          placeholder={countryName ? `${flagFor(country!)} ${countryName}` : 'Search countries'}
          hint="Used for posts you share with the World. You can change it later."
        />
        <FlatList
          scrollEnabled={false}
          data={matches}
          keyExtractor={(c) => c.code}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.name}
              onPress={() => {
                setCountry(item.code);
                setCountryQuery('');
              }}
              style={[styles.countryRow, { borderColor: colors.border }]}
            >
              <Text>
                {flagFor(item.code)} {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>
      <Button label="Continue" onPress={finish} loading={update.isPending} disabled={!valid} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { paddingTop: space.xxl, gap: space.sm },
  country: { gap: space.sm },
  countryRow: {
    minHeight: hitSize,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
  },
});
