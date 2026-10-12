import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type PushResult = { ok: true } | { ok: false; reason: string };

/**
 * Asks for permission (only when the person turns notifications on, never on
 * launch) and saves this device's Expo push token to their account.
 */
export async function enablePush(): Promise<PushResult> {
  if (Platform.OS === 'web') return { ok: false, reason: 'Notifications are only available in the phone app.' };
  if (!Device.isDevice) return { ok: false, reason: 'Notifications need a real phone, not a simulator.' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Allelon',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const status = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!status.granted) {
    return { ok: false, reason: 'Notifications are turned off for Allelon in your phone’s Settings.' };
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    return { ok: false, reason: 'Push notifications need the app to be set up with EAS first (see README).' };
  }
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/** Opens the right screen when someone taps a notification. */
export function useNotificationTaps() {
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const data = last?.notification.request.content.data as
      | { kind?: string; requestId?: string | null; groupId?: string | null }
      | undefined;
    if (!data) return;
    if (data.requestId) router.push({ pathname: '/request/[id]', params: { id: data.requestId } });
    else if (data.kind === 'follow_request') router.push('/follow-requests');
    else if (data.groupId) router.push({ pathname: '/group/[id]/members', params: { id: data.groupId } });
    else router.push('/notifications');
  }, [last]);
}
