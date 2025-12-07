'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

// Lazy load heavy components
const SearchModal = lazy(() => import('@/components/modals/SearchModal'));
const ThemeToggle = lazy(() => import('@/components/ui/ThemeToggle'));

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      setIsOpen(saved === 'true');
    } else {
      setIsOpen(false);
    }
    setMounted(true);
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarOpen', String(isOpen));
    }
  }, [isOpen, mounted]);

  // Global shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
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
      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-20 sticky top-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          {isOpen ? (
            <X size={24} className="text-gray-700" />
          ) : (
            <Menu size={24} className="text-gray-700" />
          )}
        </button>
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-700 text-sm"
          aria-label="Öğrenci Ara"
          title="Öğrenci Ara (⌘/Ctrl + K)"
        >
          <Search size={16} />
          <span>Öğrenci Ara</span>
          <span className="ml-2 hidden sm:inline text-xs text-gray-500 border rounded px-1">⌘K</span>
        </button>
        <Suspense fallback={<div className="w-8 h-8" />}>
          <ThemeToggle />
        </Suspense>
      </header>

      {/* Sidebar (fixed) */}
      <aside
        className={`fixed left-0 top-0 h-full bg-slate-100 border-r border-slate-200 transition-all duration-300 z-40 ${
          collapsed ? 'w-16' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        onMouseEnter={() => {
          if (window.innerWidth >= 1024) setCollapsed(false);
        }}
        onMouseLeave={() => {
          if (window.innerWidth >= 1024) setCollapsed(true);
        }}
      >
        <Sidebar onClose={() => setIsOpen(false)} collapsed={collapsed} />
      </aside>

      {/* Desktop Top Bar (NAVIGATION_GUIDE uyumlu) */}
      <TopBar />

      {/* Content */}
      <main className={`min-h-[calc(100vh-56px)] lg:pt-16 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {children}
      </main>

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
