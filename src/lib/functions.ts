import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from './supabase';

/** Calls an Edge Function and surfaces its { error } message on failure. */
export async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? 'Something went wrong. Please try again.');
    }
    throw new Error('Could not reach Allelon. Check your connection and try again.');
  }
  return data as T;
}
