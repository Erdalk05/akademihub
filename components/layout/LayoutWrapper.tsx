'use client';

import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Menu, X, Search, Bell, Settings, LogOut, Calendar, ChevronDown, Check } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { usePermission } from '@/lib/hooks/usePermission';
import { useAcademicYearStore, getCurrentAcademicYear } from '@/lib/store/academicYearStore';
import { useNotificationContext } from '@/lib/contexts/NotificationContext';

// Lazy load heavy components
const SearchModal = lazy(() => import('@/components/modals/SearchModal'));
const ThemeToggle = lazy(() => import('@/components/ui/ThemeToggle'));
const NavigationButtons = lazy(() => import('@/components/ui/NavigationButtons'));

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // Hooks
  const { isAdmin } = usePermission();
  const { selectedYear, availableYears, setSelectedYear } = useAcademicYearStore();
  const currentAcademicYear = getCurrentAcademicYear();
  
  // Notification context - safely access
  let unreadCount = 0;
  try {
    const notifContext = useNotificationContext();
    unreadCount = notifContext?.unreadCount || 0;
  } catch {
    // Context not available
  }
  
  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('enrollment-store-v8');
      localStorage.removeItem('organization-store-v3');
      localStorage.removeItem('academic-year-store');
      toast.success('Çıkış yapıldı!');
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }, [router]);
  
  // Year change handler
  const handleYearChange = useCallback((year: string) => {
    if (year !== selectedYear) {
      toast.success('Akademik yıl değiştirildi: ' + year);
      setSelectedYear(year);
      setShowYearDropdown(false);
      setShowMobileMenu(false);
      setTimeout(() => window.location.reload(), 500);
    } else {
      setShowYearDropdown(false);
    }
  }, [selectedYear, setSelectedYear]);

  // Load sidebar state from localStorage
  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') {
      setMounted(true);
      return;
    }
    
    try {
      const saved = localStorage.getItem('sidebarOpen');
      if (saved !== null) {
        setIsOpen(saved === 'true');
      } else {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('localStorage error:', error);
    }
    setMounted(true);
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;
    if (!mounted) return;
    
    try {
      localStorage.setItem('sidebarOpen', String(isOpen));
    } catch (error) {
      console.error('localStorage save error:', error);
    }
  }, [isOpen, mounted]);

  // Global shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;
    
    const handler = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().includes('MAC');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Don't show sidebar on auth pages (login/register/forgot etc.)
  const isAuthPage =
    pathname === '/login' ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/forgot') ||
    pathname === '/';

  if (!mounted) {
    return <>{children}</>;
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-[margin] duration-300">
      {/* Mobile Header - Geliştirilmiş */}
      <header className="lg:hidden h-14 bg-gradient-to-r from-[#075E54] to-[#128C7E] flex items-center justify-between px-3 shadow-lg z-20 sticky top-0">
        {/* Sol: Menü butonu */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Toggle sidebar"
        >
          {isOpen ? (
            <X size={22} className="text-white" />
          ) : (
            <Menu size={22} className="text-white" />
          )}
        </button>
        
        {/* Orta: Arama butonu */}
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium shadow-md"
          aria-label="Öğrenci Ara"
        >
          <Search size={16} className="text-[#075E54]" />
          <span>Öğrenci Ara</span>
        </button>
        
        {/* Sağ: Hızlı aksiyonlar */}
        <div className="flex items-center gap-1">
          {/* Akademik Yıl */}
          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold ${
                selectedYear === currentAcademicYear 
                  ? 'bg-white/20 text-white' 
                  : 'bg-amber-400 text-amber-900'
              }`}
            >
              <Calendar size={14} />
              <span className="hidden xs:inline">{selectedYear?.split('-')[0]}</span>
              <ChevronDown size={12} />
            </button>
            
            {showYearDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowYearDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-emerald-50 ${
                        selectedYear === year ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{year}</span>
                      {selectedYear === year && <Check size={14} className="text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Bildirimler */}
          <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 rounded-xl bg-white/20 hover:bg-white/30 transition"
          >
            <Bell size={18} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Daha fazla menü */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition"
          >
            <Settings size={18} className="text-white" />
          </button>
        </div>
      </header>
      
      {/* Mobile Quick Actions Bar */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setShowMobileMenu(false)} />
          <div className="lg:hidden fixed top-14 right-2 z-40 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 w-52 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Tema Değiştir */}
            <div className="px-4 py-2 border-b border-gray-100">
              <Suspense fallback={<div className="h-8" />}>
                <ThemeToggle />
              </Suspense>
            </div>
            
            {/* Bildirimler */}
            <button
              onClick={() => { setShowMobileMenu(false); router.push('/notifications'); }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-gray-500" />
                <span>Bildirimler</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>
            
            {/* Ayarlar */}
            {isAdmin && (
              <button
                onClick={() => { setShowMobileMenu(false); router.push('/settings'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings size={18} className="text-gray-500" />
                <span>Ayarlar</span>
              </button>
            )}
            
            <hr className="my-1" />
            
            {/* Çıkış */}
            <button
              onClick={() => { setShowMobileMenu(false); handleLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (fixed) - MOBİLDE TAM GENİŞLİK */}
      <aside
        className={`fixed left-0 top-0 h-full bg-slate-100 border-r border-slate-200 transition-all duration-300 z-40 
          ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'} 
          lg:translate-x-0 lg:${collapsed ? 'w-16' : 'w-64'} safe-area-inset`}
        onMouseEnter={() => {
          if (typeof window !== 'undefined' && window.innerWidth >= 1024) setCollapsed(false);
        }}
        onMouseLeave={() => {
          if (typeof window !== 'undefined' && window.innerWidth >= 1024) setCollapsed(true);
        }}
      >
        {/* Mobilde her zaman collapsed=false */}
        <Sidebar onClose={() => setIsOpen(false)} collapsed={typeof window !== 'undefined' && window.innerWidth >= 1024 ? collapsed : false} />
      </aside>

      {/* Desktop Top Bar (NAVIGATION_GUIDE uyumlu) */}
      <TopBar onSearchClick={() => setShowSearch(true)} />

      {/* Content */}
      <main className={`min-h-[calc(100vh-56px)] lg:pt-16 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {children}
      </main>

      {/* Navigation Buttons - İleri/Geri/Ana Sayfa */}
      <Suspense fallback={null}>
        <NavigationButtons position="bottom-left" showHome={true} />
      </Suspense>

      {/* Search Modal - Lazy Loaded */}
      {showSearch && (
        <Suspense fallback={null}>
          <SearchModal
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            onSelect={() => setShowSearch(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
