'use client';

import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean; // true = sadece bir kez tetikle, sonra unobserve et
}

/**
 * IntersectionObserver hook - element viewport'a girdiğinde tetiklenir
 * Lazy loading ve virtualization için kullanılır
 * 
 * @param options - threshold, rootMargin, triggerOnce
 * @returns [ref, isVisible] - element ref'i ve görünürlük durumu
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T>, boolean] {
  const { threshold = 0, rootMargin = '100px', triggerOnce = true } = options;
  
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    // Zaten görünür ve triggerOnce aktifse, observer'a gerek yok
    if (isVisible && triggerOnce) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // Sadece bir kez tetiklenecekse, unobserve et (performans için)
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, isVisible]);
  
  return [ref, isVisible];
}

export default useIntersectionObserver;
