import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { dark, light, type Palette } from './tokens';

export * from './tokens';

type Theme = { colors: Palette; scheme: 'light' | 'dark' };

const ThemeContext = createContext<Theme>({ colors: light, scheme: 'light' });

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <ThemeContext.Provider value={{ colors: scheme === 'dark' ? dark : light, scheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
