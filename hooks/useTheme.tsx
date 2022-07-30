import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'light' | 'dark';

function getInitialTheme(): ThemeName {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('color-theme');
    if (typeof storedPrefs === 'string') {
      return storedPrefs as ThemeName;
    }

    const userMedia = window.matchMedia('(prefers-color-scheme: light)');
    if (userMedia.matches) {
      return 'light';
    }
  }

  return 'dark';
}

const ThemeContext = createContext<{
  theme: ThemeName;
  setTheme: (t: ThemeName) => unknown;
}>({
  theme: 'light',
  setTheme: () => undefined,
});

export const ThemeProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme);

  const rawSetTheme = (theme: ThemeName) => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';

    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(theme);

    localStorage.setItem('color-theme', theme);
  };

  useEffect(() => {
    rawSetTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default function useTheme() {
  return useContext(ThemeContext);
}
