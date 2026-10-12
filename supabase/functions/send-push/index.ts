// Delivers queued notifications as push messages through Expo's push service.
// Called every minute by the database (pg_cron + pg_net) with the service key.
//
// Privacy: push messages never include prayer text. Lock screens are public,
// so a message only says who did what ("Ann responded to your request").
import { handle, HttpError, json, serviceClient } from '../_shared/common.ts';

type Row = {
  id: number;
  user_id: string;
  kind: 'answered' | 'response' | 'checkin' | 'follow_request' | 'join_request';
  request_id: string | null;
  group_id: string | null;
  actor: { display_name: string } | null;
  group: { name: string } | null;
};

function firstName(row: Row): string | null {
  return row.actor?.display_name?.split(' ')[0] || null;
}

function message(row: Row): { title: string; body: string } {
  const who = firstName(row);
  switch (row.kind) {
    case 'answered':
      return { title: 'A prayer was answered', body: `${who ?? 'Someone'} shared how God answered a prayer you prayed for.` };
    case 'response':
      return { title: 'New response', body: `${who ?? 'Someone'} responded to your request.` };
    case 'checkin':
      return who
        ? { title: `Check in with ${who}?`, body: `You prayed for ${who} a few days ago. A short note can mean a lot.` }
        : { title: 'Keep praying', body: 'A few days ago you prayed for someone. Take a moment to pray again.' };
    case 'follow_request':
      return { title: 'Follow request', body: `${who ?? 'Someone'} asked to follow you.` };
    case 'join_request':
      return { title: 'Someone wants to join', body: `${who ?? 'Someone'} asked to join ${row.group?.name ?? 'your group'}.` };
  }
}

Deno.serve(
  handle(async (req) => {
    if (req.headers.get('Authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
      throw new HttpError(401, 'Not allowed.');
    }
    const admin = serviceClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await admin
      .from('notifications')
      .select('id, user_id, kind, request_id, group_id, actor:profiles!notifications_actor_id_fkey(display_name), group:groups(name)')
      .is('pushed_at', null)
      .gte('created_at', since)
      .order('created_at')
      .limit(500);
    if (error) throw error;
    if (!rows?.length) return json({ sent: 0 });
    const notes = rows as unknown as Row[];

    const userIds = [...new Set(notes.map((n) => n.user_id))];
    const [{ data: tokens, error: tokenError }, { data: prefs, error: prefsError }] = await Promise.all([
      admin.from('push_tokens').select('token, user_id').in('user_id', userIds),
      admin.from('profiles').select('id, push_enabled').in('id', userIds),
    ]);
    if (tokenError) throw tokenError;
    if (prefsError) throw prefsError;
    const wantsPush = new Set((prefs ?? []).filter((p) => p.push_enabled).map((p) => p.id));

    const messages = notes.flatMap((n) => {
      if (!wantsPush.has(n.user_id)) return [];
      const { title, body } = message(n);
      return (tokens ?? [])
        .filter((t) => t.user_id === n.user_id)
        .map((t) => ({
          to: t.token,
          title,
          body,
          sound: 'default',
          data: { notificationId: n.id, kind: n.kind, requestId: n.request_id, groupId: n.group_id },
        }));
    });

    const deadTokens: string[] = [];
    const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      const res = await fetch(Deno.env.get('EXPO_PUSH_URL') ?? 'https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        console.error('Expo push failed', res.status, await res.text());
        continue;
      }
      const { data: tickets } = await res.json();
      (tickets ?? []).forEach((ticket: { status: string; details?: { error?: string } }, j: number) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') deadTokens.push(batch[j].to);
      });
    }

    const dead = [...new Set(deadTokens)];
    if (dead.length) await admin.from('push_tokens').delete().in('token', dead);
    await admin.from('notifications').update({ pushed_at: new Date().toISOString() }).in('id', notes.map((n) => n.id));
    return json({ notifications: notes.length, sent: messages.length, removedTokens: dead.length }, 200);
  }),
);

