// Web build: push notifications are phone-only, so these are no-ops.
export type PushResult = { ok: true } | { ok: false; reason: string };

export async function enablePush(): Promise<PushResult> {
  return { ok: false, reason: 'Notifications are only available in the phone app.' };
}

export function useNotificationTaps() {}
