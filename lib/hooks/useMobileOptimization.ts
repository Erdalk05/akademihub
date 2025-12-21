'use client';

import { useState, useEffect, useMemo } from 'react';

interface MobileOptimizationResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  pageSize: number;        // Liste başına gösterilecek item sayısı
  shouldDeferHeavyCalc: boolean;  // Ağır hesaplamalar ertelenmeli mi
  prefersReducedMotion: boolean;  // Animasyonlar azaltılmalı mı
}

/**
 * useMobileOptimization - Mobil cihazlar için performans optimizasyonu
 * 
 * Kullanım:
 * const { isMobile, pageSize, shouldDeferHeavyCalc } = useMobileOptimization();
 * 
 * Avantajlar:
 * - Mobilde daha az item render edilir
 * - Ağır hesaplamalar ertelenir
 * - Animasyonlar azaltılır
 */
export function useMobileOptimization(): MobileOptimizationResult {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // İlk yükleme
    setWindowWidth(window.innerWidth);
    
    // Reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    
    // Resize listener (debounced)
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150);
    };
    
    // Motion preference change listener
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    window.addEventListener('resize', handleResize);
    motionQuery.addEventListener('change', handleMotionChange);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return useMemo(() => {
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    return {
      isMobile,
      isTablet,
      isDesktop,
      // Mobilde 10, tablette 15, masaüstünde 25 item
      pageSize: isMobile ? 10 : isTablet ? 15 : 25,
      // Mobilde ağır hesaplamaları ertele
      shouldDeferHeavyCalc: isMobile,
      prefersReducedMotion,
    };
  }, [windowWidth, prefersReducedMotion]);
}

export default useMobileOptimization;
