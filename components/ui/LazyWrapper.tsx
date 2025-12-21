'use client';

import { ReactNode, memo } from 'react';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';

interface LazyWrapperProps {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  minHeight?: string | number; // Layout shift önlemek için minimum yükseklik
}

/**
 * LazyWrapper - Component'i sadece viewport'a girdiğinde render eder
 * 
 * Kullanım:
 * <LazyWrapper placeholder={<Skeleton />}>
 *   <ExpensiveComponent />
 * </LazyWrapper>
 * 
 * Avantajlar:
 * - İlk yüklemede sadece görünür itemler render edilir
 * - Scroll'da yeni itemler lazy load edilir
 * - Memory ve CPU kullanımı azalır
 */
function LazyWrapperComponent({
  children,
  placeholder,
  rootMargin = '200px', // Viewport'a yaklaşmadan 200px önce yükle
  threshold = 0,
  className = '',
  minHeight = 'auto'
}: LazyWrapperProps) {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin,
    threshold,
    triggerOnce: true // Bir kez görünür olunca hep görünür kal
  });
  
  return (
    <div 
      ref={ref} 
      className={className}
      style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
    >
      {isVisible ? children : (placeholder || <DefaultPlaceholder />)}
    </div>
  );
}

// Default placeholder - basit skeleton
function DefaultPlaceholder() {
  return (
    <div className="animate-pulse bg-gray-100 rounded-lg h-16 w-full" />
  );
}

// memo ile gereksiz re-render'ları önle
export const LazyWrapper = memo(LazyWrapperComponent);

export default LazyWrapper;
