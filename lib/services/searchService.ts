'use client';

// Mock students data (sadece Supabase erişimi başarısız olursa yedek olarak kullanılır)
const getMockStudents = () => [
    {
      id: 'STU-2025-0001',
    first_name: 'Ahmet',
    last_name: 'Yılmaz',
    student_no: 'STU-2025-0001',
    tc_id: '12345678901',
    class: '9-A',
    },
    {
      id: 'STU-2025-0002',
    first_name: 'Ayşe',
    last_name: 'Demir',
    student_no: 'STU-2025-0002',
    tc_id: '12345678902',
    class: '9-B',
    },
    {
      id: 'STU-2025-0003',
    first_name: 'Mehmet',
    last_name: 'Kaya',
    student_no: 'STU-2025-0003',
    tc_id: '12345678903',
    class: '10-A',
    },
  ];

let studentsCache: any[] | null = null;

const loadStudents = async () => {
  if (studentsCache) return studentsCache;
  try {
    const res = await fetch('/api/students', { cache: 'no-store' });
    const js = await res.json().catch(() => null);
    if (js?.success && Array.isArray(js.data)) {
      studentsCache = js.data;
      return studentsCache;
    }
    studentsCache = getMockStudents();
    return studentsCache;
  } catch {
    studentsCache = getMockStudents();
    return studentsCache;
  }
};

export interface SearchResult {
  id: string;
  type: 'student' | 'payment' | 'expense' | 'course';
  title: string;
  subtitle?: string;
  href: string;
  icon?: string;
  metadata?: Record<string, string>;
}

export const searchService = {
  /**
   * Global arama - tüm modüllerde ara
   */
  globalSearch: async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // 1. ÖĞRENCI ARAMA
    const students = await loadStudents();
    students.forEach((student: any) => {
      const fullName =
        `${student.first_name || student.name || ''} ${student.last_name || ''}`.trim() ||
        student.full_name ||
        student.parent_name ||
        '';
      const studentNo =
        student.student_no || student.studentNo || student.ogrenciNo || '';
      const tc =
        student.tc_id || student.tcKimlik || '';

      if (
        fullName.toLowerCase().includes(lowerQuery) ||
        String(studentNo).toLowerCase().includes(lowerQuery) ||
        String(tc).includes(query)
      ) {
        results.push({
          id: student.id,
          type: 'student',
          title: fullName || 'Öğrenci',
          subtitle: `${student.class_name || student.class || ''} • ${studentNo}`,
          href: `/students/${student.id}`,
          icon: '👤',
          metadata: {
            class: student.class_name || student.class || '',
            studentNo: String(studentNo),
          },
        });
      }
    });

    // 2. ÖDEME ARAMA (Mock payment data)
    const mockPaymentsData = [
      {
        id: 'PAY-2025-0001',
        student: 'Ahmet Yılmaz',
        amount: 12750,
        status: 'Tamamlandı',
      },
      {
        id: 'PAY-2025-0002',
        student: 'Ayşe Demir',
        amount: 25500,
        status: 'Beklemede',
      },
    ];

    mockPaymentsData.forEach((payment) => {
      if (
        payment.id.includes(query) ||
        payment.student.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: payment.id,
          type: 'payment',
          title: `Ödeme: ${payment.id}`,
          subtitle: `${payment.student} • ₺${payment.amount}`,
          href: '/finance/payments',
          icon: '💳',
          metadata: {
            status: payment.status,
            amount: `₺${payment.amount}`,
          },
        });
      }
    });

    // 3. KURS ARAMA (Mock data)
    const mockCourses = [
      { id: 'C001', name: 'Matematik', code: 'MAT-101' },
      { id: 'C002', name: 'Fizik', code: 'PHY-101' },
      { id: 'C003', name: 'Türkçe', code: 'TUR-101' },
      { id: 'C004', name: 'İngilizce', code: 'ENG-101' },
    ];

    mockCourses.forEach((course) => {
      if (
        course.name.toLowerCase().includes(lowerQuery) ||
        course.code.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: course.id,
          type: 'course',
          title: `Kurs: ${course.name}`,
          subtitle: course.code,
          href: '/exams',
          icon: '📚',
        });
      }
    });

    return results.slice(0, 8); // Max 8 sonuç
  },

  /**
   * Öğrenci spesifik arama
   */
  searchStudents: async (query: string) => {
    const lowerQuery = query.toLowerCase();
    const students = await loadStudents();
    return students.filter((s: any) => {
      const fullName =
        `${s.first_name || s.name || ''} ${s.last_name || ''}`.trim() ||
        s.full_name ||
        s.parent_name ||
        '';
      const studentNo =
        s.student_no || s.studentNo || s.ogrenciNo || '';
      return (
        fullName.toLowerCase().includes(lowerQuery) ||
        String(studentNo).toLowerCase().includes(lowerQuery)
    );
    });
  },

  /**
   * Ödeme spesifik arama
   */
  searchPayments: async (query: string) => {
    const mockPaymentsData = [
      {
        id: 'PAY-2025-0001',
        student: 'Ahmet Yılmaz',
        amount: 12750,
        status: 'Tamamlandı',
      },
      {
        id: 'PAY-2025-0002',
        student: 'Ayşe Demir',
        amount: 25500,
        status: 'Beklemede',
      },
    ];

    return mockPaymentsData.filter(
      (p) =>
        p.id.includes(query) ||
        p.student.toLowerCase().includes(query.toLowerCase())
    );
  },

  /**
   * Debounced search - 300ms gecikme
   */
  debounce: <T extends (...args: any[]) => Promise<any>>(
    func: T,
    delay: number = 300
  ) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      return new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(func(...args)), delay);
      });
    };
  },

  /**
   * Recent searches - localStorage'dan
   */
  getRecentSearches: () => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('recentSearches');
    return stored ? JSON.parse(stored) : [];
  },

  /**
   * Save recent search
   */
  saveRecentSearch: (query: string) => {
    if (typeof window === 'undefined') return;
    const recent = searchService.getRecentSearches();
    const filtered = recent.filter((q: string) => q !== query);
    const updated = [query, ...filtered].slice(0, 5); // Max 5
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  },

  /**
   * Clear recent searches
   */
  clearRecentSearches: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('recentSearches');
  },
};
