import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { invokeFunction } from '../functions';
import { supabase } from '../supabase';
import type { PersonSummary } from './people';

export type ReportTarget = 'request' | 'response' | 'profile';
export type ReportReason = 'spam' | 'harassment' | 'hate' | 'self_harm' | 'sexual' | 'other';

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'harassment', label: 'Harassment or bullying' },
  { key: 'hate', label: 'Hateful content' },
  { key: 'sexual', label: 'Sexual content' },
  { key: 'spam', label: 'Spam or scam' },
  { key: 'self_harm', label: 'Someone may be at risk' },
  { key: 'other', label: 'Something else' },
];

export function useReport() {
  return useMutation({
    mutationFn: async (input: { targetType: ReportTarget; targetId: string; reason: ReportReason; details?: string }) => {
      const { error } = await supabase.from('reports').insert({
        target_type: input.targetType,
        target_id: input.targetId,
        reason: input.reason,
        details: input.details ?? '',
      });
      // Reporting the same thing twice is fine; the first report stands.
      if (error && error.code !== '23505') throw error;
    },
  });
}

export function useBlockedPeople() {
  return useQuery({
    queryKey: ['blocks'],
    queryFn: async (): Promise<PersonSummary[]> => {
      const { data, error } = await supabase
        .from('blocks')
        .select('person:profiles!blocks_blocked_id_fkey(id, display_name, handle, avatar_url)');
      if (error) throw error;
      return (data as unknown as { person: PersonSummary }[]).map((b) => b.person).filter(Boolean);
    },
  });
}

export function useBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, block }: { userId: string; block: boolean }) => {
      const { error } = block
        ? await supabase.from('blocks').insert({ blocked_id: userId })
        : await supabase.from('blocks').delete().eq('blocked_id', userId);
      if (error && error.code !== '23505') throw error;
    },
    // Blocking changes what is visible almost everywhere.
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await invokeFunction<{ deleted: boolean }>('delete-account', {});
      await supabase.auth.signOut();
    },
  });
}

export type QueueItem = {
  report_id: number;
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  details: string | null;
  report_count: number;
  content: string | null;
  content_author: string | null;
  created_at: string;
};

export function useModerationQueue(enabled: boolean) {
  return useQuery({
    queryKey: ['moderation'],
    enabled,
    queryFn: async (): Promise<QueueItem[]> => {
      const { data, error } = await supabase.rpc('moderation_queue');
      if (error) throw error;
      return (data ?? []) as QueueItem[];
    },
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { targetType: ReportTarget; targetId: string; action: 'hide' | 'dismiss' }) => {
      const { error } = await supabase.rpc('resolve_report', {
        p_target_type: input.targetType,
        p_target_id: input.targetId,
        p_action: input.action,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moderation'] }),
  });
}
