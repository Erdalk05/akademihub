/**
 * ============================================
 * AkademiHub - Exam Validation Layer
 * ============================================
 * 
 * Zod ile tip güvenli validasyon.
 * Optik okuyucu hatalarını yakalar.
 * Geçersiz verilerin sisteme girmesini engeller.
 * 
 * KURAL: DOĞRULUK > HIZ > GÖRSELLIK
 */

import { z } from 'zod';

// ==================== TEMEL TİPLER ====================

/**
 * Geçerli cevap seçenekleri
 * Sadece A, B, C, D, E veya null (boş) kabul edilir
 */
export const AnswerOptionSchema = z.union([
  z.literal('A'),
  z.literal('B'),
  z.literal('C'),
  z.literal('D'),
  z.literal('E'),
  z.null()
]).describe('Geçerli cevap: A, B, C, D, E veya boş');

/**
 * Sınav durumu
 */
export const ExamStatusSchema = z.enum([
  'draft',
  'scheduled', 
  'active',
  'completed',
  'cancelled'
]);

/**
 * Bloom Taksonomisi seviyesi (1-6)
 */
export const CognitiveLevelSchema = z.number()
  .int()
  .min(1, 'Bilişsel seviye 1-6 arasında olmalı')
  .max(6, 'Bilişsel seviye 1-6 arasında olmalı');

/**
 * Zorluk seviyesi (0.0 - 1.0)
 */
export const DifficultySchema = z.number()
  .min(0, 'Zorluk 0-1 arasında olmalı')
  .max(1, 'Zorluk 0-1 arasında olmalı');

// ==================== SINAV TİPİ VALİDASYONU ====================

export const ExamTypeSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  wrongPenaltyDivisor: z.number().min(1).max(10),
  totalQuestions: z.number().int().min(1).max(500).optional(),
  totalDurationMinutes: z.number().int().min(1).max(600).optional(),
  scoreWeights: z.record(z.number()).optional()
});

// ==================== DERS VALİDASYONU ====================

export const SubjectSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  shortName: z.string().max(10).optional(),
  questionCount: z.number().int().min(1).max(100),
  questionStartNo: z.number().int().min(1),
  questionEndNo: z.number().int().min(1),
  weight: z.number().min(0).max(10).default(1),
  displayOrder: z.number().int().min(0).default(0)
}).refine(
  data => data.questionEndNo >= data.questionStartNo,
  { message: 'Bitiş numarası başlangıçtan büyük veya eşit olmalı' }
).refine(
  data => data.questionEndNo - data.questionStartNo + 1 === data.questionCount,
  { message: 'Soru sayısı aralıkla uyuşmuyor' }
);

// ==================== SINAV VALİDASYONU ====================

export const CreateExamSchema = z.object({
  examTypeId: z.string().uuid('Geçerli sınav tipi ID gerekli'),
  academicYearId: z.string().uuid().optional(),
  name: z.string().min(1, 'Sınav adı gerekli').max(200),
  code: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  examDate: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Saat formatı HH:MM olmalı').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Saat formatı HH:MM olmalı').optional(),
  totalQuestions: z.number().int().min(1).max(500),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  targetClasses: z.array(z.string()).optional(),
  organizationId: z.string().uuid('Organizasyon ID gerekli')
});

export const UpdateExamSchema = CreateExamSchema.partial().omit({ 
  organizationId: true,
  examTypeId: true 
});

// ==================== CEVAP ANAHTARI VALİDASYONU ====================

/**
 * Cevap anahtarı validasyonu
 * Her soru için tek bir geçerli cevap
 */
export const AnswerKeySchema = z.record(
  z.string().regex(/^\d+$/, 'Soru numarası sayı olmalı'),
  AnswerOptionSchema
).refine(
  data => Object.keys(data).length > 0,
  { message: 'En az bir cevap gerekli' }
);

/**
 * Cevap anahtarını sınav yapısına göre doğrular
 */
export function validateAnswerKey(
  answerKey: Record<string, string | null>,
  totalQuestions: number,
  subjectRanges?: Array<{ startNo: number; endNo: number }>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  const questionNos = Object.keys(answerKey).map(Number);
  
  // Soru numarası kontrolü
  for (const qNo of questionNos) {
    if (qNo < 1 || qNo > totalQuestions) {
      errors.push({
        code: 'QUESTION_OUT_OF_RANGE',
        message: `Soru ${qNo} geçersiz. 1-${totalQuestions} arasında olmalı.`,
        field: 'answerKey',
        value: qNo.toString()
      });
    }
  }
  
  // Eksik soru kontrolü
  for (let i = 1; i <= totalQuestions; i++) {
    if (!(i.toString() in answerKey)) {
      warnings.push(`Soru ${i} için cevap tanımlı değil`);
    }
  }
  
  // Geçerli cevap kontrolü
  for (const [qNo, answer] of Object.entries(answerKey)) {
    if (answer !== null && !['A', 'B', 'C', 'D', 'E'].includes(answer)) {
      errors.push({
        code: 'INVALID_ANSWER',
        message: `Soru ${qNo} için geçersiz cevap: ${answer}`,
        field: 'answerKey',
        value: answer
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ==================== ÖĞRENCİ CEVAP VALİDASYONU ====================

export const StudentAnswerSchema = z.object({
  questionNo: z.number().int().min(1),
  answer: AnswerOptionSchema
});

export const BulkAnswerInputSchema = z.object({
  examId: z.string().uuid('Geçerli sınav ID gerekli'),
  studentId: z.string().uuid('Geçerli öğrenci ID gerekli'),
  answers: z.array(StudentAnswerSchema).min(1, 'En az bir cevap gerekli'),
  entryMethod: z.enum(['manual', 'optical', 'api']).default('manual')
});

// ==================== OPTİK VERİ VALİDASYONU ====================

/**
 * Optik okuyucu string formatı
 * Her karakter bir cevabı temsil eder
 * A, B, C, D, E = cevap
 * _ = boş
 * X = çift işaretleme
 * ? = belirsiz
 */
export const OpticalStringSchema = z.string()
  .regex(/^[ABCDE_X?]+$/, 'Geçersiz optik format. Sadece A,B,C,D,E,_,X,? karakterleri kabul edilir');

export const OpticalScanInputSchema = z.object({
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
  rawString: OpticalStringSchema,
  scannerDevice: z.string().optional(),
  scannerVersion: z.string().optional(),
  scanTimestamp: z.coerce.date().optional(),
  scanQualityScore: z.number().min(0).max(1).optional(),
  formType: z.enum(['A', 'B', 'C', 'D']).optional()
});

/**
 * Optik string'i cevap dizisine dönüştürür
 * Çift işaretleme ve belirsiz işaretleri tespit eder
 */
export function parseOpticalString(
  rawString: string,
  totalQuestions: number
): OpticalParseResult {
  const answers: Array<{ questionNo: number; answer: string | null }> = [];
  const issues: OpticalIssue[] = [];
  
  // Uzunluk kontrolü
  if (rawString.length !== totalQuestions) {
    issues.push({
      type: 'LENGTH_MISMATCH',
      message: `Beklenen ${totalQuestions} cevap, alınan ${rawString.length}`,
      severity: 'error'
    });
  }
  
  for (let i = 0; i < rawString.length && i < totalQuestions; i++) {
    const char = rawString[i];
    const questionNo = i + 1;
    
    switch (char) {
      case 'A':
      case 'B':
      case 'C':
      case 'D':
      case 'E':
        answers.push({ questionNo, answer: char });
        break;
        
      case '_':
        // Boş bırakılmış
        answers.push({ questionNo, answer: null });
        break;
        
      case 'X':
        // Çift işaretleme
        answers.push({ questionNo, answer: null });
        issues.push({
          type: 'DOUBLE_MARK',
          questionNo,
          message: `Soru ${questionNo}: Çift işaretleme tespit edildi`,
          severity: 'warning'
        });
        break;
        
      case '?':
        // Belirsiz işaret
        answers.push({ questionNo, answer: null });
        issues.push({
          type: 'AMBIGUOUS_MARK',
          questionNo,
          message: `Soru ${questionNo}: Belirsiz işaretleme`,
          severity: 'warning'
        });
        break;
        
      default:
        // Bilinmeyen karakter
        answers.push({ questionNo, answer: null });
        issues.push({
          type: 'INVALID_MARK',
          questionNo,
          message: `Soru ${questionNo}: Geçersiz işaret '${char}'`,
          severity: 'error'
        });
    }
  }
  
  // Eksik sorular
  for (let i = rawString.length; i < totalQuestions; i++) {
    answers.push({ questionNo: i + 1, answer: null });
    issues.push({
      type: 'MISSING_ANSWER',
      questionNo: i + 1,
      message: `Soru ${i + 1}: Veri eksik`,
      severity: 'warning'
    });
  }
  
  return {
    answers,
    issues,
    hasErrors: issues.some(i => i.severity === 'error'),
    hasWarnings: issues.some(i => i.severity === 'warning'),
    summary: {
      total: totalQuestions,
      answered: answers.filter(a => a.answer !== null).length,
      empty: answers.filter(a => a.answer === null).length,
      doubleMarks: issues.filter(i => i.type === 'DOUBLE_MARK').length,
      ambiguous: issues.filter(i => i.type === 'AMBIGUOUS_MARK').length,
      invalid: issues.filter(i => i.type === 'INVALID_MARK').length
    }
  };
}

// ==================== DERS BAZLI VALİDASYON ====================

/**
 * Ders sınırlarını kontrol eder
 * Örn: LGS Matematik max 20 doğru olabilir
 */
export function validateSubjectLimits(
  subjectCode: string,
  correct: number,
  wrong: number,
  empty: number,
  maxQuestions: number
): ValidationResult {
  const errors: ValidationError[] = [];
  const total = correct + wrong + empty;
  
  if (correct < 0) {
    errors.push({
      code: 'NEGATIVE_VALUE',
      message: `${subjectCode}: Doğru sayısı negatif olamaz`,
      field: 'correct',
      value: correct.toString()
    });
  }
  
  if (wrong < 0) {
    errors.push({
      code: 'NEGATIVE_VALUE',
      message: `${subjectCode}: Yanlış sayısı negatif olamaz`,
      field: 'wrong',
      value: wrong.toString()
    });
  }
  
  if (empty < 0) {
    errors.push({
      code: 'NEGATIVE_VALUE',
      message: `${subjectCode}: Boş sayısı negatif olamaz`,
      field: 'empty',
      value: empty.toString()
    });
  }
  
  if (correct > maxQuestions) {
    errors.push({
      code: 'OVER_LIMIT',
      message: `${subjectCode}: Doğru sayısı (${correct}) maksimum soru sayısını (${maxQuestions}) aşıyor`,
      field: 'correct',
      value: correct.toString()
    });
  }
  
  if (total > maxQuestions) {
    errors.push({
      code: 'TOTAL_OVER_LIMIT',
      message: `${subjectCode}: Toplam (${total}) maksimum soru sayısını (${maxQuestions}) aşıyor`,
      field: 'total',
      value: total.toString()
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

// ==================== NET HESAPLAMA VALİDASYONU ====================

/**
 * Net hesaplama öncesi validasyon
 * Geçersiz değerlerle hesaplama yapılmasını engeller
 */
export function validateNetCalculation(
  correct: number,
  wrong: number,
  empty: number,
  totalQuestions: number,
  wrongPenaltyDivisor: number
): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Temel kontroller
  if (!Number.isInteger(correct) || correct < 0) {
    errors.push({
      code: 'INVALID_CORRECT',
      message: 'Doğru sayısı pozitif tam sayı olmalı',
      field: 'correct',
      value: String(correct)
    });
  }
  
  if (!Number.isInteger(wrong) || wrong < 0) {
    errors.push({
      code: 'INVALID_WRONG',
      message: 'Yanlış sayısı pozitif tam sayı olmalı',
      field: 'wrong',
      value: String(wrong)
    });
  }
  
  if (!Number.isInteger(empty) || empty < 0) {
    errors.push({
      code: 'INVALID_EMPTY',
      message: 'Boş sayısı pozitif tam sayı olmalı',
      field: 'empty',
      value: String(empty)
    });
  }
  
  // Toplam kontrolü
  const total = correct + wrong + empty;
  if (total !== totalQuestions) {
    errors.push({
      code: 'TOTAL_MISMATCH',
      message: `Doğru(${correct}) + Yanlış(${wrong}) + Boş(${empty}) = ${total}, beklenen: ${totalQuestions}`,
      field: 'total',
      value: String(total)
    });
  }
  
  // Ceza böleni kontrolü
  if (wrongPenaltyDivisor !== 3 && wrongPenaltyDivisor !== 4) {
    errors.push({
      code: 'INVALID_PENALTY',
      message: 'Yanlış ceza böleni 3 (LGS) veya 4 (TYT/AYT) olmalı',
      field: 'wrongPenaltyDivisor',
      value: String(wrongPenaltyDivisor)
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

// ==================== TİP TANIMLARI ====================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: string;
}

export interface OpticalIssue {
  type: 'DOUBLE_MARK' | 'AMBIGUOUS_MARK' | 'INVALID_MARK' | 'MISSING_ANSWER' | 'LENGTH_MISMATCH';
  questionNo?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface OpticalParseResult {
  answers: Array<{ questionNo: number; answer: string | null }>;
  issues: OpticalIssue[];
  hasErrors: boolean;
  hasWarnings: boolean;
  summary: {
    total: number;
    answered: number;
    empty: number;
    doubleMarks: number;
    ambiguous: number;
    invalid: number;
  };
}

// ==================== LGS SPESİFİK VALİDASYON ====================

export const LGS_SUBJECTS = {
  TUR: { name: 'Türkçe', start: 1, end: 20, max: 20 },
  MAT: { name: 'Matematik', start: 21, end: 40, max: 20 },
  FEN: { name: 'Fen Bilimleri', start: 41, end: 60, max: 20 },
  INK: { name: 'İnkılap Tarihi', start: 61, end: 70, max: 10 },
  DIN: { name: 'Din Kültürü', start: 71, end: 80, max: 10 },
  ING: { name: 'İngilizce', start: 81, end: 90, max: 10 }
} as const;

export const LGS_TOTAL_QUESTIONS = 90;
export const LGS_WRONG_PENALTY = 3;

export function validateLGSResult(
  subjectResults: Record<string, { correct: number; wrong: number; empty: number }>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  for (const [code, subject] of Object.entries(LGS_SUBJECTS)) {
    const result = subjectResults[code];
    if (!result) {
      warnings.push(`${subject.name} sonucu eksik`);
      continue;
    }
    
    const validation = validateSubjectLimits(
      code,
      result.correct,
      result.wrong,
      result.empty,
      subject.max
    );
    
    errors.push(...validation.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ==================== TYT SPESİFİK VALİDASYON ====================

export const TYT_SUBJECTS = {
  TUR: { name: 'Türkçe', start: 1, end: 40, max: 40 },
  SOS: { name: 'Sosyal Bilimler', start: 41, end: 60, max: 20 },
  MAT: { name: 'Temel Matematik', start: 61, end: 100, max: 40 },
  FEN: { name: 'Fen Bilimleri', start: 101, end: 120, max: 20 }
} as const;

export const TYT_TOTAL_QUESTIONS = 120;
export const TYT_WRONG_PENALTY = 4;

// ==================== EXPORT ====================

export default {
  // Schemas
  AnswerOptionSchema,
  ExamStatusSchema,
  ExamTypeSchema,
  SubjectSchema,
  CreateExamSchema,
  UpdateExamSchema,
  AnswerKeySchema,
  StudentAnswerSchema,
  BulkAnswerInputSchema,
  OpticalStringSchema,
  OpticalScanInputSchema,
  
  // Functions
  validateAnswerKey,
  parseOpticalString,
  validateSubjectLimits,
  validateNetCalculation,
  validateLGSResult,
  
  // Constants
  LGS_SUBJECTS,
  LGS_TOTAL_QUESTIONS,
  LGS_WRONG_PENALTY,
  TYT_SUBJECTS,
  TYT_TOTAL_QUESTIONS,
  TYT_WRONG_PENALTY
};
