/**
 * AkademiHub Core Types
 * Motor Dairesi - Temel Tip Tanımlamaları
 * 
 * Bu dosya tüm core modülleri için temel tipleri tanımlar.
 * Değişiklik yaparken dikkatli ol - tüm sistem bu tiplere bağlı!
 */

// ============================================
// 📋 SINAV TİPLERİ
// ============================================

export type ExamType = 'LGS' | 'TYT' | 'AYT' | 'DİL' | 'DENEME';

export type BookletType = 'A' | 'B' | 'C' | 'D';

export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E' | '' | null;

export type ParseStatus = 'SUCCESS' | 'CONFLICT' | 'PARTIAL' | 'FAILED';

// ============================================
// 📊 DERS YAPILANDIRMASI
// ============================================

export interface SubjectConfig {
  id: string;
  name: string;
  questionCount: number;
  coefficient: number; // LGS: 4 veya 1, YKS: değişken
  startIndex: number;  // Cevaplardaki başlangıç pozisyonu
  endIndex: number;    // Cevaplardaki bitiş pozisyonu
}

export interface ExamConfig {
  type: ExamType;
  name: string;
  totalQuestions: number;
  wrongPenalty: number; // LGS: 3, YKS: 4 (kaç yanlış 1 doğruyu götürür)
  subjects: SubjectConfig[];
  maxScore: number;
  bookletRotation?: Record<BookletType, number[]>; // Kitapçık dönüşüm tablosu
}

// ============================================
// 📥 PARSER TİPLERİ
// ============================================

export interface TemplateMap {
  studentNo: { start: number; end: number };
  tc: { start: number; end: number };
  name: { start: number; end: number };
  booklet: { start: number; end: number };
  answers: { start: number; end: number };
  // Opsiyonel alanlar
  classCode?: { start: number; end: number };
  school?: { start: number; end: number };
  gender?: { start: number; end: number };  // Cinsiyet (E/K)
}

export interface ParsedStudent {
  lineNumber: number;
  rawLine: string;
  status: ParseStatus;
  conflictReason?: string;
  
  // Çıkarılan veriler
  studentNo: string;
  tc: string;
  name: string;
  booklet: BookletType | null;
  answers: string;
  
  // Opsiyonel
  classCode?: string;
  school?: string;
  gender?: 'E' | 'K' | string;  // Cinsiyet (E = Erkek, K = Kız)
}

export interface ParseResult {
  success: boolean;
  totalLines: number;
  successCount: number;
  conflictCount: number;
  failedCount: number;
  students: ParsedStudent[];
  conflicts: ParsedStudent[];
  errors: string[];
}

// ============================================
// 📝 CEVAP ANAHTARI TİPLERİ
// ============================================

export interface AnswerKeyItem {
  questionNo: number;
  correctAnswer: AnswerOption;
  subjectId: string;
  kazanimId?: string;
  kazanimName?: string;
  difficulty?: 'KOLAY' | 'ORTA' | 'ZOR';
}

export interface AnswerKey {
  examId: string;
  examType: ExamType;
  booklet: BookletType;
  answers: AnswerKeyItem[];
  createdAt: Date;
}

// ============================================
// 📈 DEĞERLENDİRME TİPLERİ
// ============================================

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number; // Doğru - (Yanlış / penalty)
  weightedScore: number; // Net * Katsayı
  percentage: number; // Başarı yüzdesi
}

export interface StudentResult {
  studentNo: string;
  tc: string;
  name: string;
  booklet: BookletType | null;
  
  // Genel sonuçlar
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  totalNet: number;
  totalScore: number;
  
  // Ders bazlı sonuçlar
  subjects: SubjectResult[];
  
  // Sıralama
  rank: number;
  percentile: number; // Yüzdelik dilim
  
  // Metadata
  evaluatedAt: Date;
  examId: string;
}

export interface EvaluationResult {
  examId: string;
  examType: ExamType;
  examName: string;
  evaluatedAt: Date;
  
  // İstatistikler
  totalStudents: number;
  averageNet: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  standardDeviation: number;
  
  // Sonuçlar
  results: StudentResult[];
  
  // Ders bazlı istatistikler
  subjectStats: {
    subjectId: string;
    subjectName: string;
    averageNet: number;
    averagePercentage: number;
    hardestQuestions: number[]; // En çok yanlış yapılan sorular
  }[];
}

// ============================================
// 🔍 ÇAKIŞMA TİPLERİ
// ============================================

export type ConflictType = 
  | 'TC_NAME_MISMATCH'      // Aynı TC farklı isim
  | 'STUDENT_NO_DUPLICATE'   // Aynı öğrenci numarası
  | 'TC_DUPLICATE'           // Aynı TC birden fazla
  | 'INVALID_TC'             // Geçersiz TC formatı
  | 'MALFORMED_LINE'         // Bozuk satır
  | 'MISSING_REQUIRED'       // Zorunlu alan eksik
  | 'INVALID_ANSWERS';       // Geçersiz cevap formatı

export interface Conflict {
  type: ConflictType;
  studentNo: string;
  tc: string;
  name: string;
  lineNumber: number;
  description: string;
  existingData?: {
    name?: string;
    studentNo?: string;
    tc?: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoResolvable: boolean;
  suggestedAction?: string;
}

export interface ValidationResult {
  isValid: boolean;
  conflicts: Conflict[];
  warnings: string[];
  stats: {
    totalChecked: number;
    validCount: number;
    conflictCount: number;
    warningCount: number;
  };
}

// ============================================
// 💾 VERİTABANI TİPLERİ
// ============================================

export interface BatchSaveResult {
  success: boolean;
  insertedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: { studentNo: string; error: string }[];
  duration: number; // ms cinsinden
}

// ============================================
// 📋 AUDIT LOG TİPLERİ
// ============================================

export type AuditAction = 
  | 'PARSE_START'
  | 'PARSE_COMPLETE'
  | 'PARSE_ERROR'
  | 'EVALUATE_START'
  | 'EVALUATE_COMPLETE'
  | 'CONFLICT_DETECTED'
  | 'CONFLICT_RESOLVED'
  | 'BATCH_SAVE'
  | 'ANSWER_KEY_UPLOAD'
  | 'MANUAL_CORRECTION';

export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  organizationId: string;
  examId?: string;
  details: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
}

// ============================================
// 📦 SINAV ŞABLONLARI
// ============================================

export const EXAM_CONFIGS: Record<ExamType, ExamConfig> = {
  LGS: {
    type: 'LGS',
    name: 'Liselere Geçiş Sınavı',
    totalQuestions: 90,
    wrongPenalty: 3, // 3 yanlış = 1 doğru
    maxScore: 500,
    subjects: [
      { id: 'turkce', name: 'Türkçe', questionCount: 20, coefficient: 4, startIndex: 0, endIndex: 19 },
      { id: 'matematik', name: 'Matematik', questionCount: 20, coefficient: 4, startIndex: 20, endIndex: 39 },
      { id: 'fen', name: 'Fen Bilimleri', questionCount: 20, coefficient: 4, startIndex: 40, endIndex: 59 },
      { id: 'inkilap', name: 'T.C. İnkılap Tarihi', questionCount: 10, coefficient: 1, startIndex: 60, endIndex: 69 },
      { id: 'din', name: 'Din Kültürü', questionCount: 10, coefficient: 1, startIndex: 70, endIndex: 79 },
      { id: 'ingilizce', name: 'Yabancı Dil', questionCount: 10, coefficient: 1, startIndex: 80, endIndex: 89 },
    ],
  },
  TYT: {
    type: 'TYT',
    name: 'Temel Yeterlilik Testi',
    totalQuestions: 120,
    wrongPenalty: 4, // 4 yanlış = 1 doğru
    maxScore: 500,
    subjects: [
      { id: 'turkce', name: 'Türkçe', questionCount: 40, coefficient: 2.9, startIndex: 0, endIndex: 39 },
      { id: 'matematik', name: 'Temel Matematik', questionCount: 40, coefficient: 2.92, startIndex: 40, endIndex: 79 },
      { id: 'fen', name: 'Fen Bilimleri', questionCount: 20, coefficient: 3.14, startIndex: 80, endIndex: 99 },
      { id: 'sosyal', name: 'Sosyal Bilimler', questionCount: 20, coefficient: 2.93, startIndex: 100, endIndex: 119 },
    ],
  },
  AYT: {
    type: 'AYT',
    name: 'Alan Yeterlilik Testi',
    totalQuestions: 160,
    wrongPenalty: 4,
    maxScore: 500,
    subjects: [
      // Sayısal
      { id: 'ayt-mat', name: 'Matematik', questionCount: 40, coefficient: 3, startIndex: 0, endIndex: 39 },
      { id: 'fizik', name: 'Fizik', questionCount: 14, coefficient: 2.85, startIndex: 40, endIndex: 53 },
      { id: 'kimya', name: 'Kimya', questionCount: 13, coefficient: 3.07, startIndex: 54, endIndex: 66 },
      { id: 'biyoloji', name: 'Biyoloji', questionCount: 13, coefficient: 3.07, startIndex: 67, endIndex: 79 },
      // Eşit Ağırlık / Sözel
      { id: 'edebiyat', name: 'Türk Dili ve Edebiyatı', questionCount: 40, coefficient: 3, startIndex: 80, endIndex: 119 },
      { id: 'tarih1', name: 'Tarih-1', questionCount: 10, coefficient: 2.8, startIndex: 120, endIndex: 129 },
      { id: 'cografya1', name: 'Coğrafya-1', questionCount: 6, coefficient: 3.33, startIndex: 130, endIndex: 135 },
      { id: 'tarih2', name: 'Tarih-2', questionCount: 11, coefficient: 2.91, startIndex: 136, endIndex: 146 },
      { id: 'cografya2', name: 'Coğrafya-2', questionCount: 11, coefficient: 2.91, startIndex: 147, endIndex: 157 },
      { id: 'felsefe', name: 'Felsefe', questionCount: 12, coefficient: 3, startIndex: 158, endIndex: 169 },
    ],
  },
  DİL: {
    type: 'DİL',
    name: 'Yabancı Dil Testi',
    totalQuestions: 80,
    wrongPenalty: 4,
    maxScore: 500,
    subjects: [
      { id: 'ydt', name: 'Yabancı Dil Testi', questionCount: 80, coefficient: 3, startIndex: 0, endIndex: 79 },
    ],
  },
  DENEME: {
    type: 'DENEME',
    name: 'Kurum İçi Deneme',
    totalQuestions: 100,
    wrongPenalty: 4,
    maxScore: 100,
    subjects: [], // Dinamik olarak belirlenir
  },
};

