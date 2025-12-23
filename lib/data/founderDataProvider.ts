/**
 * Founder Report Data Provider
 * Kurucu raporu verileri için akıllı cache katmanı - Online/Offline destekli
 */

import { cacheManager } from '@/lib/offline/cacheManager';
import { networkStatus } from '@/lib/offline/networkStatus';

const CACHE_KEY = 'founder_report';
const TTL = 5 * 60 * 1000; // 5 dakika

function log(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[FOUNDER-DATA] ${message}`, data || '');
  }
}

export interface FounderReportResponse {
  data: any;
  fromCache: boolean;
  isOffline: boolean;
}

/**
 * Kurucu raporu verilerini getir (cache destekli)
 */
export async function getFounderReportCached(
  organizationId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<FounderReportResponse> {
  const cacheKey = `${CACHE_KEY}_${organizationId}`;
  const { forceRefresh = false } = options;

  // 1. Cache'e bak (force refresh değilse)
  if (!forceRefresh) {
    const cached = cacheManager.get<any>(cacheKey, networkStatus.isOffline);
    if (cached) {
      log(`✅ Cache'den yüklendi: ${cacheKey}`);
      return {
        data: cached,
        fromCache: true,
        isOffline: networkStatus.isOffline
      };
    }
  }

  // 2. Offline ve cache yok
  if (networkStatus.isOffline) {
    log(`📴 Offline - cache bulunamadı: ${cacheKey}`);
    return {
      data: null,
      fromCache: false,
      isOffline: true
    };
  }

  // 3. Online → API'den çek
  try {
    log(`🌐 API'den yükleniyor: ${cacheKey}`);
    const response = await fetch(`/api/finance/reports/founder?organization_id=${organizationId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      // Cache'e yaz
      cacheManager.set(cacheKey, result.data, { ttl: TTL, persistToStorage: true });
      log(`✅ API'den yüklendi ve cache'lendi: ${cacheKey}`);

      return {
        data: result.data,
        fromCache: false,
        isOffline: false
      };
    }

    return { data: null, fromCache: false, isOffline: false };
  } catch (error) {
    log(`❌ API hatası: ${cacheKey}`, error);

    // Expired cache'e bak
    const expiredCache = cacheManager.get<any>(cacheKey, true);
    if (expiredCache) {
      log(`⚠️ Expired cache kullanılıyor: ${cacheKey}`);
      return {
        data: expiredCache,
        fromCache: true,
        isOffline: false
      };
    }

    return { data: null, fromCache: false, isOffline: false };
  }
}

/**
 * Kurucu raporu cache'ini temizle
 */
export function invalidateFounderCache(): void {
  const keys = cacheManager.getKeys().filter(k => k.startsWith(CACHE_KEY));
  keys.forEach(key => cacheManager.invalidate(key));
  log('🗑️ Kurucu raporu cache temizlendi');
}
