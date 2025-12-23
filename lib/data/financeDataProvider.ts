/**
 * Finance Data Provider
 * Finans verileri için akıllı cache katmanı - Online/Offline destekli
 */

import { cacheManager } from '@/lib/offline/cacheManager';
import { networkStatus } from '@/lib/offline/networkStatus';

// Cache key'leri
const CACHE_KEYS = {
  INSTALLMENTS: 'finance_installments',
  EXPENSES: 'finance_expenses',
  OTHER_INCOME: 'finance_other_income',
  DASHBOARD: 'finance_dashboard'
};

// TTL değerleri
const TTL = {
  INSTALLMENTS: 5 * 60 * 1000, // 5 dakika
  EXPENSES: 10 * 60 * 1000,    // 10 dakika
  DASHBOARD: 3 * 60 * 1000     // 3 dakika
};

function log(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[FINANCE-DATA] ${message}`, data || '');
  }
}

interface CacheResponse<T> {
  data: T;
  fromCache: boolean;
  isOffline: boolean;
}

/**
 * Generic fetch with cache
 */
async function fetchWithCache<T>(
  cacheKey: string,
  apiUrl: string,
  ttl: number,
  forceRefresh: boolean = false
): Promise<CacheResponse<T | null>> {
  // 1. Cache'e bak (force refresh değilse)
  if (!forceRefresh) {
    const cached = cacheManager.get<T>(cacheKey, networkStatus.isOffline);
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
    const response = await fetch(apiUrl, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      // Cache'e yaz
      cacheManager.set(cacheKey, result.data, { ttl, persistToStorage: true });
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
    const expiredCache = cacheManager.get<T>(cacheKey, true);
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
 * Taksit verilerini getir
 */
export async function getInstallmentsCached(
  organizationId?: string,
  options: { forceRefresh?: boolean } = {}
): Promise<CacheResponse<any[]>> {
  const cacheKey = `${CACHE_KEYS.INSTALLMENTS}_${organizationId || 'all'}`;
  const orgParam = organizationId ? `?organization_id=${organizationId}` : '';
  
  const result = await fetchWithCache<any[]>(
    cacheKey,
    `/api/installments${orgParam}`,
    TTL.INSTALLMENTS,
    options.forceRefresh
  );

  return {
    data: result.data || [],
    fromCache: result.fromCache,
    isOffline: result.isOffline
  };
}

/**
 * Gider verilerini getir
 */
export async function getExpensesCached(
  organizationId?: string,
  options: { forceRefresh?: boolean } = {}
): Promise<CacheResponse<any[]>> {
  const cacheKey = `${CACHE_KEYS.EXPENSES}_${organizationId || 'all'}`;
  const orgParam = organizationId ? `?organization_id=${organizationId}` : '';
  
  const result = await fetchWithCache<any[]>(
    cacheKey,
    `/api/finance/expenses${orgParam}`,
    TTL.EXPENSES,
    options.forceRefresh
  );

  return {
    data: result.data || [],
    fromCache: result.fromCache,
    isOffline: result.isOffline
  };
}

/**
 * Diğer gelir verilerini getir
 */
export async function getOtherIncomeCached(
  organizationId?: string,
  options: { forceRefresh?: boolean } = {}
): Promise<CacheResponse<any[]>> {
  const cacheKey = `${CACHE_KEYS.OTHER_INCOME}_${organizationId || 'all'}`;
  const orgParam = organizationId ? `?organization_id=${organizationId}` : '';
  
  const result = await fetchWithCache<any[]>(
    cacheKey,
    `/api/finance/other-income${orgParam}`,
    TTL.EXPENSES,
    options.forceRefresh
  );

  return {
    data: result.data || [],
    fromCache: result.fromCache,
    isOffline: result.isOffline
  };
}

/**
 * Dashboard verilerini getir
 */
export async function getDashboardDataCached(
  organizationId?: string,
  options: { forceRefresh?: boolean } = {}
): Promise<CacheResponse<any>> {
  const cacheKey = `${CACHE_KEYS.DASHBOARD}_${organizationId || 'all'}`;
  const orgParam = organizationId ? `?organization_id=${organizationId}` : '';
  
  const result = await fetchWithCache<any>(
    cacheKey,
    `/api/finance/dashboard${orgParam}`,
    TTL.DASHBOARD,
    options.forceRefresh
  );

  return {
    data: result.data,
    fromCache: result.fromCache,
    isOffline: result.isOffline
  };
}

/**
 * Finans cache'ini temizle
 */
export function invalidateFinanceCache(): void {
  Object.values(CACHE_KEYS).forEach(prefix => {
    const keys = cacheManager.getKeys().filter(k => k.startsWith(prefix));
    keys.forEach(key => cacheManager.invalidate(key));
  });
  log('🗑️ Finans cache temizlendi');
}

/**
 * Belirli bir cache'i temizle
 */
export function invalidateSpecificCache(type: 'installments' | 'expenses' | 'other_income' | 'dashboard'): void {
  const prefix = CACHE_KEYS[type.toUpperCase() as keyof typeof CACHE_KEYS];
  const keys = cacheManager.getKeys().filter(k => k.startsWith(prefix));
  keys.forEach(key => cacheManager.invalidate(key));
  log(`🗑️ ${type} cache temizlendi`);
}
