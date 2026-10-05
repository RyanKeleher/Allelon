import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';

export default function WorldTab() {
  return (
    <Screen>
      <Text variant="title" style={{ paddingTop: 16 }}>
        World
      </Text>
      <EmptyState title="Coming soon" body="The prayer globe arrives in a later phase." />
    </Screen>
  );
}
