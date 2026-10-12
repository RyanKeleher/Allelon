import { useQuery } from '@tanstack/react-query';

import { supabase } from '../supabase';

export type GrowItem = {
  id: string;
  kind: 'scripture' | 'practice' | 'link' | 'video';
  title: string;
  body: string;
  reference: string | null;
  source_name: string;
  source_url: string;
  sort_order: number;
};

export function useGrowItems() {
  return useQuery({
    queryKey: ['grow'],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<GrowItem[]> => {
      const { data, error } = await supabase.from('grow_items').select('*').order('sort_order');
      if (error) throw error;
      return data as GrowItem[];
    },
  });
}

/** The same verse for everyone on a given day, cycling through the list. */
export function verseOfTheDay(items: GrowItem[] | undefined, today = new Date()): GrowItem | null {
  const verses = (items ?? []).filter((i) => i.kind === 'scripture');
  if (!verses.length) return null;
  const day = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86_400_000);
  return verses[day % verses.length];
}

/** Wraps scripture in quotation marks unless the text already opens with one. */
export function quoted(text: string): string {
  return /^[“"‘']/.test(text) ? text : `“${text}”`;
}
