'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Home, History } from 'lucide-react';

interface NavigationButtonsProps {
  position?: 'bottom-left' | 'bottom-center' | 'bottom-right';
  showHome?: boolean;
}

/**
 * Sayfa Navigasyon Butonları
 * - Geri: Önceki sayfaya git
 * - İleri: Sonraki sayfaya git (varsa)
 * - Ana Sayfa: Dashboard'a git
 */
export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  position = 'bottom-left',
  showHome = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [historyLength, setHistoryLength] = useState(0);

  // Tarayıcı geçmişi kontrolü
  useEffect(() => {
    // history.length > 1 ise geri gidilebilir
    setHistoryLength(window.history.length);
    setCanGoBack(window.history.length > 1);
    
    // Forward kontrolü için state kullanıyoruz
    // Not: Tarayıcı forward durumunu doğrudan kontrol edemez
    // Bu yüzden sadece görsel olarak gösteriyoruz
    const handlePopState = () => {
      setHistoryLength(window.history.length);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pathname]);

  const handleBack = useCallback(() => {
    if (canGoBack) {
      router.back();
    }
  }, [canGoBack, router]);

  const handleForward = useCallback(() => {
    window.history.forward();
  }, []);

  const handleHome = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  // Login sayfasında gösterme
  if (pathname === '/login' || pathname === '/') {
    return null;
  }

  const positionClasses = {
    'bottom-left': 'left-4 bottom-4',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-4',
    'bottom-right': 'right-4 bottom-4',
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 flex items-center gap-2 print:hidden`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Geri Butonu */}
      <button
        onClick={handleBack}
        disabled={!canGoBack}
        className={`
          flex items-center justify-center w-10 h-10 rounded-full
          transition-all duration-200 shadow-lg
          ${canGoBack 
            ? 'bg-white hover:bg-gray-100 text-gray-700 hover:scale-110 cursor-pointer' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'}
          border border-gray-200
        `}
        title="Geri"
        aria-label="Geri git"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Ana Sayfa Butonu */}
      {showHome && (
        <button
          onClick={handleHome}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full
            bg-gradient-to-r from-green-500 to-emerald-600 text-white
            hover:from-green-600 hover:to-emerald-700
            transition-all duration-200 shadow-lg hover:scale-110
            border border-green-400
          `}
          title="Ana Sayfa"
          aria-label="Ana Sayfaya git"
        >
          <Home className="w-5 h-5" />
        </button>
      )}

      {/* İleri Butonu */}
      <button
        onClick={handleForward}
        className={`
          flex items-center justify-center w-10 h-10 rounded-full
          bg-white hover:bg-gray-100 text-gray-700
          transition-all duration-200 shadow-lg hover:scale-110
          border border-gray-200 cursor-pointer
        `}
        title="İleri"
        aria-label="İleri git"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Geçmiş Sayısı (Debug) */}
      {process.env.NODE_ENV === 'development' && (
        <span className="text-xs text-gray-400 ml-2 hidden">
          ({historyLength})
        </span>
      )}
    </div>
  );
};

export default NavigationButtons;
