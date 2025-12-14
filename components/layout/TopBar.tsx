'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Building2,
  ChevronDown,
  Check,
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import RoleSwitcher from '@/components/auth/RoleSwitcher';
import ActivityLogButton from './ActivityLogButton';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';

const TopBar: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const { isAdmin, isSuperAdmin, isLoading: permissionLoading } = usePermission();
  
  const { 
    organizations, 
    currentOrganization, 
    isAllOrganizations,
    fetchOrganizations, 
    switchOrganization,
    selectAllOrganizations,
    _hasHydrated,
    setHasHydrated
  } = useOrganizationStore();
  
  // Güvenli değerler
  const safeOrganizations = organizations || [];
  const safeIsAllOrganizations = isAllOrganizations === true;

  useEffect(() => {
    setMounted(true);
    // skipHydration: true kullanıldığında manuel rehydrate gerekli
    useOrganizationStore.persist.rehydrate();
    setHasHydrated(true);
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    setIsDark(stored === 'dark');
  }, [setHasHydrated]);

  useEffect(() => {
    if (_hasHydrated) {
      fetchOrganizations();
    }
  }, [_hasHydrated, fetchOrganizations]);

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
      {/* Left Side - Organization Selector */}
      <div className="hidden md:flex flex-1 max-w-md">
        {/* Kurum seçici SADECE Franchise Yöneticisi için görünür */}
        {mounted && isSuperAdmin && safeOrganizations.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white rounded-xl hover:opacity-90 transition shadow-md"
            >
              <Building2 size={18} />
              <span className="font-medium text-sm max-w-[200px] truncate">
                {safeIsAllOrganizations ? '🌐 Tüm Kurumlar' : (currentOrganization?.name || 'Kurum Seçin')}
              </span>
              <ChevronDown size={16} className={`transition-transform ${showOrgDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showOrgDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOrgDropdown(false)} />
                <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#25D366]/20 py-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Kurumlar</p>
                  </div>
                  
                  {/* Tüm Kurumlar Seçeneği */}
                  <button
                    onClick={() => {
                      selectAllOrganizations();
                      setShowOrgDropdown(false);
                      window.location.reload();
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[#DCF8C6] transition border-b border-gray-100 ${
                      safeIsAllOrganizations ? 'bg-[#DCF8C6]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        🌐
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Tüm Kurumlar</p>
                        <p className="text-xs text-gray-500">Tüm verileri görüntüle</p>
                      </div>
                    </div>
                    {safeIsAllOrganizations && (
                      <Check size={18} className="text-[#25D366]" />
                    )}
                  </button>
                  
                  {safeOrganizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        switchOrganization(org.id);
                        setShowOrgDropdown(false);
                        window.location.reload(); // Sayfayı yenile
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[#DCF8C6] transition ${
                        currentOrganization?.id === org.id && !safeIsAllOrganizations ? 'bg-[#DCF8C6]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#075E54] to-[#25D366] rounded-lg flex items-center justify-center text-white font-bold">
                          {org.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{org.name}</p>
                          <p className="text-xs text-gray-500">{org.slug}</p>
                        </div>
                      </div>
                      {currentOrganization?.id === org.id && !safeIsAllOrganizations && (
                        <Check size={18} className="text-[#25D366]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Kurum Admin'ler ve tek kurum durumunda sadece isim göster */}
        {mounted && currentOrganization && (!isSuperAdmin || safeOrganizations.length === 1) && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#DCF8C6] rounded-xl">
            <Building2 size={18} className="text-[#075E54]" />
            <span className="font-medium text-sm text-[#075E54]">{currentOrganization.name}</span>
          </div>
        )}
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
        {mounted && !permissionLoading && isAdmin && (
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
        {mounted && !permissionLoading && isAdmin && <ActivityLogButton />}
      </div>
    </nav>
  );
};

export default TopBar;
