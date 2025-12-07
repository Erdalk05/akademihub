'use client';

import { useEffect, useState } from 'react';

interface Breakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

/**
 * Custom hook for responsive design
 * Returns current breakpoint and window dimensions
 */
export const useResponsive = (): Breakpoints => {
  const [breakpoints, setBreakpoints] = useState<Breakpoints>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 0;
      const height = typeof window !== 'undefined' ? window.innerHeight : 0;

      setBreakpoints({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
        height,
      });
    };

    // Set initial value
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoints;
};

export default useResponsive;
