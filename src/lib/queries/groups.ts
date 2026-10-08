import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '../supabase';
import { toCard } from '../types';
import type { PersonSummary } from './people';
import { PAGE_SIZE } from './requests';

const PERSON = 'id, display_name, handle, avatar_url';

export type GroupRole = 'admin' | 'member';
export type GroupSummary = { id: string; name: string; icon: string; description: string };
export type GroupMember = { user_id: string; role: GroupRole; joined_at: string; person: PersonSummary };
export type JoinRequest = { group_id: string; user_id: string; created_at: string; person: PersonSummary };

export const groupKeys = {
  all: ['groups'] as const,
  mine: () => [...groupKeys.all, 'mine'] as const,
  detail: (id: string) => [...groupKeys.all, 'detail', id] as const,
  members: (id: string) => [...groupKeys.all, 'members', id] as const,
  feed: (id: string) => [...groupKeys.all, 'feed', id] as const,
  invite: (id: string) => [...groupKeys.all, 'invite', id] as const,
  joinRequests: () => [...groupKeys.all, 'join-requests'] as const,
  preview: (code: string) => [...groupKeys.all, 'preview', code] as const,
};

/** Groups I belong to (RLS only returns groups where I'm a member). */
export function useMyGroups() {
  return useQuery({
    queryKey: groupKeys.mine(),
    queryFn: async (): Promise<GroupSummary[]> => {
      const { data, error } = await supabase.from('groups').select('id, name, icon, description').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: async (): Promise<GroupSummary | null> => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, icon, description')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useGroupMembers(id: string) {
  return useQuery({
    queryKey: groupKeys.members(id),
    queryFn: async (): Promise<GroupMember[]> => {
      const { data, error } = await supabase
        .from('group_members')
        .select(`user_id, role, joined_at, person:profiles(${PERSON})`)
        .eq('group_id', id)
        .order('joined_at');
      if (error) throw error;
      return (data as unknown as GroupMember[]).filter((m) => m.person);
    },
  });
}

export function useGroupFeed(id: string) {
  return useInfiniteQuery({
    queryKey: groupKeys.feed(id),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('group_feed', {
        p_group_id: id,
        p_before: pageParam ?? undefined,
        p_limit: PAGE_SIZE,
      });
      if (error) throw error;
      return (data ?? []).map(toCard);
    },
    getNextPageParam: (lastPage) =>
      lastPage.length < PAGE_SIZE ? undefined : lastPage[lastPage.length - 1].created_at,
  });
}

/**
 * Live updates for a group screen. A new request shared to the group arrives
 * as a prayer_audiences insert; responses arrive as responses changes. Realtime
 * applies RLS, so only rows this person could read are ever delivered.
 */
export function useGroupRealtime(groupId: string, isAdmin: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    const refreshFeed = () => qc.invalidateQueries({ queryKey: groupKeys.feed(groupId) });
    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prayer_audiences', filter: `group_id=eq.${groupId}` },
        refreshFeed,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' }, refreshFeed);
    if (isAdmin) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_join_requests', filter: `group_id=eq.${groupId}` },
        () => qc.invalidateQueries({ queryKey: groupKeys.joinRequests() }),
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, isAdmin, qc]);
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; icon: string; description: string }) => {
      const { data, error } = await supabase.rpc('create_group', {
        p_name: input.name,
        p_icon: input.icon,
        p_description: input.description,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.mine() }),
  });
}

export function useUpdateGroup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; icon: string; description: string }) => {
      const { error } = await supabase.rpc('update_group', {
        p_group_id: id,
        p_name: input.name,
        p_icon: input.icon,
        p_description: input.description,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.all }),
  });
}

/** The group's invite code (admins only). Creates one on first use. */
export function useInviteCode(id: string, enabled: boolean) {
  return useQuery({
    queryKey: groupKeys.invite(id),
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('group_invite_code', { p_group_id: id });
      if (error) throw error;
      return data;
    },
  });
}

export function useResetInviteCode(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('reset_group_invite_code', { p_group_id: id });
      if (error) throw error;
      return data;
    },
    onSuccess: (code) => qc.setQueryData(groupKeys.invite(id), code),
  });
}

export type InvitePreview = {
  group_id: string;
  name: string;
  icon: string;
  description: string;
  member_count: number;
  is_member: boolean;
  has_pending_request: boolean;
};

export function useInvitePreview(code: string) {
  return useQuery({
    queryKey: groupKeys.preview(code.toUpperCase()),
    enabled: code.trim().length > 0,
    queryFn: async (): Promise<InvitePreview | null> => {
      const { data, error } = await supabase.rpc('group_for_invite', { p_code: code });
      if (error) throw error;
      return (data?.[0] as InvitePreview | undefined) ?? null;
    },
  });
}

export function useRequestToJoin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.rpc('request_to_join_group', { p_code: code });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.all }),
  });
}

export function useCancelJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.rpc('cancel_join_request', { p_group_id: groupId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.all }),
  });
}

/**
 * Pending join requests visible to me: requests to groups I admin, plus my own
 * outgoing ones (filter by user_id to tell them apart).
 */
export function useJoinRequests() {
  return useQuery({
    queryKey: groupKeys.joinRequests(),
    queryFn: async (): Promise<JoinRequest[]> => {
      const { data, error } = await supabase
        .from('group_join_requests')
        .select(`group_id, user_id, created_at, person:profiles(${PERSON})`)
        .order('created_at');
      if (error) throw error;
      return (data as unknown as JoinRequest[]).filter((r) => r.person);
    },
  });
}

export function useRespondToJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { groupId: string; userId: string; approve: boolean }) => {
      const { error } = await supabase.rpc('respond_to_join_request', {
        p_group_id: input.groupId,
        p_user_id: input.userId,
        p_approve: input.approve,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.all }),
  });
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('remove_group_member', { p_group_id: groupId, p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.members(groupId) }),
  });
}

export function useSetMemberRole(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; role: GroupRole }) => {
      const { error } = await supabase.rpc('set_group_member_role', {
        p_group_id: groupId,
        p_user_id: input.userId,
        p_role: input.role,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.members(groupId) }),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      qc.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}
