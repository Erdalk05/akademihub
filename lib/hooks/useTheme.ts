'use client';

import { useContext } from 'react';
import { useTheme as useThemeContext } from '@/lib/context/ThemeContext';

/**
 * Custom hook to access theme context
 * Use this throughout the app to access isDark, toggleTheme, and theme
 */
export const useTheme = useThemeContext;

export default useTheme;
