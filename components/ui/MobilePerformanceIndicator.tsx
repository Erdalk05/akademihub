'use client';

import React from 'react';
import { Wifi, WifiOff, Smartphone, Zap, AlertTriangle } from 'lucide-react';
import { useMobileOptimization } from '@/lib/hooks/useMobileOptimization';

/**
 * MobilePerformanceIndicator
 * Sadece development modunda görünen performans göstergesi
 * Production'da hiçbir şey render etmez
 */
export default function MobilePerformanceIndicator() {
  // Production'da render etme
  if (process.env.NODE_ENV !== 'development') return null;
  
  const { 
    isMobile, 
    isTablet, 
    connectionSpeed, 
    isSlowConnection, 
    isLowEndDevice,
    deviceMemory,
    pageSize 
  } = useMobileOptimization();
  
  const getConnectionIcon = () => {
    switch (connectionSpeed) {
      case 'fast': return <Wifi className="w-3 h-3 text-green-500" />;
      case 'medium': return <Wifi className="w-3 h-3 text-amber-500" />;
      case 'slow': return <Wifi className="w-3 h-3 text-red-500" />;
      case 'offline': return <WifiOff className="w-3 h-3 text-red-500" />;
      default: return <Wifi className="w-3 h-3 text-gray-400" />;
    }
  };
  
  const getDeviceIcon = () => {
    if (isLowEndDevice) return <AlertTriangle className="w-3 h-3 text-amber-500" />;
    return <Smartphone className="w-3 h-3 text-blue-500" />;
  };
  
  return (
    <div className="fixed bottom-2 right-2 z-50 bg-black/80 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-2 font-mono">
      <span className="flex items-center gap-1">
        {getDeviceIcon()}
        {isMobile ? 'M' : isTablet ? 'T' : 'D'}
      </span>
      <span className="flex items-center gap-1">
        {getConnectionIcon()}
        {connectionSpeed.charAt(0).toUpperCase()}
      </span>
      {deviceMemory && (
        <span className="text-gray-400">{deviceMemory}GB</span>
      )}
      <span className="flex items-center gap-1">
        <Zap className="w-3 h-3 text-emerald-400" />
        {pageSize}
      </span>
    </div>
  );
}
