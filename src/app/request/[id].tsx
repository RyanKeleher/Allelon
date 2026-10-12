import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { CrisisCard } from '@/components/CrisisCard';
import { EmptyState } from '@/components/EmptyState';
import { RequestCard } from '@/components/RequestCard';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { confirm, errorMessage, notify } from '@/lib/dialogs';
import { useMyProfile, useUserId } from '@/lib/auth';
import { mentionsSelfHarm } from '@/lib/crisis';
import { useDeleteRequest, useReopenRequest, useRequest, useRespond, useResponses } from '@/lib/queries/requests';
import { useSafetyMenu } from '@/lib/useSafetyMenu';
import { useSuggestResponse } from '@/lib/queries/world';
import { timeAgo } from '@/lib/time';
import { hitSize, radius, space, useAppTheme } from '@/theme';

export default function RequestDetail() {
  const { id, respond } = useLocalSearchParams<{ id: string; respond?: string }>();
  const userId = useUserId();
  const { colors } = useAppTheme();
  const request = useRequest(id);
  const responses = useResponses(id);
  const send = useRespond(id);
  const remove = useDeleteRequest();
  const [body, setBody] = useState('');
  const { data: me } = useMyProfile();
  const suggest = useSuggestResponse();
  const [suggested, setSuggested] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const reopen = useReopenRequest();
  const safety = useSafetyMenu();

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
      setSuggested(false);
    } catch (e) {
      notify('Could not send', errorMessage(e));
    }
  }

  async function confirmDelete() {
    const ok = await confirm(
      'Delete this request?',
      'It will be removed for everyone, along with its responses.',
      'Delete',
      { destructive: true },
    );
    if (!ok) return;
    await remove.mutateAsync(id);
    router.back();
  }

  const crisis =
    mentionsSelfHarm(card.body) || (responses.data ?? []).some((r) => mentionsSelfHarm(r.body)) || mentionsSelfHarm(body);

  return (
    <Screen scroll edges={['bottom']}>
      <RequestCard card={card} showFullBody />

      {crisis ? <CrisisCard forAuthor={Boolean(card.is_mine)} /> : null}

      {card.is_mine && card.kind === 'request' ? (
        <View style={styles.answerRow}>
          <Button
            label={card.status === 'answered' ? 'Edit answered update' : 'Mark as answered'}
            variant={card.status === 'answered' ? 'secondary' : 'primary'}
            onPress={() => router.push({ pathname: '/answer/[id]', params: { id } })}
          />
          {card.status === 'answered' ? (
            <Button
              label="Not answered yet? Reopen"
              variant="ghost"
              loading={reopen.isPending}
              onPress={async () => {
                if (await confirm('Reopen this request?', 'It will show as open again.', 'Reopen')) reopen.mutate(id);
              }}
            />
          ) : null}
        </View>
      ) : null}

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
                {r.author_id !== userId ? (
                  <Pressable
                    onPress={() =>
                      safety.open({
                        targetType: 'response',
                        targetId: r.id,
                        authorId: r.author_id,
                        authorName: r.author?.display_name,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel="More options for this response"
                    hitSlop={8}
                    style={styles.more}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
              <Text variant="prayer" style={styles.responseBody}>
                {r.body}
              </Text>
              {r.is_private ? (
                <View style={styles.privateNote}>
                  <Ionicons name="lock-closed" size={12} color={colors.private} />
                  <Text variant="caption" tone="private">
                    Private: only you and{' '}
                    {card.is_mine ? (r.author?.display_name?.split(' ')[0] ?? 'them') : authorFirst}
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
        {card.is_mine ? null : (
          <View style={styles.helpRow}>
            <Button
              label={suggested ? 'Suggest different words' : 'Help me write'}
              variant="ghost"
              loading={suggest.isPending}
              onPress={async () => {
                try {
                  const text = await suggest.mutateAsync({ requestId: id, language: me?.preferred_language ?? 'en' });
                  setBody(text);
                  setSuggested(true);
                } catch (e) {
                  notify('Could not suggest words', errorMessage(e));
                }
              }}
            />
            {suggested ? (
              <Text variant="caption" tone="muted">
                Suggested by AI. Make the words your own before you send.
              </Text>
            ) : null}
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
  answerRow: { gap: space.xs },
  more: { width: hitSize - 12, height: hitSize - 12, alignItems: 'flex-end', justifyContent: 'center' },
  helpRow: { alignItems: 'flex-start', gap: space.xs },
});
