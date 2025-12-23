'use client';

/**
 * Students Prefetch
 * Dashboard veya sidebar'dan students sayfasına geçmeden önce
 * veriyi arka planda yükler
 */

import { cacheManager } from '@/lib/offline/cacheManager';

let isPrefetching = false;
let prefetchPromise: Promise<void> | null = null;

/**
 * Students verisini arka planda önceden yükle
 * Kullanıcı students sayfasına tıklamadan önce çağrılır
 */
export async function prefetchStudents(organizationId?: string): Promise<void> {
  // Zaten prefetch yapılıyorsa bekle
  if (isPrefetching && prefetchPromise) {
    return prefetchPromise;
  }

  // Cache zaten varsa prefetch yapma
  const cacheKey = `akademihub_students_${organizationId || 'ALL'}_all_1`;
  const existing = cacheManager.get(cacheKey);
  if (existing) {
    console.log('[PREFETCH] ✅ Students zaten cache\'de');
    return;
  }

  isPrefetching = true;
  console.log('[PREFETCH] 🚀 Students ön yükleme başladı...');

  prefetchPromise = (async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        page_size: '15',
        status_filter: 'all'
      });
      
      if (organizationId) {
        params.set('organization_id', organizationId);
      }

      const response = await fetch(`/api/students/list?${params.toString()}`, {
        priority: 'low' as any, // Düşük öncelik - kullanıcı etkileşimini engelleme
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          // Cache'e yaz
          cacheManager.set(cacheKey, {
            data: json.data,
            pagination: json.pagination,
            stats: json.stats
          }, { ttl: 10 * 60 * 1000, persist: true });
          
          console.log('[PREFETCH] ✅ Students ön yükleme tamamlandı:', json.data.length, 'öğrenci');
        }
      }
    } catch (error) {
      console.log('[PREFETCH] ⚠️ Students ön yükleme başarısız (önemli değil)');
    } finally {
      isPrefetching = false;
      prefetchPromise = null;
    }
  })();

  return prefetchPromise;
}

/**
 * Link hover olduğunda prefetch başlat
 * Sidebar veya navigation'da kullanılır
 */
export function usePrefetchOnHover(organizationId?: string) {
  let timeoutId: NodeJS.Timeout | null = null;

  const onMouseEnter = () => {
    // 100ms bekle (yanlışlıkla hover'ı önle)
    timeoutId = setTimeout(() => {
      prefetchStudents(organizationId);
    }, 100);
  };

  const onMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { onMouseEnter, onMouseLeave };
}

