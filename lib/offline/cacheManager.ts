/**
 * Cache Manager
 * Hem memory hem de localStorage cache yönetimi
 * Offline modda localStorage'dan, online modda memory'den servis yapar
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in ms (default: 5 dakika)
  persistToStorage?: boolean; // localStorage'a kaydet (offline için)
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 dakika
const STORAGE_PREFIX = 'akademihub_cache_';

class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private log(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CACHE] ${message}`, data || '');
    }
  }

  // Memory cache'e yaz
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = DEFAULT_TTL, persistToStorage = true } = options;
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };

    // Memory cache
    this.memoryCache.set(key, entry);
    this.log(`Memory cache güncellendi: ${key}`);

    // localStorage (offline için)
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_PREFIX + key,
          JSON.stringify(entry)
        );
        this.log(`LocalStorage cache güncellendi: ${key}`);
      } catch (e) {
        this.log(`LocalStorage yazma hatası: ${key}`, e);
      }
    }
  }

  // Cache'den oku (önce memory, sonra localStorage)
  get<T>(key: string, allowExpired: boolean = false): T | null {
    const now = Date.now();

    // 1. Memory cache kontrol
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (allowExpired || memEntry.expiresAt > now) {
        this.log(`Memory cache'den okundu: ${key}`);
        return memEntry.data as T;
      } else {
        this.log(`Memory cache süresi dolmuş: ${key}`);
        this.memoryCache.delete(key);
      }
    }

    // 2. localStorage kontrol (offline için kritik)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_PREFIX + key);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          
          // Offline modda expired olsa bile döndür
          if (allowExpired || entry.expiresAt > now) {
            // Memory cache'e de yükle
            this.memoryCache.set(key, entry);
            this.log(`LocalStorage cache'den okundu: ${key}`);
            return entry.data;
          } else {
            this.log(`LocalStorage cache süresi dolmuş: ${key}`);
            localStorage.removeItem(STORAGE_PREFIX + key);
          }
        }
      } catch (e) {
        this.log(`LocalStorage okuma hatası: ${key}`, e);
      }
    }

    return null;
  }

  // Cache'i temizle
  invalidate(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_PREFIX + key);
    }
    this.log(`Cache temizlendi: ${key}`);
  }

  // Tüm cache'i temizle
  invalidateAll(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    }
    this.log('Tüm cache temizlendi');
  }

  // Cache var mı ve geçerli mi?
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Cache'in yaşını al (ms)
  getAge(key: string): number | null {
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      return Date.now() - memEntry.timestamp;
    }
    return null;
  }

  // Tüm cache key'lerini al
  getKeys(): string[] {
    return Array.from(this.memoryCache.keys());
  }
}

export const cacheManager = CacheManager.getInstance();
