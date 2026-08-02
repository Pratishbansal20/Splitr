import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'splitr:mode';
const SECRET = 'girly';
const DEFAULT = 'finance';

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === SECRET ? SECRET : DEFAULT;
    } catch (e) {
      return DEFAULT;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === SECRET ? DEFAULT : SECRET;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        // ignore (private browsing etc.)
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    theme,
    isGirly: theme === SECRET,
    toggleTheme,
  }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
