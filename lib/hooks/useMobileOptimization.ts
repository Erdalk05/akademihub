'use client';

import { useState, useEffect, useMemo } from 'react';

type ConnectionSpeed = 'fast' | 'medium' | 'slow' | 'offline' | 'unknown';

interface MobileOptimizationResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  pageSize: number;        // Liste başına gösterilecek item sayısı
  shouldDeferHeavyCalc: boolean;  // Ağır hesaplamalar ertelenmeli mi
  prefersReducedMotion: boolean;  // Animasyonlar azaltılmalı mı
  connectionSpeed: ConnectionSpeed;  // Bağlantı hızı tahmini
  isSlowConnection: boolean;  // Yavaş bağlantı mı
  shouldReduceData: boolean;  // Veri miktarı azaltılmalı mı
  deviceMemory: number | null;  // Cihaz belleği (GB)
  isLowEndDevice: boolean;  // Düşük performanslı cihaz mı
}

/**
 * Bağlantı hızını tespit et
 */
function detectConnectionSpeed(): ConnectionSpeed {
  if (typeof navigator === 'undefined') return 'unknown';
  
  // Network Information API
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'unknown';
  
  // Offline
  if (!navigator.onLine) return 'offline';
  
  // Effective type
  const effectiveType = connection.effectiveType;
  if (effectiveType === '4g') return 'fast';
  if (effectiveType === '3g') return 'medium';
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'slow';
  
  // Downlink speed (Mbps)
  const downlink = connection.downlink;
  if (downlink >= 5) return 'fast';
  if (downlink >= 1) return 'medium';
  if (downlink > 0) return 'slow';
  
  return 'unknown';
}

/**
 * Cihaz belleğini al (GB)
 */
function getDeviceMemory(): number | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as any).deviceMemory || null;
}

/**
 * useMobileOptimization - Mobil cihazlar için performans optimizasyonu
 * 
 * Kullanım:
 * const { isMobile, pageSize, shouldDeferHeavyCalc, isSlowConnection } = useMobileOptimization();
 * 
 * Avantajlar:
 * - Mobilde daha az item render edilir
 * - Ağır hesaplamalar ertelenir
 * - Animasyonlar azaltılır
 * - Yavaş bağlantıda veri azaltılır
 * - Düşük performanslı cihazlar algılanır
 */
export function useMobileOptimization(): MobileOptimizationResult {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState<ConnectionSpeed>('unknown');
  const [deviceMemory, setDeviceMemory] = useState<number | null>(null);

  useEffect(() => {
    // İlk yükleme
    setWindowWidth(window.innerWidth);
    setConnectionSpeed(detectConnectionSpeed());
    setDeviceMemory(getDeviceMemory());
    
    // Reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    
    // Resize listener (debounced)
    let resizeTimeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150);
    };
    
    // Motion preference change listener
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    // Connection change listener
    const connection = (navigator as any).connection;
    const handleConnectionChange = () => {
      setConnectionSpeed(detectConnectionSpeed());
    };
    
    // Online/Offline listener
    const handleOnline = () => setConnectionSpeed(detectConnectionSpeed());
    const handleOffline = () => setConnectionSpeed('offline');
    
    window.addEventListener('resize', handleResize);
    motionQuery.addEventListener('change', handleMotionChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }
    
    return () => {
      clearTimeout(resizeTimeoutId);
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return useMemo(() => {
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;
    
    const isSlowConnection = connectionSpeed === 'slow' || connectionSpeed === 'offline';
    const isLowEndDevice = (deviceMemory !== null && deviceMemory <= 2) || (isMobile && isSlowConnection);
    
    // Dinamik page size - bağlantı ve cihaz durumuna göre
    let pageSize = isMobile ? 10 : isTablet ? 15 : 25;
    if (isSlowConnection) pageSize = Math.max(5, Math.floor(pageSize / 2));
    if (isLowEndDevice) pageSize = Math.max(5, Math.floor(pageSize * 0.75));

    return {
      isMobile,
      isTablet,
      isDesktop,
      pageSize,
      shouldDeferHeavyCalc: isMobile || isSlowConnection || isLowEndDevice,
      prefersReducedMotion,
      connectionSpeed,
      isSlowConnection,
      shouldReduceData: isSlowConnection || isLowEndDevice,
      deviceMemory,
      isLowEndDevice,
    };
  }, [windowWidth, prefersReducedMotion, connectionSpeed, deviceMemory]);
}

export default useMobileOptimization;
