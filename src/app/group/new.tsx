import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { errorMessage, notify } from '@/lib/dialogs';
import { GROUP_ICONS } from '@/lib/groupIcons';
import { useCreateGroup } from '@/lib/queries/groups';
import { space } from '@/theme';

export default function NewGroup() {
  const create = useCreateGroup();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(GROUP_ICONS[0]);
  const [description, setDescription] = useState('');

  async function submit() {
    try {
      const id = await create.mutateAsync({ name: name.trim(), icon, description: description.trim() });
      router.replace({ pathname: '/group/[id]/members', params: { id, invite: '1' } });
    } catch (e) {
      notify('Could not create the group', errorMessage(e));
    }
  }

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.section}>
        <TextField label="Group name" value={name} onChangeText={setName} maxLength={60} autoFocus placeholder="Thursday Bible Study" />
        <TextField
          label="What's this group for? (optional)"
          value={description}
          onChangeText={setDescription}
          maxLength={280}
          multiline
        />
      </View>
      <View style={styles.section}>
        <Text variant="label" tone="muted">
          Icon
        </Text>
        <View style={styles.icons} accessibilityRole="radiogroup">
          {GROUP_ICONS.map((i) => (
            <Chip key={i} label={i} selected={icon === i} onPress={() => setIcon(i)} />
          ))}
        </View>
      </View>
      <Text variant="caption" tone="muted">
        You’ll be the group’s admin. People join with an invite link or code, and you approve each one.
      </Text>
      <Button label="Create group" onPress={submit} loading={create.isPending} disabled={!name.trim()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, paddingTop: space.lg },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
