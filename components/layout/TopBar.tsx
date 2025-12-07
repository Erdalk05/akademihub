'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import RoleSwitcher from '@/components/auth/RoleSwitcher';
import ActivityLogButton from './ActivityLogButton';
import { usePermission } from '@/lib/hooks/usePermission';

const TopBar: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { isAdmin } = usePermission();

  useEffect(() => {
    setMounted(true);
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    setIsDark(stored === 'dark');
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
      const root = document.documentElement;
      if (newDarkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  return (
    <nav className="hidden lg:flex fixed top-0 right-0 left-64 h-16 bg-white dark:bg-[#075E54] border-b border-[#25D366]/20 dark:border-[#25D366]/30 items-center justify-between px-4 md:px-8 z-30 shadow-sm">
      {/* Left Side - Empty for balance */}
      <div className="hidden md:flex flex-1 max-w-md">
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Role Switcher - Giriş Türü */}
        <RoleSwitcher />

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-[#DCF8C6] dark:hover:bg-[#128C7E] rounded-xl transition"
            title="Tema değiştir"
          >
            {isDark ? <Sun size={20} className="text-[#25D366]" /> : <Moon size={20} className="text-[#075E54]" />}
          </button>
        )}
        {!mounted && (
          <button className="p-2.5 hover:bg-[#DCF8C6] rounded-xl transition" disabled>
            <Moon size={20} className="text-[#075E54]" />
          </button>
        )}

        {/* Settings - Sadece Admin görebilir */}
        {isAdmin && (
          <a
            href="/settings"
            className="p-2.5 hover:bg-[#DCF8C6] dark:hover:bg-[#128C7E] rounded-xl transition"
            title="Ayarlar"
          >
            <Settings size={20} className="text-[#075E54] dark:text-[#25D366]" />
          </a>
        )}

        {/* Notifications */}
        <NotificationBell />

        {/* Activity Logs - Sadece Admin görebilir */}
        {isAdmin && <ActivityLogButton />}
      </div>
    </nav>
  );
};

export default TopBar;
