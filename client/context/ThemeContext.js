/**
 * ThemeContext – light / dark / system, persisted and reactive.
 * useTheme() returns { isDark, theme, colors, setThemeMode }.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes } from '../theme';

const STORAGE_KEY = '@bsbs_theme_mode';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState('system'); // 'light' | 'dark' | 'system'

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    });
  }, []);

  const setThemeMode = useCallback((newMode) => {
    const value = newMode === 'light' || newMode === 'dark' || newMode === 'system' ? newMode : 'system';
    setModeState(value);
    AsyncStorage.setItem(STORAGE_KEY, value);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const theme = themes[isDark ? 'dark' : 'light'];
  const colors = theme.colors;

  const value = { isDark, theme, colors, setThemeMode, themeMode: mode };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      isDark: false,
      theme: themes.light,
      colors: themes.light.colors,
      setThemeMode: () => {},
      themeMode: 'system',
    };
  }
  return ctx;
}

export default ThemeContext;
