import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { PersonRow } from '@/components/PersonRow';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useMyProfile, useUserId } from '@/lib/auth';
import { confirm, errorMessage, notify } from '@/lib/dialogs';
import { enablePush } from '@/lib/push';
import { useUpdateProfile } from '@/lib/queries/people';
import { useBlock, useBlockedPeople, useDeleteAccount } from '@/lib/queries/safety';
import { supabase } from '@/lib/supabase';
import { hitSize, space, useAppTheme, type Appearance } from '@/theme';

function SettingSwitch({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.switchRow}>
      <View style={styles.flex}>
        <Text>{label}</Text>
        {hint ? (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: colors.accent }} />
    </View>
  );
}

export default function Settings() {
  const userId = useUserId();
  const { data: profile } = useMyProfile();
  const update = useUpdateProfile(userId);
  const { appearance, setAppearance } = useAppTheme();
  const blocked = useBlockedPeople();
  const unblock = useBlock();
  const deleteAccount = useDeleteAccount();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');

  async function save() {
    try {
      await update.mutateAsync({ display_name: name.trim(), bio: bio.trim() });
      notify('Saved');
    } catch (e) {
      notify('Could not save', errorMessage(e));
    }
  }

  async function setPush(on: boolean) {
    if (on) {
      const result = await enablePush();
      if (!result.ok) {
        notify('Notifications aren’t on yet', result.reason);
        return;
      }
    }
    update.mutate({ push_enabled: on });
  }

  async function removeAccount() {
    const first = await confirm(
      'Delete your account?',
      'This permanently deletes your profile, your requests, responses, prayers, photos, and group memberships. It cannot be undone.',
      'Continue',
      { destructive: true },
    );
    if (!first) return;
    const second = await confirm('Are you sure?', 'Your account and everything you have shared will be gone.', 'Delete forever', {
      destructive: true,
    });
    if (!second) return;
    try {
      await deleteAccount.mutateAsync();
    } catch (e) {
      notify('Could not delete your account', errorMessage(e));
    }
  }

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.section}>
        <Text variant="heading">Profile</Text>
        <TextField label="Name" value={name} onChangeText={setName} maxLength={60} />
        <TextField label="Bio" value={bio} onChangeText={setBio} multiline maxLength={280} />
        <Button label="Save" onPress={save} loading={update.isPending} disabled={!name.trim()} />
      </View>

      <View style={styles.section}>
        <Text variant="heading">Notifications</Text>
        <SettingSwitch
          label="Push notifications"
          hint="Responses, follow requests, answered prayers, and check-ins. Never the text of anyone’s prayer."
          value={profile?.push_enabled ?? true}
          onChange={setPush}
        />
        <SettingSwitch
          label="Gentle check-ins"
          hint="A few days after you pray for someone, a reminder to check in with them."
          value={profile?.checkins_enabled ?? true}
          onChange={(v) => update.mutate({ checkins_enabled: v })}
        />
        {profile?.checkins_enabled ? (
          <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Remind me after">
            {[1, 3, 7].map((d) => (
              <Chip
                key={d}
                label={d === 1 ? 'After 1 day' : `After ${d} days`}
                selected={profile.checkin_after_days === d}
                onPress={() => update.mutate({ checkin_after_days: d })}
              />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text variant="heading">Appearance</Text>
        <View style={styles.row} accessibilityRole="radiogroup">
          {(
            [
              ['light', 'Light'],
              ['dark', 'Dark'],
              ['system', 'Match my phone'],
            ] as [Appearance, string][]
          ).map(([value, label]) => (
            <Chip key={value} label={label} selected={appearance === value} onPress={() => setAppearance(value)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="heading">Blocked people</Text>
        {blocked.data?.length ? (
          blocked.data.map((p) => (
            <PersonRow
              key={p.id}
              person={p}
              trailing={<Button label="Unblock" variant="ghost" onPress={() => unblock.mutate({ userId: p.id, block: false })} />}
            />
          ))
        ) : (
          <Text tone="muted">You haven’t blocked anyone.</Text>
        )}
      </View>

      {profile?.is_moderator ? (
        <View style={styles.section}>
          <Text variant="heading">Moderation</Text>
          <Button label="Review reports" variant="secondary" onPress={() => router.push('/moderation')} />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="heading">Account</Text>
        <Button label="Sign out" variant="secondary" onPress={() => supabase.auth.signOut()} />
        <Button label="Delete my account" variant="ghost" onPress={removeAccount} loading={deleteAccount.isPending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, paddingTop: space.xl },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: hitSize },
  flex: { flex: 1 },
});
