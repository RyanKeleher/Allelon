import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { RequestCard } from '@/components/RequestCard';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useUserId } from '@/lib/auth';
import { useDeleteRequest, useRequest, useRespond, useResponses } from '@/lib/queries/requests';
import { timeAgo } from '@/lib/time';
import { radius, space, useAppTheme } from '@/theme';

export default function RequestDetail() {
  const { id, respond } = useLocalSearchParams<{ id: string; respond?: string }>();
  const userId = useUserId();
  const { colors } = useAppTheme();
  const request = useRequest(id);
  const responses = useResponses(id);
  const send = useRespond(id);
  const remove = useDeleteRequest();
  const [body, setBody] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const card = request.data;
  if (request.isPending) return <Screen>{null}</Screen>;
  if (!card) {
    return (
      <Screen>
        <EmptyState title="Not available" body="This request was removed or isn't shared with you." />
      </Screen>
    );
  }

  const authorFirst = card.is_anonymous ? 'the author' : (card.author_name?.split(' ')[0] ?? 'the author');

  async function submit() {
    try {
      await send.mutateAsync({ body, isPrivate });
      setBody('');
    } catch (e) {
      Alert.alert('Could not send', (e as Error).message);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete this request?', 'It will be removed for everyone, along with its responses.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen scroll edges={['bottom']}>
      <RequestCard card={card} showFullBody />

      <View style={styles.section}>
        <Text variant="heading">Responses</Text>
        {responses.data?.length ? (
          responses.data.map((r) => (
            <View
              key={r.id}
              style={[
                styles.response,
                { backgroundColor: colors.surface, borderColor: r.is_private ? colors.private : colors.border },
              ]}
            >
              <View style={styles.responseHeader}>
                <Avatar name={r.author?.display_name} url={r.author?.avatar_url} size={28} />
                <Text variant="label" style={styles.flex}>
                  {r.author_id === userId ? 'You' : (r.author?.display_name ?? 'Someone')}
                </Text>
                <Text variant="caption" tone="muted">
                  {timeAgo(r.created_at)}
                </Text>
              </View>
              <Text variant="prayer" style={styles.responseBody}>
                {r.body}
              </Text>
              {r.is_private ? (
                <View style={styles.privateNote}>
                  <Ionicons name="lock-closed" size={12} color={colors.private} />
                  <Text variant="caption" tone="private">
                    Private: only {card.is_mine ? 'you and them' : `you and ${authorFirst}`}
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <Text tone="muted">No responses yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <TextField
          label={card.is_mine ? 'Add a reply' : 'Write a response or a prayer'}
          value={body}
          onChangeText={setBody}
          multiline
          serif
          maxLength={2000}
          autoFocus={respond === '1'}
        />
        {card.is_mine ? null : (
          <View style={styles.row}>
            <Chip label="Public" selected={!isPrivate} onPress={() => setIsPrivate(false)} />
            <Chip
              label={`Only ${authorFirst}`}
              icon={<Ionicons name="lock-closed" size={14} color={colors.private} />}
              color={colors.private}
              selected={isPrivate}
              onPress={() => setIsPrivate(true)}
              accessibilityHint="Only you and the author will see this response"
            />
          </View>
        )}
        <Button label="Send" onPress={submit} loading={send.isPending} disabled={!body.trim()} />
      </View>

      {card.is_mine ? (
        <Button label="Delete request" variant="ghost" onPress={confirmDelete} style={styles.delete} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, paddingTop: space.lg },
  response: { padding: space.lg, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, gap: space.sm },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  responseBody: { fontSize: 17, lineHeight: 25 },
  privateNote: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  flex: { flex: 1 },
  delete: { marginTop: space.xl },
});
