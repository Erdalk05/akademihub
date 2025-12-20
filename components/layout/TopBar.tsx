'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Building2,
  ChevronDown,
  Check,
  Calendar,
  LogOut,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import NotificationBell from '@/components/notifications/NotificationBell';
import RoleSwitcher from '@/components/auth/RoleSwitcher';
import ActivityLogButton from './ActivityLogButton';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAcademicYearStore, getCurrentAcademicYear } from '@/lib/store/academicYearStore';

interface TopBarProps {
  onSearchClick?: () => void;
}

export default function TopBar({ onSearchClick }: TopBarProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const { isAdmin, isSuperAdmin, isLoading: permissionLoading } = usePermission();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        localStorage.removeItem('enrollment-store-v8');
        localStorage.removeItem('organization-store-v3');
        localStorage.removeItem('academic-year-store');
        localStorage.removeItem('supabase.auth.token');
        toast.success('Cikis yapildi!');
        router.push('/login');
      } else {
        toast.error('Cikis yapilirken hata olustu');
      }
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  }, [router]);

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

  const { selectedYear, availableYears, setSelectedYear } = useAcademicYearStore();
  const currentAcademicYear = getCurrentAcademicYear();

  const safeOrganizations = organizations || [];
  const safeIsAllOrganizations = isAllOrganizations === true;

  useEffect(() => {
    setMounted(true);
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

  const handleYearChange = useCallback((year: string) => {
    if (year !== selectedYear) {
      toast.success('Akademik yil degistirildi: ' + selectedYear + ' -> ' + year);
      setSelectedYear(year);
      setShowYearDropdown(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      setShowYearDropdown(false);
    }
  }, [selectedYear, setSelectedYear]);

  return (
    <nav className="hidden lg:flex fixed top-0 right-0 left-16 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 items-center justify-between px-4 md:px-8 z-30 shadow-sm">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all group shadow-sm"
        >
          <Search size={18} className="text-gray-600 group-hover:text-green-600 transition-colors" />
          <span className="text-gray-600 text-sm font-medium">Ogrenci Ara</span>
          <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border">Cmd+K</span>
        </button>

        <div className="hidden md:flex">
          {mounted && isSuperAdmin && safeOrganizations.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:opacity-90 transition shadow-md"
              >
                <Building2 size={18} />
                <span className="font-medium text-sm max-w-[200px] truncate">
                  {safeIsAllOrganizations ? 'Tum Kurumlar' : (currentOrganization?.name || 'Kurum Secin')}
                </span>
                <ChevronDown size={16} className={`transition-transform ${showOrgDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showOrgDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowOrgDropdown(false)} />
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Kurumlar</p>
                    </div>

                    <button
                      onClick={() => {
                        selectAllOrganizations();
                        setShowOrgDropdown(false);
                        window.location.reload();
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-green-50 transition border-b border-gray-100 ${safeIsAllOrganizations ? 'bg-green-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                          ALL
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Tum Kurumlar</p>
                          <p className="text-xs text-gray-500">Tum verileri goruntule</p>
                        </div>
                      </div>
                      {safeIsAllOrganizations && <Check size={18} className="text-green-600" />}
                    </button>

                    {safeOrganizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => {
                          switchOrganization(org.id);
                          setShowOrgDropdown(false);
                          window.location.reload();
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-green-50 transition ${currentOrganization?.id === org.id && !safeIsAllOrganizations ? 'bg-green-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{org.name}</p>
                            <p className="text-xs text-gray-500">{org.slug}</p>
                          </div>
                        </div>
                        {currentOrganization?.id === org.id && !safeIsAllOrganizations && <Check size={18} className="text-green-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {mounted && currentOrganization && (!isSuperAdmin || safeOrganizations.length === 1) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-xl">
              <Building2 size={18} className="text-green-700" />
              <span className="font-medium text-sm text-green-700">{currentOrganization.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition shadow-sm border ${selectedYear === currentAcademicYear ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400' : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'}`}
            >
              <Calendar size={16} />
              <span className="font-semibold text-sm">{selectedYear}</span>
              <ChevronDown size={14} className={`transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showYearDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowYearDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                      <Calendar size={12} />
                      Akademik Yil Secin
                    </p>
                  </div>

                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-emerald-50 transition ${selectedYear === year ? 'bg-emerald-100' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${selectedYear === year ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {year}
                        </span>
                        {year === currentAcademicYear && (
                          <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                            GUNCEL
                          </span>
                        )}
                      </div>
                      {selectedYear === year && <Check size={16} className="text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <RoleSwitcher />

        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
          >
            {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600" />}
          </button>
        )}
        {!mounted && (
          <button className="p-2.5 hover:bg-gray-100 rounded-xl transition" disabled>
            <Moon size={20} className="text-gray-600" />
          </button>
        )}

        {mounted && !permissionLoading && isAdmin && (
          <a href="/settings" className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
            <Settings size={20} className="text-gray-600 dark:text-gray-300" />
          </a>
        )}

        <NotificationBell />

        {mounted && !permissionLoading && isAdmin && <ActivityLogButton />}

        {mounted && (
          <button
            onClick={handleLogout}
            className="p-2.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition group"
          >
            <LogOut size={20} className="text-gray-500 group-hover:text-red-500 transition-colors" />
          </button>
        )}
      </div>
    </nav>
  );
}
