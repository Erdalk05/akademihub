'use client';

import React from 'react';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useNetworkStatus } from '@/lib/offline/networkStatus';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
  onRefresh?: () => void;
}

export default function OfflineIndicator({ 
  showWhenOnline = false,
  position = 'bottom',
  onRefresh
}: OfflineIndicatorProps) {
  const { isOnline, isOffline, isChecking, checkConnection } = useNetworkStatus();
  const [showOnlineMessage, setShowOnlineMessage] = React.useState(false);
  const [wasOffline, setWasOffline] = React.useState(false);

  // Offline'dan online'a geçişte mesaj göster
  React.useEffect(() => {
    if (wasOffline && isOnline) {
      setShowOnlineMessage(true);
      const timer = setTimeout(() => setShowOnlineMessage(false), 3000);
      return () => clearTimeout(timer);
    }
    setWasOffline(isOffline);
  }, [isOnline, isOffline, wasOffline]);

  const handleRefresh = async () => {
    const online = await checkConnection();
    if (online && onRefresh) {
      onRefresh();
    }
  };

  // Online ve mesaj gösterilmiyorsa render etme
  if (isOnline && !showOnlineMessage && !showWhenOnline) {
    return null;
  }

  const positionClass = position === 'top' 
    ? 'top-0 rounded-b-xl' 
    : 'bottom-0 rounded-t-xl';

  // Online duruma geçiş mesajı
  if (showOnlineMessage) {
    return (
      <div className={`fixed left-1/2 -translate-x-1/2 ${positionClass} z-50 animate-in slide-in-from-bottom-2`}>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white shadow-lg">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">İnternet bağlantısı kuruldu</span>
        </div>
      </div>
    );
  }

  // Offline göstergesi
  if (isOffline) {
    return (
      <div className={`fixed left-1/2 -translate-x-1/2 ${positionClass} z-50`}>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500 text-white shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Çevrimdışı mod - Kayıtlı veriler gösteriliyor</span>
          <button
            onClick={handleRefresh}
            disabled={isChecking}
            className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition text-xs"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            Kontrol Et
          </button>
        </div>
      </div>
    );
  }

  return null;
}
