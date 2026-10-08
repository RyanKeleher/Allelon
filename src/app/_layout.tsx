import { CormorantGaramond_500Medium, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth, useMyProfile } from '@/lib/auth';
import { AppThemeProvider, fonts, useAppTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppThemeProvider>{fontsLoaded ? <RootNavigator /> : null}</AppThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const profile = useMyProfile();
  const { colors, scheme } = useAppTheme();

  const signedIn = Boolean(session);
  const onboarded = Boolean(profile.data?.onboarded_at);
  const ready = !loading && (!signedIn || !profile.isPending);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.sansBold },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="compose" options={{ presentation: 'modal', title: 'Share' }} />
          <Stack.Screen name="request/[id]" options={{ title: '' }} />
          <Stack.Screen name="profile/[id]" options={{ title: '' }} />
          <Stack.Screen name="people" options={{ title: 'Find people' }} />
          <Stack.Screen name="follow-requests" options={{ title: 'Follow requests' }} />
          <Stack.Screen name="connections" options={{ title: 'Followers & following' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="close-friends" options={{ title: 'Close friends' }} />
          <Stack.Screen name="group/new" options={{ presentation: 'modal', title: 'New group' }} />
          <Stack.Screen name="group/[id]/index" options={{ title: '' }} />
          <Stack.Screen name="group/[id]/members" options={{ title: 'Members' }} />
          <Stack.Screen name="join/[code]" options={{ title: 'Join group' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
