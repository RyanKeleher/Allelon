import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { RequestCard } from '@/components/RequestCard';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useMyProfile, useUserId } from '@/lib/auth';
import { useFollowRequests } from '@/lib/queries/people';
import { useMyRequests } from '@/lib/queries/requests';
import { hitSize, space, useAppTheme } from '@/theme';

export default function MyProfile() {
  const userId = useUserId();
  const { colors } = useAppTheme();
  const { data: profile } = useMyProfile();
  const { data: mine } = useMyRequests();
  const { data: requests } = useFollowRequests(userId);
  const [tab, setTab] = useState<'open' | 'answered'>('open');

  const list = (mine ?? []).filter((r) => (tab === 'answered' ? r.status === 'answered' : r.status === 'open'));

  const links: { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href; badge?: number }[] = [
    { label: 'Follow requests', icon: 'mail-outline', href: '/follow-requests', badge: requests?.length },
    { label: 'Followers & following', icon: 'people-outline', href: '/connections' },
    { label: 'Close friends', icon: 'lock-closed-outline', href: '/close-friends' },
    { label: 'Settings', icon: 'settings-outline', href: '/settings' },
  ];

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Avatar name={profile?.display_name} url={profile?.avatar_url} size={72} />
        <View style={styles.flex}>
          <Text variant="heading">{profile?.display_name}</Text>
          {profile?.handle ? <Text tone="muted">@{profile.handle}</Text> : null}
        </View>
      </View>
      {profile?.bio ? <Text>{profile.bio}</Text> : null}

      <View style={[styles.links, { borderColor: colors.border }]}>
        {links.map((l) => (
          <Pressable
            key={l.label}
            onPress={() => router.push(l.href)}
            accessibilityRole="button"
            accessibilityLabel={l.badge ? `${l.label}, ${l.badge} waiting` : l.label}
            style={[styles.link, { borderColor: colors.border }]}
          >
            <Ionicons name={l.icon} size={20} color={colors.textMuted} />
            <Text style={styles.flex}>{l.label}</Text>
            {l.badge ? (
              <Text variant="label" tone="accent">
                {l.badge}
              </Text>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <View style={styles.tabs}>
        <Chip label="Open" selected={tab === 'open'} onPress={() => setTab('open')} />
        <Chip label="Answered" selected={tab === 'answered'} onPress={() => setTab('answered')} />
      </View>
      {list.length ? (
        list.map((card) => <RequestCard key={card.id} card={card} />)
      ) : (
        <EmptyState
          title={tab === 'open' ? 'Nothing open' : 'Nothing marked answered yet'}
          body={tab === 'open' ? 'Share what is on your heart with the Post button.' : undefined}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingTop: space.xl },
  flex: { flex: 1 },
  links: { borderTopWidth: StyleSheet.hairlineWidth },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: hitSize + 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabs: { flexDirection: 'row', gap: space.sm, paddingTop: space.md },
});
