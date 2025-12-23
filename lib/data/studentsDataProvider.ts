/**
 * Students Data Provider
 * Akıllı veri katmanı - Online/Offline mod destekli
 * 
 * Davranış:
 * - İlk yükleme: localStorage'dan ANINDA göster
 * - ONLINE: Arka planda API'den çeker, cache günceller
 * - OFFLINE: Cache'den okur
 * - Cache: 10 dakika geçerli, localStorage'da kalıcı
 */

import { cacheManager } from '@/lib/offline/cacheManager';
import { networkStatus } from '@/lib/offline/networkStatus';

// Cache key'leri
const CACHE_KEYS = {
  STUDENTS_LIST: 'students_list',
  STUDENTS_STATS: 'students_stats',
  STUDENTS_PAGINATION: 'students_pagination'
};

// TTL değerleri - daha uzun cache süresi
const TTL = {
  STUDENTS: 10 * 60 * 1000, // 10 dakika (daha uzun)
  STATS: 15 * 60 * 1000     // 15 dakika
};

export interface StudentListParams {
  organizationId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  class?: string;
}

export interface StudentListResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    passive: number;
    deleted: number;
  };
  fromCache: boolean;
  isOffline: boolean;
}

function log(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DATA] ${message}`, data || '');
  }
}

/**
 * Cache key oluştur (parametrelere göre)
 */
function getCacheKey(params: StudentListParams): string {
  const { organizationId, page = 1, limit = 25, search = '', status = '', class: cls = '' } = params;
  return `${CACHE_KEYS.STUDENTS_LIST}_${organizationId}_${page}_${limit}_${search}_${status}_${cls}`;
}

/**
 * Öğrenci listesini getir (cache destekli)
 */
export async function getStudentsCached(
  params: StudentListParams,
  options: { forceRefresh?: boolean } = {}
): Promise<StudentListResponse> {
  const cacheKey = getCacheKey(params);
  const { forceRefresh = false } = options;

  // 1. Online değilse veya force refresh değilse cache'e bak
  if (!forceRefresh) {
    // Offline modda expired cache'i de kabul et
    const cached = cacheManager.get<StudentListResponse>(
      cacheKey, 
      networkStatus.isOffline
    );
    
    if (cached) {
      log(`✅ Cache'den yüklendi: ${cacheKey}`, { 
        count: cached.data?.length,
        isOffline: networkStatus.isOffline 
      });
      return {
        ...cached,
        fromCache: true,
        isOffline: networkStatus.isOffline
      };
    }
  }

  // 2. Offline ve cache yok → boş döndür
  if (networkStatus.isOffline) {
    log(`📴 Offline mod - cache bulunamadı: ${cacheKey}`);
    return {
      data: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
      stats: { total: 0, active: 0, passive: 0, deleted: 0 },
      fromCache: false,
      isOffline: true
    };
  }

  // 3. Online → API'den çek
  try {
    log(`🌐 API'den yükleniyor: ${cacheKey}`);
    
    const queryParams = new URLSearchParams();
    if (params.organizationId) queryParams.set('organization_id', params.organizationId);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.class) queryParams.set('class', params.class);

    const response = await fetch(`/api/students/list?${queryParams.toString()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const responseData: StudentListResponse = {
        data: result.data || [],
        pagination: result.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 },
        stats: result.stats || { total: 0, active: 0, passive: 0, deleted: 0 },
        fromCache: false,
        isOffline: false
      };

      // Cache'e yaz
      cacheManager.set(cacheKey, responseData, { 
        ttl: TTL.STUDENTS,
        persistToStorage: true 
      });

      log(`✅ API'den yüklendi ve cache'lendi: ${cacheKey}`, { count: responseData.data.length });
      return responseData;
    }

    throw new Error(result.error || 'Unknown error');
  } catch (error) {
    log(`❌ API hatası: ${cacheKey}`, error);
    
    // Hata durumunda expired cache'e de bak
    const expiredCache = cacheManager.get<StudentListResponse>(cacheKey, true);
    if (expiredCache) {
      log(`⚠️ Expired cache kullanılıyor: ${cacheKey}`);
      return {
        ...expiredCache,
        fromCache: true,
        isOffline: false
      };
    }

    // Hiç cache yoksa boş döndür
    return {
      data: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
      stats: { total: 0, active: 0, passive: 0, deleted: 0 },
      fromCache: false,
      isOffline: false
    };
  }
}

/**
 * Öğrenci cache'ini temizle
 */
export function invalidateStudentsCache(): void {
  const keys = cacheManager.getKeys().filter(k => k.startsWith(CACHE_KEYS.STUDENTS_LIST));
  keys.forEach(key => cacheManager.invalidate(key));
  log('🗑️ Öğrenci cache temizlendi');
}

/**
 * Belirli bir öğrenciyi cache'den getir
 */
export function getStudentFromCache(studentId: string): any | null {
  const keys = cacheManager.getKeys().filter(k => k.startsWith(CACHE_KEYS.STUDENTS_LIST));
  
  for (const key of keys) {
    const cached = cacheManager.get<StudentListResponse>(key, true);
    if (cached?.data) {
      const student = cached.data.find((s: any) => s.id === studentId);
      if (student) {
        log(`✅ Öğrenci cache'den bulundu: ${studentId}`);
        return student;
      }
    }
  }
  
  return null;
}

/**
 * Cache durumunu al
 */
export function getCacheStatus(): {
  hasCache: boolean;
  cacheKeys: string[];
  isOnline: boolean;
} {
  const keys = cacheManager.getKeys().filter(k => k.startsWith(CACHE_KEYS.STUDENTS_LIST));
  return {
    hasCache: keys.length > 0,
    cacheKeys: keys,
    isOnline: networkStatus.isOnline
  };
}
