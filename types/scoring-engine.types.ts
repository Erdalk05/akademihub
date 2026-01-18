// ============================================================================
// SCORING ENGINE - DOMAIN TYPES (v1.0)
// Pure TypeScript types for assessment scoring logic
// Framework-agnostic, database-agnostic
// ============================================================================

/**
 * Cevap seçeneği (A-E arası)
 */
export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E' | null;

/**
 * Kitapçık tipi (A/B/C/D)
 */
export type BookletType = 'A' | 'B' | 'C' | 'D';

/**
 * Sınav cevap anahtarındaki bir soru
 */
export interface QuestionAnswer {
  /** Soru numarası (1-based) */
  questionNumber: number;
  
  /** Doğru cevap (A-E veya null eğer iptal) */
  correctAnswer: AnswerOption;
  
  /** Hangi derse ait (TUR, MAT, FEN, vs.) */
  lessonCode: string;
  
  /** İptal edilmiş soru mu? */
  isCancelled: boolean;
  
  /** Kitapçık bazlı cevaplar (opsiyonel) */
  bookletAnswers?: Record<BookletType, AnswerOption>;
}

/**
 * Öğrencinin bir soruya verdiği cevap
 */
export interface StudentAnswer {
  /** Soru numarası */
  questionNumber: number;
  
  /** Öğrencinin işaretlediği cevap */
  markedAnswer: AnswerOption;
  
  /** Öğrencinin kitapçık tipi */
  bookletType: BookletType;
}

/**
 * İptal edilmiş soru tanımı
 */
export interface CancelledQuestion {
  questionNumber: number;
  lessonCode: string;
}

/**
 * Puanlama ön ayarı (LGS, TYT, AYT için kural seti)
 */
export interface ScoringPreset {
  /** Preset adı (örn: "LGS", "TYT", "Custom") */
  name: string;
  
  /** Doğru cevap puanı */
  correctPoints: number;
  
  /** Yanlış cevap puanı (negatif) */
  wrongPoints: number;
  
  /** Boş cevap puanı */
  emptyPoints: number;
  
  /** Kaç yanlış bir doğruyu götürür? (örn: 3 veya 4) */
  wrongCancelsCorrect: number;
}

/**
 * Ders bazlı sınav sonucu (bir ders için detaylar)
 */
export interface LessonBreakdown {
  /** Ders kodu (TUR, MAT, FEN, vb.) */
  lessonCode: string;
  
  /** Doğru sayısı */
  correct: number;
  
  /** Yanlış sayısı */
  wrong: number;
  
  /** Boş sayısı */
  empty: number;
  
  /** Net (doğru - yanlış/N) */
  net: number;
  
  /** Puan (varsa ağırlıklandırılmış) */
  score: number;
  
  /** Toplam soru sayısı */
  totalQuestions: number;
}

/**
 * Nihai puanlama sonucu (bir öğrenci için)
 */
export interface ScoringResult {
  /** Öğrenci kimliği (opsiyonel, dışardan verilir) */
  studentId?: string;
  
  /** Kullanılan kitapçık */
  bookletType: BookletType;
  
  /** Toplam doğru */
  totalCorrect: number;
  
  /** Toplam yanlış */
  totalWrong: number;
  
  /** Toplam boş */
  totalEmpty: number;
  
  /** Toplam net */
  totalNet: number;
  
  /** Toplam puan */
  totalScore: number;
  
  /** Ders bazlı kırılım */
  lessonBreakdowns: LessonBreakdown[];
  
  /** Puanlama sırasında kullanılan preset */
  appliedPreset: string;
}

/**
 * Puanlama motoru için giriş parametreleri
 */
export interface ScoringInput {
  /** Sınav cevap anahtarı (tüm sorular) */
  answerKey: QuestionAnswer[];
  
  /** Öğrencinin cevapları */
  studentAnswers: StudentAnswer[];
  
  /** Kullanılacak puanlama preset'i */
  preset: ScoringPreset;
  
  /** Öğrenci kimliği (opsiyonel) */
  studentId?: string;
}
