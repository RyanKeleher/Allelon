import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { appleSignInAvailable, googleSignInEnabled, signInWithApple, signInWithGoogle } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';
import { radius, space, useAppTheme } from '@/theme';

export default function SignIn() {
  const { colors, scheme } = useAppTheme();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [apple, setApple] = useState(false);

  useEffect(() => {
    appleSignInAvailable().then(setApple);
  }, []);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      const err = e as { code?: string; message?: string };
      // Cancelling a native sheet is not an error worth showing.
      if (err.code !== 'ERR_REQUEST_CANCELED' && err.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Could not sign in', err.message ?? 'Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      const address = email.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithOtp({ email: address });
      if (error) throw error;
      setSentTo(address);
    });

  const verify = () =>
    run(async () => {
      const { error } = await supabase.auth.verifyOtp({ email: sentTo!, token: code.trim(), type: 'email' });
      if (error) throw error;
    });

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Text variant="title" style={styles.wordmark}>
          Allelon
        </Text>
        <Text variant="prayer" tone="muted" style={styles.center}>
          Pray for one another, and see what God does.
        </Text>
      </View>

      {sentTo ? (
        <View style={styles.form}>
          <Text tone="muted">We sent a 6-digit code to {sentTo}.</Text>
          <TextField
            label="Code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
          />
          <Button label="Continue" onPress={verify} loading={busy} disabled={code.trim().length < 6} />
          <Button label="Use a different email" variant="ghost" onPress={() => { setSentTo(null); setCode(''); }} />
        </View>
      ) : (
        <View style={styles.form}>
          {apple ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={
                scheme === 'dark'
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={radius.pill}
              style={styles.apple}
              onPress={() => run(signInWithApple)}
            />
          ) : null}
          {googleSignInEnabled ? (
            <Button label="Continue with Google" variant="secondary" onPress={() => run(signInWithGoogle)} disabled={busy} />
          ) : null}
          {apple || googleSignInEnabled ? (
            <View style={styles.divider}>
              <View style={[styles.rule, { backgroundColor: colors.border }]} />
              <Text variant="caption" tone="muted">
                or
              </Text>
              <View style={[styles.rule, { backgroundColor: colors.border }]} />
            </View>
          ) : null}
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@example.com"
          />
          <Button label="Email me a code" onPress={sendCode} loading={busy} disabled={!/^\S+@\S+\.\S+$/.test(email.trim())} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: space.xxl * 2, paddingBottom: space.xxl, alignItems: 'center', gap: space.md },
  wordmark: { fontSize: 44, lineHeight: 52 },
  center: { textAlign: 'center' },
  form: { gap: space.lg },
  apple: { height: 50, width: '100%' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
});
