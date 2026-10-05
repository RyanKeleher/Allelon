import { useQuery } from '@tanstack/react-query';

import { supabase } from '../supabase';

export function usePassions() {
  return useQuery({
    queryKey: ['passions'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('passions').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('countries').select('code, name').order('name');
      if (error) throw error;
      return data;
    },
  });
}

/** Regional-indicator emoji flag for an ISO 3166 alpha-2 code. */
export function flagFor(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

export function useMyGroups() {
  return useQuery({
    queryKey: ['groups', 'mine'],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('id, name, icon').order('name');
      if (error) throw error;
      return data;
    },
  });
}
