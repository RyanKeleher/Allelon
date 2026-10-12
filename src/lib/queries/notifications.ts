import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../supabase';

export type NotificationKind = 'answered' | 'response' | 'checkin' | 'follow_request' | 'join_request';

export type AppNotification = {
  id: number;
  kind: NotificationKind;
  request_id: string | null;
  group_id: string | null;
  created_at: string;
  read_at: string | null;
  actor: { id: string; display_name: string; avatar_url: string | null } | null;
  group: { name: string } | null;
};

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    refetchInterval: 60_000,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, kind, request_id, group_id, created_at, read_at, actor:profiles!notifications_actor_id_fkey(id, display_name, avatar_url), group:groups(name)',
        )
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as AppNotification[];
    },
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: number[]) => {
      let q = supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
      if (ids) q = q.in('id', ids);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

/** What a notification says, without quoting anyone's prayer text. */
export function describeNotification(n: AppNotification): string {
  const who = n.actor?.display_name ?? 'Someone';
  switch (n.kind) {
    case 'answered':
      return `${who === 'Someone' ? 'A request' : `${who}’s request`} you prayed for was answered.`;
    case 'response':
      return `${who} responded to your request.`;
    case 'checkin':
      return n.actor
        ? `You prayed for ${who} a few days ago. Check in with them?`
        : 'You prayed for someone a few days ago. Pray for them again?';
    case 'follow_request':
      return `${who} asked to follow you.`;
    case 'join_request':
      return `${who} asked to join ${n.group?.name ?? 'your group'}.`;
  }
}
