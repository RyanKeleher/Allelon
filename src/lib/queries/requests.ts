import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';

import { supabase } from '../supabase';
import { toCard, type AudienceChoice, type RequestCard, type RequestKind } from '../types';

export const PAGE_SIZE = 20;

export const requestKeys = {
  all: ['requests'] as const,
  home: () => [...requestKeys.all, 'home'] as const,
  detail: (id: string) => [...requestKeys.all, 'detail', id] as const,
  byAuthor: (authorId: string) => [...requestKeys.all, 'author', authorId] as const,
  mine: () => [...requestKeys.all, 'mine'] as const,
  responses: (id: string) => ['responses', id] as const,
};

/**
 * Home feed. Pages are fetched only when the reader asks for more (a button at
 * the end of the list), never automatically on scroll.
 */
export function useHomeFeed() {
  return useInfiniteQuery({
    queryKey: requestKeys.home(),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('home_feed', {
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

export function useRequest(id: string) {
  return useQuery({
    queryKey: requestKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('request_cards').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? toCard(data) : null;
    },
  });
}

/** A person's requests that the viewer is allowed to see (RLS decides). */
export function useRequestsByAuthor(authorId: string) {
  return useQuery({
    queryKey: requestKeys.byAuthor(authorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('request_cards')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map(toCard);
    },
  });
}

/** My own requests, including anonymous World posts. */
export function useMyRequests() {
  return useQuery({
    queryKey: requestKeys.mine(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('request_cards')
        .select('*')
        .eq('is_mine', true)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map(toCard);
    },
  });
}

// Apply a change to one request wherever it is cached.
function updateCachedCard(qc: QueryClient, id: string, update: (card: RequestCard) => RequestCard) {
  qc.setQueriesData<InfiniteData<RequestCard[]>>({ queryKey: requestKeys.home() }, (data) =>
    data ? { ...data, pages: data.pages.map((p) => p.map((c) => (c.id === id ? update(c) : c))) } : data,
  );
  qc.setQueryData<RequestCard | null>(requestKeys.detail(id), (c) => (c ? update(c) : c));
  qc.setQueriesData<RequestCard[]>({ queryKey: [...requestKeys.all, 'author'] }, (list) =>
    list?.map((c) => (c.id === id ? update(c) : c)),
  );
  qc.setQueryData<RequestCard[]>(requestKeys.mine(), (list) =>
    list?.map((c) => (c.id === id ? update(c) : c)),
  );
}

/** "I prayed". Idempotent per day: a repeat tap the same day is a no-op. */
export function usePray() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.from('prayers').insert({ request_id: requestId });
      if (error && error.code !== '23505') throw error;
    },
    onMutate: (requestId) => {
      updateCachedCard(qc, requestId, (c) => ({
        ...c,
        prayed_by_me: true,
        prayer_count: c.is_mine && !c.prayed_by_me ? (c.prayer_count ?? 0) + 1 : c.prayer_count,
      }));
    },
    onError: (_err, requestId) => {
      qc.invalidateQueries({ queryKey: requestKeys.detail(requestId) });
      qc.invalidateQueries({ queryKey: requestKeys.home() });
    },
  });
}

export type ResponseRow = {
  id: string;
  request_id: string;
  author_id: string;
  body: string;
  is_private: boolean;
  created_at: string;
  author: { id: string; display_name: string; handle: string | null; avatar_url: string | null } | null;
};

export function useResponses(requestId: string) {
  return useQuery({
    queryKey: requestKeys.responses(requestId),
    queryFn: async (): Promise<ResponseRow[]> => {
      const { data, error } = await supabase
        .from('responses')
        .select('id, request_id, author_id, body, is_private, created_at, author:profiles(id, display_name, handle, avatar_url)')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ResponseRow[];
    },
  });
}

export function useRespond(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, isPrivate }: { body: string; isPrivate: boolean }) => {
      const { error } = await supabase
        .from('responses')
        .insert({ request_id: requestId, body: body.trim(), is_private: isPrivate });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.responses(requestId) });
      updateCachedCard(qc, requestId, (c) => ({ ...c, response_count: (c.response_count ?? 0) + 1 }));
    },
  });
}

export type NewRequest = {
  body: string;
  kind: RequestKind;
  momentLabel?: string | null;
  passionId?: string | null;
  audiences: AudienceChoice[];
  groupIds: string[];
  photoPath?: string | null;
  isAnonymous?: boolean;
  countryCode?: string | null;
};

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewRequest) => {
      const { data, error } = await supabase.rpc('create_prayer_request', {
        p_body: input.body,
        p_kind: input.kind,
        p_moment_label: input.momentLabel ?? undefined,
        p_passion_id: input.passionId ?? undefined,
        p_audiences: input.audiences,
        p_group_ids: input.groupIds,
        p_photo_path: input.photoPath ?? undefined,
        p_is_anonymous: input.isAnonymous ?? false,
        p_country_code: input.countryCode ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all });
    },
  });
}

export function useDeleteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prayer_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: requestKeys.all }),
  });
}

/** Their requests I've prayed for: the "prayed through together" thread. */
export function usePrayedTogether(personId: string) {
  return useQuery({
    queryKey: [...requestKeys.all, 'together', personId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('prayed_together', { p_person: personId });
      if (error) throw error;
      return (data ?? []).map(toCard);
    },
  });
}
