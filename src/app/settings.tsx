import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { errorMessage, notify } from '@/lib/dialogs';
import { useMyProfile, useUserId } from '@/lib/auth';
import { useUpdateProfile } from '@/lib/queries/people';
import { supabase } from '@/lib/supabase';
import { space } from '@/theme';

export default function Settings() {
  const userId = useUserId();
  const { data: profile } = useMyProfile();
  const update = useUpdateProfile(userId);
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

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.section}>
        <Text variant="heading">Profile</Text>
        <TextField label="Name" value={name} onChangeText={setName} maxLength={60} />
        <TextField label="Bio" value={bio} onChangeText={setBio} multiline maxLength={280} />
        <Button label="Save" onPress={save} loading={update.isPending} disabled={!name.trim()} />
      </View>
      <View style={styles.section}>
        <Text variant="heading">Account</Text>
        <Button label="Sign out" variant="secondary" onPress={() => supabase.auth.signOut()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, paddingTop: space.xl },
});
