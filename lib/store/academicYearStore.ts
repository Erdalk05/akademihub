'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Eğitim yıllarını oluştur (son 5 yıl + gelecek 2 yıl)
const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // Eylül ve sonrası ise yeni eğitim yılındayız
  const startYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  
  const years: string[] = [];
  for (let i = -3; i <= 2; i++) {
    const year = startYear + i;
    years.push(`${year}-${year + 1}`);
  }
  return years;
};

// Mevcut eğitim yılını hesapla
const getCurrentAcademicYear = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // Eylül (8) ve sonrası ise yeni eğitim yılındayız
  if (currentMonth >= 8) {
    return `${currentYear}-${currentYear + 1}`;
  }
  return `${currentYear - 1}-${currentYear}`;
};

interface AcademicYearState {
  selectedYear: string;
  availableYears: string[];
  setSelectedYear: (year: string) => void;
}

export const useAcademicYearStore = create<AcademicYearState>()(
  persist(
    (set) => ({
      selectedYear: getCurrentAcademicYear(),
      availableYears: generateAcademicYears(),
      setSelectedYear: (year) => set({ selectedYear: year }),
    }),
    {
      name: 'academic-year-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    }
  )
);

export { getCurrentAcademicYear, generateAcademicYears };

