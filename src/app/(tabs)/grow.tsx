import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { quoted, useGrowItems, type GrowItem } from '@/lib/queries/grow';
import { hitSize, radius, space, useAppTheme } from '@/theme';

function Source({ item }: { item: GrowItem }) {
  return (
    <Pressable
      onPress={() => WebBrowser.openBrowserAsync(item.source_url)}
      accessibilityRole="link"
      accessibilityLabel={`Source: ${item.source_name}`}
      hitSlop={8}
    >
      <Text variant="caption" tone="muted">
        Source: {item.source_name}
      </Text>
    </Pressable>
  );
}

export default function GrowTab() {
  const { colors } = useAppTheme();
  const { data: items } = useGrowItems();
  const practices = (items ?? []).filter((i) => i.kind === 'practice');
  const scripture = (items ?? []).filter((i) => i.kind === 'scripture');
  const resources = (items ?? []).filter((i) => i.kind === 'link' || i.kind === 'video');
  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="title">Grow</Text>
          <Text tone="muted">Scripture, a simple practice, and trusted places to keep learning to pray.</Text>
        </View>

        {practices.map((p) => (
          <View key={p.id} style={card}>
            <Text variant="heading">{p.title}</Text>
            {p.body.split('\n').map((line) => {
              const [head, ...rest] = line.split(': ');
              return (
                <Text key={line}>
                  <Text variant="label">{head}: </Text>
                  {rest.join(': ')}
                </Text>
              );
            })}
            <Source item={p} />
          </View>
        ))}

        <Text variant="heading" style={styles.section}>
          Scripture on prayer
        </Text>
        {scripture.map((v) => (
          <View key={v.id} style={card}>
            <Text variant="label" tone="accent">
              {v.title}
            </Text>
            <Text variant="prayer">{quoted(v.body)}</Text>
            <Text variant="caption" tone="muted">
              {v.reference}
            </Text>
            <Source item={v} />
          </View>
        ))}

        <Text variant="heading" style={styles.section}>
          Keep learning
        </Text>
        {resources.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => WebBrowser.openBrowserAsync(r.source_url)}
            accessibilityRole="link"
            accessibilityLabel={`${r.title}. ${r.body}`}
            style={[card, styles.link]}
          >
            <Ionicons name={r.kind === 'video' ? 'play-circle-outline' : 'open-outline'} size={22} color={colors.accent} />
            <View style={styles.flex}>
              <Text variant="label">{r.title}</Text>
              <Text tone="muted">{r.body}</Text>
              <Text variant="caption" tone="muted">
                {r.source_name}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },
  header: { gap: space.xs, paddingTop: space.lg },
  section: { paddingTop: space.lg },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, gap: space.sm },
  link: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, minHeight: hitSize },
});
