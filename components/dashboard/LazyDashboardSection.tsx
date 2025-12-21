'use client';

import { ReactNode, memo, Suspense } from 'react';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';

interface LazyDashboardSectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: number;
  id?: string;
}

// Default skeleton for dashboard sections
const DefaultSkeleton = ({ minHeight = 200 }: { minHeight?: number }) => (
  <div 
    className="animate-pulse bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100"
    style={{ minHeight }}
  >
    <div className="p-6 space-y-4">
      <div className="h-4 bg-emerald-200/50 rounded w-1/3"></div>
      <div className="h-8 bg-emerald-100/50 rounded w-2/3"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-emerald-100/30 rounded-xl"></div>
        <div className="h-24 bg-emerald-100/30 rounded-xl"></div>
      </div>
    </div>
  </div>
);

/**
 * LazyDashboardSection - Dashboard bölümlerini lazy load eder
 * 
 * Viewport'a girene kadar skeleton gösterir
 * Mobilde özellikle etkili - sayfa açılışında sadece görünür bölümler render edilir
 */
function LazyDashboardSectionComponent({
  children,
  fallback,
  rootMargin = '200px', // 200px önce yüklemeye başla
  minHeight = 200,
  id
}: LazyDashboardSectionProps) {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin,
    triggerOnce: true
  });

  if (!isVisible) {
    return (
      <div ref={ref} style={{ minHeight }} id={id}>
        {fallback || <DefaultSkeleton minHeight={minHeight} />}
      </div>
    );
  }

  // Görünür olduğunda console'a log at (debug için)
  if (id) {
    console.debug(`[DASHBOARD] ✅ Section visible: ${id}`);
  }

  return (
    <div ref={ref} id={id}>
      <Suspense fallback={fallback || <DefaultSkeleton minHeight={minHeight} />}>
        {children}
      </Suspense>
    </div>
  );
}

export const LazyDashboardSection = memo(LazyDashboardSectionComponent);

export default LazyDashboardSection;
