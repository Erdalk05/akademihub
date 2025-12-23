'use client';

/**
 * Network Status Manager
 * İnternet bağlantısını izler ve online/offline durumunu yönetir
 */

type NetworkStatusListener = (isOnline: boolean) => void;

class NetworkStatusManager {
  private static instance: NetworkStatusManager;
  private listeners: Set<NetworkStatusListener> = new Set();
  private _isOnline: boolean = true;
  private initialized: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  static getInstance(): NetworkStatusManager {
    if (!NetworkStatusManager.instance) {
      NetworkStatusManager.instance = new NetworkStatusManager();
    }
    return NetworkStatusManager.instance;
  }

  private initialize() {
    if (this.initialized) return;
    
    this._isOnline = navigator.onLine;
    
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    this.initialized = true;
    this.log(`Başlangıç durumu: ${this._isOnline ? 'ONLINE' : 'OFFLINE'}`);
  }

  private handleOnline = () => {
    this._isOnline = true;
    this.log('🌐 İnternet bağlantısı YENİDEN KURULDU');
    this.notifyListeners();
  };

  private handleOffline = () => {
    this._isOnline = false;
    this.log('📴 İnternet bağlantısı KESİLDİ - Offline mod aktif');
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this._isOnline));
  }

  private log(message: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[NETWORK] ${message}`);
    }
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  get isOffline(): boolean {
    return !this._isOnline;
  }

  subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // API'ye ulaşılabilirlik kontrolü (daha güvenilir)
  async checkApiReachability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const networkStatus = NetworkStatusManager.getInstance();

// React hook for network status
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Initial state
    setIsOnline(networkStatus.isOnline);

    // Subscribe to changes
    const unsubscribe = networkStatus.subscribe((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    const reachable = await networkStatus.checkApiReachability();
    setIsOnline(reachable);
    setIsChecking(false);
    return reachable;
  };

  return { isOnline, isOffline: !isOnline, isChecking, checkConnection };
}
