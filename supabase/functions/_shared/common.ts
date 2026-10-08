// Shared helpers for Allelon's Edge Functions.
import Anthropic from '@anthropic-ai/sdk';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** A Supabase client acting as the caller (RLS applies) and their user id. */
export async function callerClient(req: Request): Promise<{ supabase: SupabaseClient; userId: string }> {
  const authorization = req.headers.get('Authorization');
  if (!authorization) throw new HttpError(401, 'Sign in required.');
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new HttpError(401, 'Sign in required.');
  return { supabase, userId: data.user.id };
}

/** Service-role client for writes clients may not make (cache, usage log). */
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

/** Records one AI call and refuses if the person is over their daily limit. */
export async function enforceDailyLimit(admin: SupabaseClient, userId: string, kind: 'translate' | 'suggest', limit: number) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', kind)
    .gte('created_at', since);
  if (error) throw error;
  if ((count ?? 0) >= limit) throw new HttpError(429, 'Daily limit reached. Please try again tomorrow.');
  const { error: insertError } = await admin.from('ai_usage').insert({ user_id: userId, kind });
  if (insertError) throw insertError;
}

export function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

// Model choice lives in one env var so it can be changed without a deploy of
// new code (e.g. ALLELON_AI_MODEL=claude-haiku-5-5 to lower cost).
export const MODEL = Deno.env.get('ALLELON_AI_MODEL') ?? 'claude-opus-5-5';
const SUPPORTS_DEFAULT_FALLBACKS = new Set(['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5']);

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
  // Only set for local testing against a stub server.
  baseURL: Deno.env.get('ANTHROPIC_BASE_URL') || undefined,
});

type AskOptions = {
  system: string;
  user: string;
  maxTokens: number;
  schema?: Record<string, unknown>;
};

/**
 * One Claude call. Thinking stays on at low effort (these are short, simple
 * tasks); on a policy decline the request falls back server-side; if the whole
 * chain declines, the caller gets a 422 instead of a partial answer.
 */
export async function askClaude({ system, user, maxTokens, schema }: AskOptions): Promise<string> {
  const params: Record<string, unknown> = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { effort: 'low', ...(schema ? { format: { type: 'json_schema', schema } } : {}) },
  };
  if (SUPPORTS_DEFAULT_FALLBACKS.has(MODEL)) {
    params.betas = ['server-side-fallback-2026-07-01'];
    params.fallbacks = 'default';
  }

  let response;
  try {
    // deno-lint-ignore no-explicit-any
    response = await anthropic.beta.messages.create(params as any);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) throw new HttpError(503, 'The assistant is busy. Please try again shortly.');
    if (e instanceof Anthropic.AuthenticationError) throw new HttpError(500, 'The assistant is not configured.');
    if (e instanceof Anthropic.APIError) throw new HttpError(502, 'The assistant is unavailable right now.');
    throw e;
  }

  if (response.stop_reason === 'refusal') {
    throw new HttpError(422, 'This could not be processed.');
  }
  const text = response.content
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('')
    .trim();
  if (!text) throw new HttpError(502, 'The assistant returned nothing.');
  return text;
}

export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: 'Something went wrong.' }, 500);
    }
  };
}
