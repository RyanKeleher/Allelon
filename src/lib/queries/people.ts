import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../supabase';
import type { Profile } from '../types';

export type PersonSummary = Pick<Profile, 'id' | 'display_name' | 'handle' | 'avatar_url'>;
const PERSON = 'id, display_name, handle, avatar_url';

export type FollowState = 'none' | 'pending' | 'following';

export const peopleKeys = {
  profile: (id: string) => ['profile', id] as const,
  followState: (id: string) => ['follows', 'state', id] as const,
  followers: () => ['follows', 'followers'] as const,
  following: () => ['follows', 'following'] as const,
  requests: () => ['follows', 'requests'] as const,
  search: (q: string) => ['people', 'search', q] as const,
};

export function useProfile(id: string) {
  return useQuery({
    queryKey: peopleKeys.profile(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSearchPeople(query: string, myId: string) {
  const q = query.trim().replace(/[%_,()]/g, '');
  return useQuery({
    queryKey: peopleKeys.search(q),
    enabled: q.length >= 2,
    queryFn: async (): Promise<PersonSummary[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PERSON)
        .or(`handle.ilike.${q}%,display_name.ilike.%${q}%`)
        .neq('id', myId)
        .not('onboarded_at', 'is', null)
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

/** My relationship to another person: have I asked to follow, and were they accepted? */
export function useFollowState(myId: string, otherId: string) {
  return useQuery({
    queryKey: peopleKeys.followState(otherId),
    queryFn: async (): Promise<{ outgoing: FollowState; followsMe: boolean }> => {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id, followee_id, status')
        .or(
          `and(follower_id.eq.${myId},followee_id.eq.${otherId}),and(follower_id.eq.${otherId},followee_id.eq.${myId})`,
        );
      if (error) throw error;
      const mine = data.find((f) => f.follower_id === myId);
      const theirs = data.find((f) => f.follower_id === otherId);
      return {
        outgoing: !mine ? 'none' : mine.status === 'accepted' ? 'following' : 'pending',
        followsMe: theirs?.status === 'accepted',
      };
    },
  });
}

function useInvalidateFollows() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['follows'] });
    qc.invalidateQueries({ queryKey: ['requests'] });
  };
}

export function useFollow() {
  const invalidate = useInvalidateFollows();
  return useMutation({
    mutationFn: async (followeeId: string) => {
      const { error } = await supabase.from('follows').insert({ followee_id: followeeId });
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: invalidate,
  });
}

/** Unfollow, cancel a pending request, decline a request, or remove a follower. */
export function useRemoveFollow() {
  const invalidate = useInvalidateFollows();
  return useMutation({
    mutationFn: async ({ followerId, followeeId }: { followerId: string; followeeId: string }) => {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('followee_id', followeeId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useAcceptFollow(myId: string) {
  const invalidate = useInvalidateFollows();
  return useMutation({
    mutationFn: async (followerId: string) => {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('follower_id', followerId)
        .eq('followee_id', myId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

type Edge = { status: 'pending' | 'accepted'; person: PersonSummary };

export function useFollowRequests(myId: string) {
  return useQuery({
    queryKey: peopleKeys.requests(),
    queryFn: async (): Promise<PersonSummary[]> => {
      const { data, error } = await supabase
        .from('follows')
        .select(`status, person:profiles!follows_follower_id_fkey(${PERSON})`)
        .eq('followee_id', myId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as Edge[]).map((e) => e.person).filter(Boolean);
    },
  });
}

export function useFollowers(myId: string) {
  return useQuery({
    queryKey: peopleKeys.followers(),
    queryFn: async (): Promise<PersonSummary[]> => {
      const { data, error } = await supabase
        .from('follows')
        .select(`status, person:profiles!follows_follower_id_fkey(${PERSON})`)
        .eq('followee_id', myId)
        .eq('status', 'accepted');
      if (error) throw error;
      return (data as unknown as Edge[]).map((e) => e.person).filter(Boolean);
    },
  });
}

export function useFollowing(myId: string) {
  return useQuery({
    queryKey: peopleKeys.following(),
    queryFn: async (): Promise<(PersonSummary & { pending: boolean })[]> => {
      const { data, error } = await supabase
        .from('follows')
        .select(`status, person:profiles!follows_followee_id_fkey(${PERSON})`)
        .eq('follower_id', myId);
      if (error) throw error;
      return (data as unknown as Edge[])
        .filter((e) => e.person)
        .map((e) => ({ ...e.person, pending: e.status === 'pending' }));
    },
  });
}

export function useUpdateProfile(myId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      patch: Partial<Pick<Profile, 'display_name' | 'handle' | 'bio' | 'country_code' | 'preferred_language' | 'onboarded_at' | 'avatar_url'>>,
    ) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', myId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', myId] }),
  });
}
