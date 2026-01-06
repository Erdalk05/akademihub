/**
 * ============================================
 * AkademiHub - Sınav Türleri ve Şablonları
 * ============================================
 * 
 * LGS, TYT, AYT tam destek
 * Katsayılar ve net hesaplama kuralları
 */

// ==================== TYPES ====================

export interface SubjectConfig {
  code: string;
  name: string;
  questionCount: number;
  coefficient: number; // Katsayı
  color: string;
}

export interface ExamTypeConfig {
  id: string;
  name: string;
  totalQuestions: number;
  wrongDivisor: number; // LGS: 3, YKS: 4
  duration: number; // dakika
  subjects: SubjectConfig[];
  description: string;
}

// ==================== LGS ŞABLONU ====================

export const LGS_CONFIG: ExamTypeConfig = {
  id: 'lgs',
  name: 'LGS (Liseye Geçiş Sınavı)',
  totalQuestions: 90,
  wrongDivisor: 3, // 3 yanlış = 1 doğru
  duration: 155, // 75 + 80 dakika
  description: '8. sınıf merkezi sınav • 3 yanlış 1 doğru götürür',
  subjects: [
    // 1. OTURUM - SÖZEL (75 dk)
    { code: 'TUR', name: 'Türkçe', questionCount: 20, coefficient: 4, color: '#3B82F6' },
    { code: 'INK', name: 'T.C. İnkılap Tarihi', questionCount: 10, coefficient: 1, color: '#8B5CF6' },
    { code: 'DIN', name: 'Din Kültürü', questionCount: 10, coefficient: 1, color: '#F59E0B' },
    { code: 'ING', name: 'Yabancı Dil', questionCount: 10, coefficient: 1, color: '#EC4899' },
    // 2. OTURUM - SAYISAL (80 dk)
    { code: 'MAT', name: 'Matematik', questionCount: 20, coefficient: 4, color: '#EF4444' },
    { code: 'FEN', name: 'Fen Bilimleri', questionCount: 20, coefficient: 4, color: '#10B981' },
  ]
};

// ==================== TYT ŞABLONU ====================

export const TYT_CONFIG: ExamTypeConfig = {
  id: 'tyt',
  name: 'TYT (Temel Yeterlilik Testi)',
  totalQuestions: 120,
  wrongDivisor: 4, // 4 yanlış = 1 doğru
  duration: 165,
  description: 'Üniversite giriş • 4 yanlış 1 doğru götürür',
  subjects: [
    { code: 'TUR', name: 'Türkçe', questionCount: 40, coefficient: 2.90, color: '#3B82F6' },
    { code: 'MAT', name: 'Temel Matematik', questionCount: 40, coefficient: 2.92, color: '#EF4444' },
    // Fen Bilimleri (20 soru)
    { code: 'FIZ', name: 'Fizik', questionCount: 7, coefficient: 3.14, color: '#10B981' },
    { code: 'KIM', name: 'Kimya', questionCount: 7, coefficient: 3.14, color: '#14B8A6' },
    { code: 'BIY', name: 'Biyoloji', questionCount: 6, coefficient: 3.14, color: '#22C55E' },
    // Sosyal Bilimler (20 soru)
    { code: 'TAR', name: 'Tarih', questionCount: 5, coefficient: 2.93, color: '#F59E0B' },
    { code: 'COG', name: 'Coğrafya', questionCount: 5, coefficient: 2.93, color: '#8B5CF6' },
    { code: 'FEL', name: 'Felsefe', questionCount: 5, coefficient: 2.93, color: '#EC4899' },
    { code: 'DIN', name: 'Din Kültürü', questionCount: 5, coefficient: 2.93, color: '#6366F1' },
  ]
};

// ==================== AYT SAYISAL ŞABLONU ====================

export const AYT_SAY_CONFIG: ExamTypeConfig = {
  id: 'ayt-say',
  name: 'AYT Sayısal',
  totalQuestions: 80,
  wrongDivisor: 4,
  duration: 180,
  description: 'Sayısal alan • Mühendislik, Tıp, Fen',
  subjects: [
    { code: 'MAT', name: 'Matematik', questionCount: 40, coefficient: 3.00, color: '#EF4444' },
    { code: 'FIZ', name: 'Fizik', questionCount: 14, coefficient: 2.85, color: '#3B82F6' },
    { code: 'KIM', name: 'Kimya', questionCount: 13, coefficient: 3.07, color: '#10B981' },
    { code: 'BIY', name: 'Biyoloji', questionCount: 13, coefficient: 3.07, color: '#14B8A6' },
  ]
};

// ==================== AYT EŞİT AĞIRLIK ŞABLONU ====================

export const AYT_EA_CONFIG: ExamTypeConfig = {
  id: 'ayt-ea',
  name: 'AYT Eşit Ağırlık',
  totalQuestions: 80,
  wrongDivisor: 4,
  duration: 180,
  description: 'Eşit ağırlık • Hukuk, İktisat, İşletme',
  subjects: [
    { code: 'MAT', name: 'Matematik', questionCount: 40, coefficient: 3.00, color: '#EF4444' },
    { code: 'EDE', name: 'Türk Dili ve Edebiyatı', questionCount: 24, coefficient: 3.00, color: '#3B82F6' },
    { code: 'TAR1', name: 'Tarih-1', questionCount: 10, coefficient: 2.80, color: '#F59E0B' },
    { code: 'COG1', name: 'Coğrafya-1', questionCount: 6, coefficient: 3.33, color: '#8B5CF6' },
  ]
};

// ==================== AYT SÖZEL ŞABLONU ====================

export const AYT_SOZ_CONFIG: ExamTypeConfig = {
  id: 'ayt-soz',
  name: 'AYT Sözel',
  totalQuestions: 80,
  wrongDivisor: 4,
  duration: 180,
  description: 'Sözel alan • Edebiyat, Tarih, Hukuk',
  subjects: [
    { code: 'EDE', name: 'Türk Dili ve Edebiyatı', questionCount: 24, coefficient: 3.00, color: '#3B82F6' },
    { code: 'TAR1', name: 'Tarih-1', questionCount: 10, coefficient: 2.80, color: '#F59E0B' },
    { code: 'COG1', name: 'Coğrafya-1', questionCount: 6, coefficient: 3.33, color: '#8B5CF6' },
    { code: 'TAR2', name: 'Tarih-2', questionCount: 11, coefficient: 2.91, color: '#EC4899' },
    { code: 'COG2', name: 'Coğrafya-2', questionCount: 11, coefficient: 2.91, color: '#6366F1' },
    { code: 'FEL', name: 'Felsefe Grubu', questionCount: 12, coefficient: 3.00, color: '#14B8A6' },
    { code: 'DIN', name: 'Din Kültürü', questionCount: 6, coefficient: 3.33, color: '#22C55E' },
  ]
};

// ==================== GENEL DENEME ŞABLONU ====================

export const DENEME_CONFIG: ExamTypeConfig = {
  id: 'deneme',
  name: 'Genel Deneme',
  totalQuestions: 0, // Manuel belirlenir
  wrongDivisor: 4,
  duration: 0,
  description: 'Özel deneme sınavı • Manuel ayar',
  subjects: []
};

// ==================== TÜM ŞABLONLAR ====================

export const ALL_EXAM_CONFIGS: ExamTypeConfig[] = [
  LGS_CONFIG,
  TYT_CONFIG,
  AYT_SAY_CONFIG,
  AYT_EA_CONFIG,
  AYT_SOZ_CONFIG,
  DENEME_CONFIG
];

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Net hesaplama
 * LGS: Net = Doğru - (Yanlış / 3)
 * YKS: Net = Doğru - (Yanlış / 4)
 */
export function calculateNet(correct: number, wrong: number, wrongDivisor: number): number {
  const net = correct - (wrong / wrongDivisor);
  return Math.round(net * 100) / 100;
}

/**
 * Ağırlıklı puan hesaplama
 */
export function calculateWeightedScore(
  subjectNets: Record<string, number>,
  subjects: SubjectConfig[]
): number {
  let totalScore = 0;
  
  subjects.forEach(subject => {
    const net = subjectNets[subject.code] || 0;
    totalScore += net * subject.coefficient;
  });
  
  return Math.round(totalScore * 100) / 100;
}

/**
 * Sınav türünü ID ile bul
 */
export function getExamConfigById(id: string): ExamTypeConfig | undefined {
  return ALL_EXAM_CONFIGS.find(config => config.id === id);
}

/**
 * Ders başlangıç pozisyonlarını hesapla
 */
export function calculateSubjectStartPositions(subjects: SubjectConfig[]): { code: string; start: number; end: number }[] {
  let currentStart = 1;
  
  return subjects.map(subject => {
    const result = {
      code: subject.code,
      start: currentStart,
      end: currentStart + subject.questionCount - 1
    };
    currentStart += subject.questionCount;
    return result;
  });
}
