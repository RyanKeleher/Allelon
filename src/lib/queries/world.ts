import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { invokeFunction } from '../functions';
import { supabase } from '../supabase';
import { toCard } from '../types';
import { PAGE_SIZE } from './requests';

export type CountryWithCount = { code: string; name: string; lat: number | null; lng: number | null; count: number };

/** Every country, with the number of open World requests the viewer can see. */
export function useWorldCountries() {
  return useQuery({
    queryKey: ['world', 'countries'],
    queryFn: async (): Promise<CountryWithCount[]> => {
      const [countries, counts] = await Promise.all([
        supabase.from('countries').select('code, name, lat, lng').order('name'),
        supabase.rpc('world_counts'),
      ]);
      if (countries.error) throw countries.error;
      if (counts.error) throw counts.error;
      const byCode = new Map((counts.data ?? []).map((c) => [c.country_code, c.open_requests]));
      return countries.data.map((c) => ({ ...c, count: byCode.get(c.code) ?? 0 }));
    },
  });
}

export function useCountryFeed(code: string) {
  return useInfiniteQuery({
    queryKey: ['requests', 'world', code],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('world_feed', {
        p_country: code,
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

export type Translation = { body: string; answered_update: string | null };

export function useTranslateRequest() {
  return useMutation({
    mutationFn: ({ requestId, language }: { requestId: string; language: string }) =>
      invokeFunction<Translation>('translate', { request_id: requestId, target_language: language }),
  });
}

export function useSuggestResponse() {
  return useMutation({
    mutationFn: async ({ requestId, language }: { requestId: string; language: string }) =>
      (await invokeFunction<{ suggestion: string }>('suggest-response', { request_id: requestId, language })).suggestion,
  });
}

/** "pt-BR" -> "pt" so regional variants don't trigger a translate button. */
export function baseLanguage(code: string | null | undefined): string {
  return (code ?? '').split('-')[0].toLowerCase();
}
