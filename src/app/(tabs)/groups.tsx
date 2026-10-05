import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';

export default function GroupsTab() {
  return (
    <Screen>
      <Text variant="title" style={{ paddingTop: 16 }}>
        Groups
      </Text>
      <EmptyState title="Coming soon" body="Prayer groups arrive in the next phase: shared lists for your Bible study, team, or family." />
    </Screen>
  );
}
