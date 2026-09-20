import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Apply immediately before render to prevent flash
    const saved = localStorage.getItem('pfms_theme') || 'light';
    if (saved === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return saved;
  });

  useEffect(() => {
    const root = document.documentElement;
    // Disable transitions briefly to prevent flash on theme switch
    root.classList.add('no-transition');
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('pfms_theme', theme);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove('no-transition'));
    });
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};