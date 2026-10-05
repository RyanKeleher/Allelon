import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { usePassions } from '@/lib/queries/lookups';
import { usePray } from '@/lib/queries/requests';
import { signedPhotoUrl } from '@/lib/photos';
import { timeAgo } from '@/lib/time';
import type { CardAudience, RequestCard as Card } from '@/lib/types';
import { hitSize, radius, space, useAppTheme } from '@/theme';

import { Avatar } from './Avatar';
import { Text } from './Text';

function audienceLabel(a: CardAudience): { icon: keyof typeof Ionicons.glyphMap; text: string } {
  switch (a.type) {
    case 'followers':
      return { icon: 'people-outline', text: 'Followers' };
    case 'close_friends':
      return { icon: 'lock-closed', text: 'Close friends' };
    case 'group':
      return { icon: 'chatbubbles-outline', text: a.group_name ?? 'Group' };
    case 'world':
      return { icon: 'globe-outline', text: 'World' };
  }
}

export function RequestCard({ card, showFullBody }: { card: Card; showFullBody?: boolean }) {
  const { colors } = useAppTheme();
  const pray = usePray();
  const { data: passions } = usePassions();
  const passion = passions?.find((p) => p.id === card.passion_id);
  const photo = useQuery({
    queryKey: ['photo', card.photo_path],
    enabled: Boolean(card.photo_path),
    staleTime: 50 * 60 * 1000,
    queryFn: () => signedPhotoUrl(card.photo_path!),
  });

  const authorName = card.is_anonymous ? (card.is_mine ? 'You (anonymous)' : 'Anonymous') : card.author_name;
  const answered = card.status === 'answered';
  const openDetail = () => router.push({ pathname: '/request/[id]', params: { id: card.id } });
  const openAuthor = () => card.author_id && router.push({ pathname: '/profile/[id]', params: { id: card.author_id } });

  const prayedLabel = card.is_mine
    ? card.prayer_count
      ? `${card.prayer_count} prayed`
      : 'Prayed'
    : card.prayed_by_me
      ? 'You prayed'
      : 'I prayed';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: answered ? colors.answered : colors.border },
      ]}
    >
      {answered ? (
        <View style={[styles.answered, { backgroundColor: colors.surfaceRaised }]}>
          <Ionicons name="sunny-outline" size={16} color={colors.answered} />
          <Text variant="label" tone="answered">
            Answered
          </Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Pressable
          onPress={openAuthor}
          disabled={!card.author_id}
          accessibilityRole="link"
          accessibilityLabel={`${authorName}'s profile`}
          style={styles.author}
        >
          <Avatar name={card.is_anonymous ? null : card.author_name} url={card.author_avatar_url} size={40} />
          <View style={styles.authorText}>
            <Text variant="label">{authorName}</Text>
            <Text variant="caption" tone="muted">
              {timeAgo(card.created_at)}
              {card.kind === 'moment' ? ` · ${card.moment_label ?? 'Moment'}` : ''}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.tags}>
        {card.audiences.map((a) => {
          const { icon, text } = audienceLabel(a);
          const tint = a.type === 'close_friends' ? colors.close : colors.textMuted;
          return (
            <View key={`${a.type}-${a.group_id ?? ''}`} style={styles.tag} accessibilityLabel={`Shared with ${text}`}>
              <Ionicons name={icon} size={13} color={tint} />
              <Text variant="caption" style={{ color: tint }}>
                {text}
              </Text>
            </View>
          );
        })}
        {passion ? (
          <View style={styles.tag}>
            <Text variant="caption" tone="muted">
              {passion.icon} {passion.label}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable onPress={openDetail} accessibilityRole="button" accessibilityHint="Opens the request and its responses">
        <Text variant="prayer" numberOfLines={showFullBody ? undefined : 8}>
          {card.body}
        </Text>
      </Pressable>

      {photo.data ? (
        <Image
          source={{ uri: photo.data }}
          style={styles.photo}
          contentFit="cover"
          accessibilityLabel="Photo attached to this request"
        />
      ) : null}

      {answered && card.answered_update ? (
        <View style={[styles.update, { borderColor: colors.answered }]}>
          <Text variant="body">{card.answered_update}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={() => !card.is_mine && !card.prayed_by_me && pray.mutate(card.id)}
          disabled={card.is_mine ?? false}
          accessibilityRole="button"
          accessibilityLabel={prayedLabel}
          accessibilityState={{ selected: !!card.prayed_by_me, disabled: !!card.is_mine }}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: card.prayed_by_me ? colors.accentSoft : 'transparent',
              borderColor: card.prayed_by_me ? colors.accent : colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name={card.prayed_by_me ? 'heart' : 'heart-outline'} size={18} color={colors.accent} />
          <Text variant="label" tone="accent">
            {prayedLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/request/[id]', params: { id: card.id, respond: '1' } })}
          accessibilityRole="button"
          accessibilityLabel={card.response_count ? `Respond, ${card.response_count} responses` : 'Respond'}
          style={({ pressed }) => [styles.action, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="chatbubble-outline" size={17} color={colors.textMuted} />
          <Text variant="label" tone="muted">
            {card.response_count ? `Respond · ${card.response_count}` : 'Respond'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.md,
  },
  answered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  author: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: hitSize, flexShrink: 1 },
  authorText: { flexShrink: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md },
  update: { borderLeftWidth: 3, paddingLeft: space.md },
  actions: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  action: {
    minHeight: hitSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
