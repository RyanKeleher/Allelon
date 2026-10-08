import { Alert, Platform } from 'react-native';

// React Native's Alert does nothing on web, so the browser preview falls back
// to the browser's own dialogs.

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/** Asks for confirmation; resolves true if the person confirmed. */
export function confirm(
  title: string,
  message: string | undefined,
  confirmLabel: string,
  { destructive = false, cancelLabel = 'Cancel' }: { destructive?: boolean; cancelLabel?: string } = {},
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

export function errorMessage(e: unknown): string {
  return (e as { message?: string })?.message ?? 'Please try again.';
}

export type Choice<K extends string> = { key: K; label: string; destructive?: boolean };

/**
 * Lets the person pick one action (or cancel). Native shows an action alert;
 * web asks about each option in turn.
 */
export function choose<K extends string>(title: string, message: string | undefined, choices: Choice<K>[]): Promise<K | null> {
  if (Platform.OS === 'web') {
    for (const c of choices) {
      if (window.confirm(`${title}\n\n${c.label}?`)) return Promise.resolve(c.key);
    }
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        ...choices.map((c) => ({
          text: c.label,
          style: c.destructive ? ('destructive' as const) : ('default' as const),
          onPress: () => resolve(c.key),
        })),
        { text: 'Cancel', style: 'cancel' as const, onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
