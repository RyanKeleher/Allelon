import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { errorMessage, notify } from '@/lib/dialogs';
import { useMarkAnswered, useRequest } from '@/lib/queries/requests';
import { radius, space, useAppTheme } from '@/theme';

/** Mark one of my requests answered, with an optional update or testimony. */
export default function AnswerRequest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { data: card } = useRequest(id);
  const mark = useMarkAnswered();
  const [update, setUpdate] = useState(card?.answered_update ?? '');
  const editing = card?.status === 'answered';

  async function save() {
    try {
      await mark.mutateAsync({ id, update });
      router.back();
    } catch (e) {
      notify('Could not save', errorMessage(e));
    }
  }

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.intro}>
        <Text variant="heading">{editing ? 'Your update' : 'God answered this prayer'}</Text>
        <Text tone="muted">
          {editing
            ? 'Edit what you shared. People who prayed were already told once.'
            : 'Everyone who prayed for this will be told it was answered. Sharing how builds faith in everyone who prayed with you.'}
        </Text>
      </View>
      {card ? (
        <View style={[styles.quote, { borderColor: colors.answered, backgroundColor: colors.surface }]}>
          <Text variant="prayer" numberOfLines={6}>
            {card.body}
          </Text>
        </View>
      ) : null}
      <TextField
        label="How did God answer? (optional)"
        value={update}
        onChangeText={setUpdate}
        multiline
        serif
        maxLength={4000}
        autoFocus
        placeholder="Even a few words matter."
      />
      <Button label={editing ? 'Save update' : 'Share the good news'} onPress={save} loading={mark.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, paddingTop: space.lg },
  quote: { borderLeftWidth: 3, padding: space.lg, borderRadius: radius.md },
});
