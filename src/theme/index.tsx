import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { dark, light, type Palette } from './tokens';

export * from './tokens';

/** Light is the default look; people can choose dark or follow their phone. */
export type Appearance = 'light' | 'dark' | 'system';

type Theme = {
  colors: Palette;
  scheme: 'light' | 'dark';
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
};

const KEY = 'allelon.appearance';

const ThemeContext = createContext<Theme>({
  colors: light,
  scheme: 'light',
  appearance: 'light',
  setAppearance: () => {},
});

async function loadAppearance(): Promise<Appearance | null> {
  try {
    const v = Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : null;
  } catch {
    return null;
  }
}

async function saveAppearance(a: Appearance) {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, a);
    else await SecureStore.setItemAsync(KEY, a);
  } catch {
    // Not saved; the choice still applies for this session.
  }
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [appearance, setAppearanceState] = useState<Appearance>('light');

  useEffect(() => {
    loadAppearance().then((a) => a && setAppearanceState(a));
  }, []);

  const setAppearance = (a: Appearance) => {
    setAppearanceState(a);
    saveAppearance(a);
  };

  const scheme = appearance === 'system' ? system : appearance;
  return (
    <ThemeContext.Provider value={{ colors: scheme === 'dark' ? dark : light, scheme, appearance, setAppearance }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
