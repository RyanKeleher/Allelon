import type { ConfigContext, ExpoConfig } from 'expo/config';

// Native Google Sign-In needs the reversed iOS client ID as a URL scheme at
// build time. Leave GOOGLE_IOS_URL_SCHEME unset to build without Google.
const googleIosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Allelon',
  slug: 'allelon',
  scheme: 'allelon',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'app.allelon',
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'Allelon lets you attach a photo to a prayer request.',
      NSCameraUsageDescription: 'Allelon lets you take a photo to attach to a prayer request.',
    },
  },
  android: {
    package: 'app.allelon',
    adaptiveIcon: {
      backgroundColor: '#0B1825',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-apple-authentication',
    'expo-image',
    'expo-font',
    'expo-web-browser',
    'expo-localization',
    [
      'expo-splash-screen',
      { backgroundColor: '#FAF6EF', dark: { backgroundColor: '#0B1825' } },
    ],
    [
      'expo-image-picker',
      { photosPermission: 'Allelon lets you attach a photo to a prayer request.' },
    ],
    ...(googleIosUrlScheme
      ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [string, object]]
      : []),
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    googleSignInEnabled: Boolean(googleIosUrlScheme),
  },
});
