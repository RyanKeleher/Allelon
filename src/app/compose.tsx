import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import {
  DEFAULT_SELECTION,
  canBeAnonymous,
  describeSelection,
  hasAudience,
  setAnonymous,
  toggleAudience,
  toggleGroup,
} from '@/lib/audience';
import { errorMessage, notify } from '@/lib/dialogs';
import { useMyProfile, useUserId } from '@/lib/auth';
import { pickPhoto, uploadRequestPhoto, type PickedPhoto } from '@/lib/photos';
import { useMyGroups } from '@/lib/queries/groups';
import { flagFor, usePassions } from '@/lib/queries/lookups';
import { useCreateRequest } from '@/lib/queries/requests';
import type { RequestKind } from '@/lib/types';
import { hitSize, radius, space, useAppTheme } from '@/theme';

const MOMENT_LABELS = ['Win', 'Milestone', 'Gratitude', 'Struggle', 'Moment'];

export default function Compose() {
  const userId = useUserId();
  const { colors } = useAppTheme();
  const { data: profile } = useMyProfile();
  const { data: passions } = usePassions();
  const { data: groups } = useMyGroups();
  const create = useCreateRequest();

  const [kind, setKind] = useState<RequestKind>('request');
  const [momentLabel, setMomentLabel] = useState('Moment');
  const [body, setBody] = useState('');
  const [passionId, setPassionId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [selection, setSelection] = useState(DEFAULT_SELECTION);
  const [posting, setPosting] = useState(false);

  const groupNames = Object.fromEntries((groups ?? []).map((g) => [g.id, g.name]));
  const summary = describeSelection(selection, groupNames);
  const canPost = body.trim().length > 0 && hasAudience(selection) && !posting;

  async function post() {
    setPosting(true);
    try {
      const photoPath = photo ? await uploadRequestPhoto(userId, photo) : null;
      await create.mutateAsync({
        body,
        kind,
        momentLabel: kind === 'moment' ? momentLabel : null,
        passionId,
        audiences: selection.audiences,
        groupIds: selection.groupIds,
        photoPath,
        isAnonymous: selection.anonymous,
      });
      router.back();
    } catch (e) {
      notify('Could not share', errorMessage(e));
    } finally {
      setPosting(false);
    }
  }

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.section}>
        <View style={styles.row} accessibilityRole="radiogroup">
          <Chip label="Prayer request" selected={kind === 'request'} onPress={() => setKind('request')} />
          <Chip label="Life moment" selected={kind === 'moment'} onPress={() => setKind('moment')} />
        </View>
        {kind === 'moment' ? (
          <View style={styles.wrap}>
            {MOMENT_LABELS.map((l) => (
              <Chip key={l} label={l} selected={momentLabel === l} onPress={() => setMomentLabel(l)} />
            ))}
          </View>
        ) : null}
      </View>

      <TextField
        label={kind === 'request' ? 'What would you like prayer for?' : 'What happened?'}
        value={body}
        onChangeText={setBody}
        multiline
        serif
        maxLength={4000}
        autoFocus
      />

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          Area of life (optional)
        </Text>
        <View style={styles.wrap}>
          {(passions ?? []).map((p) => (
            <Chip
              key={p.id}
              label={`${p.icon} ${p.label}`}
              selected={passionId === p.id}
              onPress={() => setPassionId(passionId === p.id ? null : p.id)}
            />
          ))}
        </View>
      </View>

      {photo ? (
        <View>
          <Image source={{ uri: photo.uri }} style={styles.photo} accessibilityLabel="Selected photo" />
          <Button label="Remove photo" variant="ghost" onPress={() => setPhoto(null)} />
        </View>
      ) : (
        <Pressable
          onPress={async () => setPhoto(await pickPhoto())}
          accessibilityRole="button"
          accessibilityLabel="Add a photo"
          style={[styles.addPhoto, { borderColor: colors.border }]}
        >
          <Ionicons name="image-outline" size={20} color={colors.textMuted} />
          <Text tone="muted">Add a photo</Text>
        </Pressable>
      )}

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          Who sees this
        </Text>
        <View style={styles.wrap}>
          <Chip
            label="All followers"
            icon={<Ionicons name="people-outline" size={16} color={colors.textMuted} />}
            selected={selection.audiences.includes('followers')}
            onPress={() => setSelection(toggleAudience(selection, 'followers'))}
          />
          <Chip
            label="Close friends"
            icon={<Ionicons name="lock-closed" size={15} color={colors.close} />}
            color={colors.close}
            accessibilityHint="Only people on your private close friends list will see this"
            selected={selection.audiences.includes('close_friends')}
            onPress={() => setSelection(toggleAudience(selection, 'close_friends'))}
          />
          {(groups ?? []).map((g) => (
            <Chip
              key={g.id}
              label={`${g.icon} ${g.name}`}
              selected={selection.groupIds.includes(g.id)}
              onPress={() => setSelection(toggleGroup(selection, g.id))}
            />
          ))}
          <Chip
            label="World"
            icon={<Ionicons name="globe-outline" size={16} color={colors.textMuted} />}
            accessibilityHint="Anyone on Allelon can see this"
            selected={selection.audiences.includes('world')}
            onPress={() => setSelection(toggleAudience(selection, 'world'))}
          />
        </View>

        {selection.audiences.includes('world') ? (
          <View style={[styles.worldBox, { backgroundColor: colors.surfaceRaised }]}>
            <Text variant="caption" tone="muted">
              {profile?.country_code
                ? `Shown on the globe in ${flagFor(profile.country_code)} your country. Anyone on Allelon can read and respond.`
                : 'Anyone on Allelon can read and respond. Add your country in your profile to appear on the globe.'}
            </Text>
            {canBeAnonymous(selection) ? (
              <View style={styles.switchRow}>
                <Text style={styles.flex}>Post anonymously</Text>
                <Switch
                  value={selection.anonymous}
                  onValueChange={(v) => setSelection(setAnonymous(selection, v))}
                  accessibilityLabel="Post anonymously"
                  trackColor={{ true: colors.accent }}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">
        {summary}
      </Text>
      <Button label="Share" onPress={post} loading={posting} disabled={!canPost} accessibilityHint={summary} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, paddingTop: space.lg },
  row: { flexDirection: 'row', gap: space.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md },
  addPhoto: {
    minHeight: hitSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
  },
  worldBox: { padding: space.lg, borderRadius: radius.md, gap: space.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: hitSize },
  flex: { flex: 1 },
});
