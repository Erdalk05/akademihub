/**
 * ============================================
 * AkademiHub - Sınav Türleri Tanımları
 * ============================================
 * 
 * LGS, TYT, AYT ve diğer sınav türlerinin
 * temel yapılandırmaları
 */

// ==================== TYPES ====================

export type ExamType = 'LGS' | 'TYT' | 'AYT' | 'DENEME' | 'OKUL' | 'OZEL';

export type SubjectCode = 
  // LGS Dersleri
  | 'TUR' | 'MAT' | 'FEN' | 'SOS' | 'DIN' | 'ING'
  // TYT Dersleri
  | 'TYT_TUR' | 'TYT_MAT' | 'TYT_FEN' | 'TYT_SOS'
  // AYT Dersleri (Sayısal)
  | 'AYT_MAT' | 'AYT_FIZ' | 'AYT_KIM' | 'AYT_BIY'
  // AYT Dersleri (Eşit Ağırlık)
  | 'AYT_EDEB' | 'AYT_TAR1' | 'AYT_COG1'
  // AYT Dersleri (Sözel)
  | 'AYT_TAR2' | 'AYT_COG2' | 'AYT_FEL' | 'AYT_DIN'
  // AYT Dil
  | 'AYT_YDT';

export type BookletType = 'A' | 'B' | 'C' | 'D';

export interface SubjectConfig {
  code: SubjectCode;
  name: string;
  shortName: string;
  questionCount: number;
  startQuestion: number;
  endQuestion: number;
  color: string;
  emoji: string;
}

export interface ExamTypeConfig {
  type: ExamType;
  name: string;
  fullName: string;
  description: string;
  totalQuestions: number;
  subjects: SubjectConfig[];
  bookletTypes: BookletType[];
  gradeLevel: number[];
  duration: number; // dakika
  emoji: string;
  color: string;
}

// ==================== LGS ====================

export const LGS_CONFIG: ExamTypeConfig = {
  type: 'LGS',
  name: 'LGS',
  fullName: 'Liselere Geçiş Sınavı',
  description: '8. sınıf öğrencileri için merkezi sınav',
  totalQuestions: 90,
  bookletTypes: ['A', 'B'],
  gradeLevel: [8],
  duration: 135, // 2 saat 15 dakika
  emoji: '🎓',
  color: 'indigo',
  subjects: [
    { code: 'TUR', name: 'Türkçe', shortName: 'TÜR', questionCount: 20, startQuestion: 1, endQuestion: 20, color: 'red', emoji: '📚' },
    { code: 'MAT', name: 'Matematik', shortName: 'MAT', questionCount: 20, startQuestion: 21, endQuestion: 40, color: 'blue', emoji: '🔢' },
    { code: 'FEN', name: 'Fen Bilimleri', shortName: 'FEN', questionCount: 20, startQuestion: 41, endQuestion: 60, color: 'green', emoji: '🔬' },
    { code: 'SOS', name: 'Sosyal Bilgiler', shortName: 'SOS', questionCount: 10, startQuestion: 61, endQuestion: 70, color: 'amber', emoji: '🌍' },
    { code: 'DIN', name: 'Din Kültürü', shortName: 'DİN', questionCount: 10, startQuestion: 71, endQuestion: 80, color: 'purple', emoji: '📖' },
    { code: 'ING', name: 'İngilizce', shortName: 'İNG', questionCount: 10, startQuestion: 81, endQuestion: 90, color: 'teal', emoji: '🌐' }
  ]
};

// ==================== TYT ====================

export const TYT_CONFIG: ExamTypeConfig = {
  type: 'TYT',
  name: 'TYT',
  fullName: 'Temel Yeterlilik Testi',
  description: 'YKS 1. oturum - Tüm adaylar için zorunlu',
  totalQuestions: 120,
  bookletTypes: ['A', 'B'],
  gradeLevel: [12],
  duration: 135, // 2 saat 15 dakika
  emoji: '📝',
  color: 'blue',
  subjects: [
    { code: 'TYT_TUR', name: 'Türkçe', shortName: 'TÜR', questionCount: 40, startQuestion: 1, endQuestion: 40, color: 'red', emoji: '📚' },
    { code: 'TYT_SOS', name: 'Sosyal Bilimler', shortName: 'SOS', questionCount: 20, startQuestion: 41, endQuestion: 60, color: 'amber', emoji: '🌍' },
    { code: 'TYT_MAT', name: 'Temel Matematik', shortName: 'MAT', questionCount: 40, startQuestion: 61, endQuestion: 100, color: 'blue', emoji: '🔢' },
    { code: 'TYT_FEN', name: 'Fen Bilimleri', shortName: 'FEN', questionCount: 20, startQuestion: 101, endQuestion: 120, color: 'green', emoji: '🔬' }
  ]
};

// ==================== AYT (SAYISAL) ====================

export const AYT_SAYISAL_CONFIG: ExamTypeConfig = {
  type: 'AYT',
  name: 'AYT-SAY',
  fullName: 'Alan Yeterlilik Testi - Sayısal',
  description: 'YKS 2. oturum - Sayısal alan',
  totalQuestions: 80,
  bookletTypes: ['A', 'B'],
  gradeLevel: [12],
  duration: 180, // 3 saat
  emoji: '🔬',
  color: 'emerald',
  subjects: [
    { code: 'AYT_MAT', name: 'Matematik', shortName: 'MAT', questionCount: 40, startQuestion: 1, endQuestion: 40, color: 'blue', emoji: '🔢' },
    { code: 'AYT_FIZ', name: 'Fizik', shortName: 'FİZ', questionCount: 14, startQuestion: 41, endQuestion: 54, color: 'purple', emoji: '⚡' },
    { code: 'AYT_KIM', name: 'Kimya', shortName: 'KİM', questionCount: 13, startQuestion: 55, endQuestion: 67, color: 'pink', emoji: '🧪' },
    { code: 'AYT_BIY', name: 'Biyoloji', shortName: 'BİY', questionCount: 13, startQuestion: 68, endQuestion: 80, color: 'green', emoji: '🧬' }
  ]
};

// ==================== AYT (EŞİT AĞIRLIK) ====================

export const AYT_EA_CONFIG: ExamTypeConfig = {
  type: 'AYT',
  name: 'AYT-EA',
  fullName: 'Alan Yeterlilik Testi - Eşit Ağırlık',
  description: 'YKS 2. oturum - Eşit ağırlık alan',
  totalQuestions: 80,
  bookletTypes: ['A', 'B'],
  gradeLevel: [12],
  duration: 180,
  emoji: '⚖️',
  color: 'amber',
  subjects: [
    { code: 'AYT_MAT', name: 'Matematik', shortName: 'MAT', questionCount: 40, startQuestion: 1, endQuestion: 40, color: 'blue', emoji: '🔢' },
    { code: 'AYT_EDEB', name: 'Edebiyat', shortName: 'EDB', questionCount: 24, startQuestion: 41, endQuestion: 64, color: 'red', emoji: '📜' },
    { code: 'AYT_TAR1', name: 'Tarih-1', shortName: 'TAR', questionCount: 10, startQuestion: 65, endQuestion: 74, color: 'amber', emoji: '🏛️' },
    { code: 'AYT_COG1', name: 'Coğrafya-1', shortName: 'COĞ', questionCount: 6, startQuestion: 75, endQuestion: 80, color: 'green', emoji: '🌍' }
  ]
};

// ==================== AYT (SÖZEL) ====================

export const AYT_SOZEL_CONFIG: ExamTypeConfig = {
  type: 'AYT',
  name: 'AYT-SÖZ',
  fullName: 'Alan Yeterlilik Testi - Sözel',
  description: 'YKS 2. oturum - Sözel alan',
  totalQuestions: 80,
  bookletTypes: ['A', 'B'],
  gradeLevel: [12],
  duration: 180,
  emoji: '📚',
  color: 'rose',
  subjects: [
    { code: 'AYT_EDEB', name: 'Edebiyat', shortName: 'EDB', questionCount: 24, startQuestion: 1, endQuestion: 24, color: 'red', emoji: '📜' },
    { code: 'AYT_TAR1', name: 'Tarih-1', shortName: 'TAR', questionCount: 10, startQuestion: 25, endQuestion: 34, color: 'amber', emoji: '🏛️' },
    { code: 'AYT_COG1', name: 'Coğrafya-1', shortName: 'COĞ', questionCount: 6, startQuestion: 35, endQuestion: 40, color: 'green', emoji: '🌍' },
    { code: 'AYT_TAR2', name: 'Tarih-2', shortName: 'TAR2', questionCount: 11, startQuestion: 41, endQuestion: 51, color: 'orange', emoji: '📜' },
    { code: 'AYT_COG2', name: 'Coğrafya-2', shortName: 'COĞ2', questionCount: 11, startQuestion: 52, endQuestion: 62, color: 'teal', emoji: '🗺️' },
    { code: 'AYT_FEL', name: 'Felsefe', shortName: 'FEL', questionCount: 12, startQuestion: 63, endQuestion: 74, color: 'purple', emoji: '🤔' },
    { code: 'AYT_DIN', name: 'Din Kültürü', shortName: 'DİN', questionCount: 6, startQuestion: 75, endQuestion: 80, color: 'indigo', emoji: '📖' }
  ]
};

// ==================== DENEME SINAVI ====================

export const DENEME_CONFIG: ExamTypeConfig = {
  type: 'DENEME',
  name: 'Deneme',
  fullName: 'Deneme Sınavı',
  description: 'Kurum içi deneme sınavı',
  totalQuestions: 0, // Özelleştirilebilir
  bookletTypes: ['A', 'B', 'C', 'D'],
  gradeLevel: [5, 6, 7, 8, 9, 10, 11, 12],
  duration: 120,
  emoji: '📋',
  color: 'slate',
  subjects: [] // Özelleştirilebilir
};

// ==================== OKUL SINAVI ====================

export const OKUL_CONFIG: ExamTypeConfig = {
  type: 'OKUL',
  name: 'Okul',
  fullName: 'Okul Sınavı',
  description: 'Tek derslik okul sınavı',
  totalQuestions: 0, // Özelleştirilebilir
  bookletTypes: ['A', 'B'],
  gradeLevel: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  duration: 40,
  emoji: '🏫',
  color: 'gray',
  subjects: [] // Özelleştirilebilir
};

// ==================== ALL CONFIGS ====================

export const ALL_EXAM_CONFIGS: Record<string, ExamTypeConfig> = {
  'LGS': LGS_CONFIG,
  'TYT': TYT_CONFIG,
  'AYT-SAY': AYT_SAYISAL_CONFIG,
  'AYT-EA': AYT_EA_CONFIG,
  'AYT-SOZ': AYT_SOZEL_CONFIG,
  'DENEME': DENEME_CONFIG,
  'OKUL': OKUL_CONFIG
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Soru sayısına göre sınav türü tahmin et
 */
export function detectExamType(questionCount: number): ExamTypeConfig | null {
  if (questionCount === 90) return LGS_CONFIG;
  if (questionCount === 120) return TYT_CONFIG;
  if (questionCount === 80) return AYT_SAYISAL_CONFIG; // veya EA/Sözel
  if (questionCount >= 10 && questionCount <= 50) return OKUL_CONFIG;
  return DENEME_CONFIG;
}

/**
 * Cevap stringini derslere göre böl
 */
export function splitAnswersBySubjects(
  answers: string, 
  config: ExamTypeConfig
): Record<SubjectCode, string> {
  const result: Record<string, string> = {};
  
  for (const subject of config.subjects) {
    const start = subject.startQuestion - 1;
    const end = subject.endQuestion;
    result[subject.code] = answers.substring(start, end);
  }
  
  return result as Record<SubjectCode, string>;
}

/**
 * Ders kodundan ders adı al
 */
export function getSubjectName(code: SubjectCode): string {
  const allSubjects = [
    ...LGS_CONFIG.subjects,
    ...TYT_CONFIG.subjects,
    ...AYT_SAYISAL_CONFIG.subjects,
    ...AYT_EA_CONFIG.subjects,
    ...AYT_SOZEL_CONFIG.subjects
  ];
  
  const subject = allSubjects.find(s => s.code === code);
  return subject?.name || code;
}

/**
 * Sınıf seviyesine göre uygun sınav türlerini getir
 */
export function getExamTypesForGrade(grade: number): ExamTypeConfig[] {
  return Object.values(ALL_EXAM_CONFIGS).filter(config => 
    config.gradeLevel.includes(grade)
  );
}

