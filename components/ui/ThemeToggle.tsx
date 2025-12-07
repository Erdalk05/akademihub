'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="group relative inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
      aria-label="Toggle theme"
      title={isDark ? 'Açık tema' : 'Koyu tema'}
    >
      {/* Sun Icon (Light Mode) */}
      <Sun
        className={`absolute h-5 w-5 transition-all duration-300 ${
          isDark
            ? 'rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100'
        }`}
      />
      
      {/* Moon Icon (Dark Mode) */}
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ${
          isDark
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />

      {/* Ripple Effect */}
      <span className="absolute inset-0 rounded-lg bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
