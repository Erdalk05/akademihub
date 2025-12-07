'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('theme');
    
    if (stored === 'dark' || stored === 'light') {
      setIsDark(stored === 'dark');
      applyTheme(stored === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      applyTheme(prefersDark);
    }
    
    setMounted(true);
  }, []);

  const applyTheme = (dark: boolean) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      document.body.classList.add('dark-mode');
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#f1f5f9';
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark-mode');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#1e293b';
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
      applyTheme(newDarkMode);
    }
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme: isDark ? 'dark' : 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values during SSR
    if (typeof window === 'undefined') {
      return {
        isDark: false,
        toggleTheme: () => {},
        theme: 'light' as const,
      };
    }
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
