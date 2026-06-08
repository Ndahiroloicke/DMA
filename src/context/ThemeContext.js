import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../theme/colors';

const THEME_STORAGE_KEY = '@lexisearch_theme_mode';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value) => {
        if (value === 'dark') {
          setIsDark(true);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const setDarkMode = useCallback(async (enabled) => {
    setIsDark(enabled);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, enabled ? 'dark' : 'light');
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!isDark);
  }, [isDark, setDarkMode]);

  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      isDark,
      isReady,
      colors,
      setDarkMode,
      toggleDarkMode,
    }),
    [isDark, isReady, colors, setDarkMode, toggleDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
