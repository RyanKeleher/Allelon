import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';

export default function GrowTab() {
  return (
    <Screen>
      <Text variant="title" style={{ paddingTop: 16 }}>
        Grow
      </Text>
      <EmptyState title="Coming soon" body="Scripture, guided practice, and trusted resources arrive in a later phase." />
    </Screen>
  );
}
