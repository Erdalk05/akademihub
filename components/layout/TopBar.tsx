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
  AlertCircle,
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

const TopBar: React.FC<TopBarProps> = ({ onSearchClick }) => {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const { isAdmin, isSuperAdmin, isLoading: permissionLoading } = usePermission();
  const router = useRouter();
  
  // Çıkış yapma fonksiyonu
  const handleLogout = useCallback(async () => {
    try {
      // Supabase oturumunu kapat
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (response.ok) {
        // Local storage'ı temizle
        localStorage.removeItem('enrollment-store-v8');
        localStorage.removeItem('organization-store-v3');
        localStorage.removeItem('academic-year-store');
        localStorage.removeItem('supabase.auth.token');
        
        toast.success('Çıkış yapıldı!');
        
        // Login sayfasına yönlendir
        router.push('/login');
      } else {
        toast.error('Çıkış yapılırken hata oluştu');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Hata olsa bile login'e yönlendir
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
  
  // Akademik yıl store
  const { selectedYear, availableYears, setSelectedYear } = useAcademicYearStore();
  const currentAcademicYear = getCurrentAcademicYear();
  
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
  
  // Akademik yıl değişikliği
  const handleYearChange = useCallback((year: string) => {
    if (year !== selectedYear) {
      // Uyarı toast'u göster
      toast((t) => (
        <div className="flex items-center gap-3">
          <AlertCircle className="text-amber-500" size={24} />
          <div>
            <p className="font-semibold text-gray-800">Akademik Yıl Değişikliği</p>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-red-500">{selectedYear}</span>
              {' → '}
              <span className="font-medium text-green-600">{year}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {year === currentAcademicYear ? '📍 Güncel yıl' : '📅 Geçmiş/Gelecek yıl'}
            </p>
          </div>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      ), {
        duration: 4000,
        style: {
          background: '#fff',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb',
        },
      });
      
      setSelectedYear(year);
      setShowYearDropdown(false);
      
      // Sayfayı yenile (verilerin güncellenmesi için)
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      setShowYearDropdown(false);
    }
  }, [selectedYear, currentAcademicYear, setSelectedYear]);

  return (
    <nav className="hidden lg:flex fixed top-0 right-0 left-16 h-16 bg-white dark:bg-[#075E54] border-b border-[#25D366]/20 dark:border-[#25D366]/30 items-center justify-between px-4 md:px-8 z-30 shadow-sm">
      {/* Left Side - Öğrenci Arama + Organization Selector */}
      <div className="flex items-center gap-3 flex-1">
        {/* 🔍 Öğrenci Arama Butonu - SABİT */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all group shadow-sm"
          title="Öğrenci Ara (⌘/Ctrl + K)"
        >
          <Search size={18} className="text-[#075E54] group-hover:text-[#25D366] transition-colors" />
          <span className="text-gray-600 text-sm font-medium">Öğrenci Ara</span>
          <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border">⌘K</span>
        </button>
        
        {/* Kurum Seçici */}
        <div className="hidden md:flex">
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
        {/* Akademik Yıl Seçici - Her Zaman Görünür */}
        {mounted && (
          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition shadow-sm border ${
                selectedYear === currentAcademicYear
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400'
                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
              }`}
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
                      Akademik Yıl Seçin
                    </p>
                  </div>
                  
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-emerald-50 transition ${
                        selectedYear === year ? 'bg-emerald-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${selectedYear === year ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {year}
                        </span>
                        {year === currentAcademicYear && (
                          <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                            GÜNCEL
                          </span>
                        )}
                      </div>
                      {selectedYear === year && (
                        <Check size={16} className="text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

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

        {/* Çıkış Butonu */}
        {mounted && (
          <button
            onClick={handleLogout}
            className="p-2.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition group"
            title="Çıkış Yap"
          >
            <LogOut size={20} className="text-gray-500 group-hover:text-red-500 transition-colors" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default TopBar;
