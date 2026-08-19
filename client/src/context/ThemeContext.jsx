import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'themePreference'; // 'light' | 'dark' | 'system'

function resolveMode(preference) {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => localStorage.getItem(STORAGE_KEY) || 'system');
  const [mode, setMode] = useState(() => resolveMode(localStorage.getItem(STORAGE_KEY) || 'system'));

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);

  useEffect(() => {
    setMode(resolveMode(preference));
    localStorage.setItem(STORAGE_KEY, preference);

    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => setMode(resolveMode('system'));
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [preference]);

  const toggle = useCallback(() => {
    // Quick-access button: flips light/dark directly, exits 'system' mode
    setPreference((prev) => {
      const current = resolveMode(prev);
      return current === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const value = { preference, mode, setPreference, toggle };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}